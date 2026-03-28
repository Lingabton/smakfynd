/**
 * Smakfynd Weekly Analytics Report
 * Runs every Monday 07:00 UTC, emails report via Resend.
 */

async function q(db, sql) {
  try {
    const r = await db.prepare(sql).all();
    return r.results || [];
  } catch (e) {
    return [];
  }
}

function pct(n, total) {
  if (!total) return "0%";
  return Math.round((n / total) * 100) + "%";
}

async function buildReport(db) {
  const days = 7;

  // Core metrics
  const [overview] = await q(db,
    `SELECT COUNT(DISTINCT session) as sessions, COUNT(*) as events FROM events WHERE ts >= datetime('now', '-${days} days')`);

  const [prevOverview] = await q(db,
    `SELECT COUNT(DISTINCT session) as sessions, COUNT(*) as events FROM events WHERE ts >= datetime('now', '-${days * 2} days') AND ts < datetime('now', '-${days} days')`);

  // Device split
  const devices = await q(db,
    `SELECT device, COUNT(DISTINCT session) as n FROM events WHERE ts >= datetime('now', '-${days} days') GROUP BY device ORDER BY n DESC`);

  // Event breakdown
  const events = await q(db,
    `SELECT event, COUNT(*) as n FROM events WHERE ts >= datetime('now', '-${days} days') GROUP BY event ORDER BY n DESC`);

  // Top wines
  const topWines = await q(db,
    `SELECT json_extract(data, '$.name') as name, json_extract(data, '$.nr') as nr,
            json_extract(data, '$.score') as score, COUNT(*) as clicks
     FROM events WHERE event='click' AND ts >= datetime('now', '-${days} days')
     GROUP BY nr ORDER BY clicks DESC LIMIT 10`);

  // SB clicks (purchase intent)
  const [sbClicks] = await q(db,
    `SELECT COUNT(*) as n FROM events WHERE event='sb_click' AND ts >= datetime('now', '-${days} days')`);

  // Searches
  const searches = await q(db,
    `SELECT query, COUNT(*) as n FROM searches WHERE ts >= datetime('now', '-${days} days') GROUP BY query ORDER BY n DESC LIMIT 10`);
  const [searchTotal] = await q(db,
    `SELECT COUNT(*) as n FROM searches WHERE ts >= datetime('now', '-${days} days')`);

  // AI usage
  const [aiTotal] = await q(db,
    `SELECT COUNT(*) as n FROM ai_logs WHERE ts >= datetime('now', '-${days} days')`);
  const aiMeals = await q(db,
    `SELECT meal, COUNT(*) as n FROM ai_logs WHERE ts >= datetime('now', '-${days} days') GROUP BY meal ORDER BY n DESC LIMIT 5`);

  // Daily trend
  const daily = await q(db,
    `SELECT date(ts) as day, COUNT(DISTINCT session) as sessions, COUNT(*) as events
     FROM events WHERE ts >= datetime('now', '-${days} days')
     GROUP BY day ORDER BY day ASC`);

  // Shares & saves
  const [shares] = await q(db,
    `SELECT COUNT(*) as n FROM events WHERE event='share' AND ts >= datetime('now', '-${days} days')`);
  const [saves] = await q(db,
    `SELECT COUNT(*) as n FROM events WHERE event='save' AND ts >= datetime('now', '-${days} days')`);

  // Filter usage
  const filters = await q(db,
    `SELECT json_extract(data, '$.type') as filter_type, COUNT(*) as n
     FROM events WHERE event='filter' AND ts >= datetime('now', '-${days} days')
     GROUP BY filter_type ORDER BY n DESC LIMIT 5`);

  // Week-over-week change
  const sessionDelta = prevOverview?.sessions
    ? Math.round(((overview.sessions - prevOverview.sessions) / prevOverview.sessions) * 100)
    : null;
  const deltaStr = sessionDelta !== null
    ? `${sessionDelta >= 0 ? "+" : ""}${sessionDelta}% vs förra veckan`
    : "Första veckan med data";

  // Build HTML
  const maxDaily = Math.max(...daily.map(d => d.sessions), 1);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f7f3ec;font-family:-apple-system,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 20px">

  <div style="margin-bottom:24px">
    <span style="font-family:Georgia,serif;font-size:22px;color:#7a2332">Smakfynd</span>
    <span style="font-size:13px;color:#7a7060;margin-left:8px">Veckorapport</span>
  </div>

  <!-- KPIs -->
  <div style="display:flex;gap:12px;margin-bottom:20px">
    ${[
      ["Sessioner", overview?.sessions || 0, deltaStr],
      ["Events", overview?.events || 0, ""],
      ["SB-klick", sbClicks?.n || 0, "köpintention"],
      ["AI-frågor", aiTotal?.n || 0, ""],
    ].map(([label, val, sub]) => `
      <div style="flex:1;padding:14px;border-radius:12px;background:#fff;border:1px solid #e6ddd0;text-align:center">
        <div style="font-size:24px;font-weight:700;color:#1e1710;font-family:Georgia,serif">${val}</div>
        <div style="font-size:11px;color:#7a7060;margin-top:2px">${label}</div>
        ${sub ? `<div style="font-size:10px;color:#9a9080;margin-top:2px">${sub}</div>` : ""}
      </div>
    `).join("")}
  </div>

  <!-- Daily trend -->
  <div style="padding:16px;border-radius:12px;background:#fff;border:1px solid #e6ddd0;margin-bottom:16px">
    <div style="font-size:12px;font-weight:600;color:#1e1710;margin-bottom:10px">Daglig trend</div>
    ${daily.map(d => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="font-size:11px;color:#7a7060;width:70px">${d.day.slice(5)}</span>
        <div style="flex:1;height:16px;border-radius:4px;background:#f0ebe3;overflow:hidden">
          <div style="width:${Math.round((d.sessions / maxDaily) * 100)}%;height:100%;background:linear-gradient(90deg,#7a2332,#a83a4e);border-radius:4px"></div>
        </div>
        <span style="font-size:11px;color:#4a4238;width:60px;text-align:right">${d.sessions} sess.</span>
      </div>
    `).join("")}
  </div>

  <!-- Devices -->
  <div style="padding:16px;border-radius:12px;background:#fff;border:1px solid #e6ddd0;margin-bottom:16px">
    <div style="font-size:12px;font-weight:600;color:#1e1710;margin-bottom:8px">Enheter</div>
    <div style="display:flex;gap:12px">
      ${devices.map(d => `
        <div style="font-size:13px;color:#4a4238"><strong>${d.n}</strong> ${d.device}</div>
      `).join("")}
    </div>
  </div>

  <!-- Top wines -->
  ${topWines.length > 0 ? `
  <div style="padding:16px;border-radius:12px;background:#fff;border:1px solid #e6ddd0;margin-bottom:16px">
    <div style="font-size:12px;font-weight:600;color:#1e1710;margin-bottom:10px">Mest klickade viner</div>
    ${topWines.map((w, i) => `
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0ebe3">
        <span style="font-size:12px;color:#4a4238">${i + 1}. ${w.name || "?"}</span>
        <span style="font-size:12px;color:#7a7060">${w.clicks} klick</span>
      </div>
    `).join("")}
  </div>` : ""}

  <!-- Searches -->
  ${searches.length > 0 ? `
  <div style="padding:16px;border-radius:12px;background:#fff;border:1px solid #e6ddd0;margin-bottom:16px">
    <div style="font-size:12px;font-weight:600;color:#1e1710;margin-bottom:8px">Sökningar (${searchTotal?.n || 0} totalt)</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${searches.map(s => `
        <span style="font-size:11px;padding:4px 10px;border-radius:100px;background:#f0ebe3;color:#4a4238">${s.query} (${s.n})</span>
      `).join("")}
    </div>
  </div>` : ""}

  <!-- AI meals -->
  ${aiMeals.length > 0 ? `
  <div style="padding:16px;border-radius:12px;background:#fff;border:1px solid #e6ddd0;margin-bottom:16px">
    <div style="font-size:12px;font-weight:600;color:#1e1710;margin-bottom:8px">AI-matchningar</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${aiMeals.map(m => `
        <span style="font-size:11px;padding:4px 10px;border-radius:100px;background:#e8f0e4;color:#2d6b3f">${m.meal} (${m.n})</span>
      `).join("")}
    </div>
  </div>` : ""}

  <!-- Filters -->
  ${filters.length > 0 ? `
  <div style="padding:16px;border-radius:12px;background:#fff;border:1px solid #e6ddd0;margin-bottom:16px">
    <div style="font-size:12px;font-weight:600;color:#1e1710;margin-bottom:8px">Filter-användning</div>
    ${filters.map(f => `
      <span style="font-size:11px;color:#4a4238">${f.filter_type}: ${f.n}x &nbsp;</span>
    `).join("")}
  </div>` : ""}

  <!-- Engagement -->
  <div style="padding:16px;border-radius:12px;background:#fff;border:1px solid #e6ddd0;margin-bottom:16px">
    <div style="font-size:12px;font-weight:600;color:#1e1710;margin-bottom:8px">Engagemang</div>
    <div style="font-size:12px;color:#4a4238;line-height:1.8">
      Delningar: <strong>${shares?.n || 0}</strong> ·
      Sparade: <strong>${saves?.n || 0}</strong> ·
      Klick/session: <strong>${overview?.sessions ? (overview.events / overview.sessions).toFixed(1) : "0"}</strong>
    </div>
  </div>

  <div style="font-size:10px;color:#9a9080;text-align:center;margin-top:20px">
    Smakfynd · Veckorapport genererad ${new Date().toISOString().slice(0, 10)} · Olav Innovation AB
  </div>

</div>
</body></html>`;
}

export default {
  // Cron trigger — runs every Monday 07:00 UTC
  async scheduled(event, env) {
    const html = await buildReport(env.DB);

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Smakfynd <onboarding@resend.dev>",
        to: [env.REPORT_EMAIL],
        subject: `Smakfynd veckorapport — ${new Date().toLocaleDateString("sv-SE")}`,
        html,
      }),
    });

    if (!res.ok) {
      console.error("Email failed:", await res.text());
    }
  },

  // HTTP trigger — for testing: GET /report
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/report") {
      const html = await buildReport(env.DB);
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/send") {
      // Manual trigger — same as scheduled
      await this.scheduled({}, env);
      return new Response("Report sent!");
    }
    return new Response("Smakfynd Report Worker. GET /report to preview, /send to trigger email.", { status: 200 });
  },
};
