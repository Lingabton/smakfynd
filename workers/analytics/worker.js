/**
 * Smakfynd Analytics Worker
 * Collects events, AI logs, searches — stores in Cloudflare D1
 * Free tier: 5M rows read/day, 100k rows written/day
 */

// Simple in-memory rate limiter (resets on Worker restart)
const rateLimits = new Map();
function checkRateLimit(ip, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const key = ip || "unknown";
  const entry = rateLimits.get(key);
  if (!entry || now - entry.start > windowMs) {
    rateLimits.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > limit) return false;
  return true;
}

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "https://smakfynd.se",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);
    const headers = { ...cors, "Content-Type": "application/json" };

    // Rate limit POST requests
    const clientIP = request.headers.get("CF-Connecting-IP");
    if (request.method === "POST" && !checkRateLimit(clientIP, 60)) {
      return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers });
    }

    try {
      // POST /event — log a user event
      if (request.method === "POST" && url.pathname === "/event") {
        const body = await request.json();
        const { session, user_id, event, wine_nr, data, page, device, referrer } = body;

        if (!event) {
          return new Response(JSON.stringify({ error: "event required" }), { status: 400, headers });
        }

        await env.DB.prepare(
          `INSERT INTO events (session, user_id, event, wine_nr, data, page, device, referrer)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          session || null, user_id || null, event, wine_nr || null,
          data ? JSON.stringify(data) : null, page || null, device || null, referrer || null
        ).run();

        // Update popular_wines aggregate
        if (wine_nr && ["view", "click", "save", "sb_click", "share"].includes(event)) {
          const today = new Date().toISOString().slice(0, 10);
          const col = event === "view" ? "views" : event === "click" ? "clicks" :
                      event === "save" ? "saves" : event === "sb_click" ? "sb_clicks" : "shares";
          await env.DB.prepare(
            `INSERT INTO popular_wines (date, wine_nr, ${col})
             VALUES (?, ?, 1)
             ON CONFLICT(date, wine_nr) DO UPDATE SET ${col} = ${col} + 1`
          ).bind(today, wine_nr).run();
        }

        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // POST /search — log a search query
      if (request.method === "POST" && url.pathname === "/search") {
        const { session, query, results_count, clicked_nr } = await request.json();
        if (!query) {
          return new Response(JSON.stringify({ error: "query required" }), { status: 400, headers });
        }
        await env.DB.prepare(
          `INSERT INTO searches (session, query, results_count, clicked_nr) VALUES (?, ?, ?, ?)`
        ).bind(session || null, query, results_count || 0, clicked_nr || null).run();
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // POST /ai — log AI interaction
      if (request.method === "POST" && url.pathname === "/ai") {
        const { session, user_id, meal, response, mode, wines_suggested, latency_ms, model } = await request.json();
        await env.DB.prepare(
          `INSERT INTO ai_logs (session, user_id, meal, response, mode, wines_suggested, latency_ms, model)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          session || null, user_id || null, meal || "",
          response ? JSON.stringify(response) : null,
          mode || null, wines_suggested || null, latency_ms || null, model || null
        ).run();
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // POST /prices — bulk insert price snapshot
      if (request.method === "POST" && url.pathname === "/prices") {
        const { date, prices } = await request.json();
        if (!date || !prices) {
          return new Response(JSON.stringify({ error: "date and prices required" }), { status: 400, headers });
        }
        const stmt = env.DB.prepare(
          `INSERT OR IGNORE INTO price_history (snapshot_date, wine_nr, price, assortment) VALUES (?, ?, ?, ?)`
        );
        const batch = prices.map(p => stmt.bind(date, p.nr, p.price, p.assortment || null));
        await env.DB.batch(batch);
        return new Response(JSON.stringify({ ok: true, count: prices.length }), { headers });
      }

      // GET /stats — basic dashboard data
      if (request.method === "GET" && url.pathname === "/stats") {
        const [events, searches, ai, popular] = await Promise.all([
          env.DB.prepare("SELECT COUNT(*) as c FROM events").first(),
          env.DB.prepare("SELECT COUNT(*) as c FROM searches").first(),
          env.DB.prepare("SELECT COUNT(*) as c FROM ai_logs").first(),
          env.DB.prepare(
            `SELECT wine_nr, SUM(views) as views, SUM(clicks) as clicks, SUM(sb_clicks) as sb
             FROM popular_wines WHERE date >= date('now', '-7 days')
             GROUP BY wine_nr ORDER BY views DESC LIMIT 20`
          ).all(),
        ]);
        return new Response(JSON.stringify({
          total_events: events.c,
          total_searches: searches.c,
          total_ai_queries: ai.c,
          top_wines_7d: popular.results,
        }), { headers });
      }

      // GET /top-searches — most common search queries
      if (request.method === "GET" && url.pathname === "/top-searches") {
        const result = await env.DB.prepare(
          `SELECT query, COUNT(*) as count FROM searches
           WHERE ts >= datetime('now', '-30 days')
           GROUP BY LOWER(query) ORDER BY count DESC LIMIT 50`
        ).all();
        return new Response(JSON.stringify(result.results), { headers });
      }

      // GET /ai-queries — recent AI interactions
      if (request.method === "GET" && url.pathname === "/ai-queries") {
        const result = await env.DB.prepare(
          `SELECT meal, mode, wines_suggested, latency_ms, ts
           FROM ai_logs ORDER BY ts DESC LIMIT 100`
        ).all();
        return new Response(JSON.stringify(result.results), { headers });
      }

      // GET /sessions — session duration stats
      if (request.method === "GET" && url.pathname === "/sessions") {
        const result = await env.DB.prepare(
          `SELECT
             COUNT(*) as total_sessions,
             ROUND(AVG(CASE WHEN json_extract(data, '$.duration_s') > 0 THEN json_extract(data, '$.duration_s') END)) as avg_duration_s,
             ROUND(MAX(CASE WHEN json_extract(data, '$.duration_s') > 0 THEN json_extract(data, '$.duration_s') END)) as max_duration_s,
             SUM(CASE WHEN json_extract(data, '$.duration_s') >= 30 THEN 1 ELSE 0 END) as engaged_sessions,
             SUM(CASE WHEN json_extract(data, '$.duration_s') < 10 THEN 1 ELSE 0 END) as bounce_sessions
           FROM events WHERE event = 'session_end' AND ts >= datetime('now', '-30 days')`
        ).first();

        const daily = await env.DB.prepare(
          `SELECT DATE(ts) as day,
             COUNT(*) as sessions,
             ROUND(AVG(json_extract(data, '$.duration_s'))) as avg_s
           FROM events WHERE event = 'session_end' AND ts >= datetime('now', '-14 days')
           GROUP BY DATE(ts) ORDER BY day DESC`
        ).all();

        const byDevice = await env.DB.prepare(
          `SELECT device,
             COUNT(*) as sessions,
             ROUND(AVG(json_extract(data, '$.duration_s'))) as avg_s
           FROM events WHERE event = 'session_end' AND ts >= datetime('now', '-30 days')
           GROUP BY device`
        ).all();

        return new Response(JSON.stringify({
          ...result,
          daily: daily.results,
          by_device: byDevice.results,
        }), { headers });
      }

      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });

    } catch (e) {
      console.error("Analytics error:", e.message);
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  },
};
