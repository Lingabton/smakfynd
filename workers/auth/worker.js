/**
 * Smakfynd Auth Worker — Simple email-based login
 * No passwords. Email = identity. Saved wines sync across devices.
 *
 * Endpoints:
 *   POST /login    { email, name? }     → { token, user, wines }
 *   POST /save     { token, nr, list }  → { ok }
 *   POST /remove   { token, nr, list }  → { ok }
 *   GET  /wines?token=X                 → { wines: { nr: [lists] } }
 *   POST /sync     { token, wines }     → { ok, merged }
 *   GET  /profile?token=X              → { user }
 */

function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

async function getUserByToken(db, token) {
  if (!token) return null;
  const row = await db.prepare(
    `SELECT u.* FROM users u JOIN user_tokens t ON u.id = t.user_id
     WHERE t.token = ? AND (t.expires_at IS NULL OR t.expires_at > datetime('now'))`
  ).bind(token).first();
  return row;
}

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    const headers = { ...cors, "Content-Type": "application/json" };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    try {
      // POST /login — create or find user, return token + saved wines
      if (request.method === "POST" && url.pathname === "/login") {
        const { email, name } = await request.json();
        if (!email || !email.includes("@")) {
          return new Response(JSON.stringify({ error: "Ogiltig email" }), { status: 400, headers });
        }
        const cleanEmail = email.toLowerCase().trim();

        // Find or create user
        let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
        if (!user) {
          await env.DB.prepare(
            "INSERT INTO users (email, name) VALUES (?, ?)"
          ).bind(cleanEmail, name || null).run();
          user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
        } else {
          await env.DB.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").bind(user.id).run();
        }

        // Create token (valid 90 days)
        const token = generateToken();
        await env.DB.prepare(
          "INSERT INTO user_tokens (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+90 days'))"
        ).bind(token, user.id).run();

        // Get saved wines
        const wineRows = await env.DB.prepare(
          "SELECT wine_nr, list FROM saved_wines WHERE user_id = ?"
        ).bind(user.id).all();

        const wines = {};
        for (const row of wineRows.results) {
          if (!wines[row.wine_nr]) wines[row.wine_nr] = [];
          wines[row.wine_nr].push(row.list);
        }

        return new Response(JSON.stringify({
          token,
          user: { id: user.id, email: user.email, name: user.name },
          wines,
        }), { headers });
      }

      // POST /save — save wine to list
      if (request.method === "POST" && url.pathname === "/save") {
        const { token, nr, list } = await request.json();
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });

        await env.DB.prepare(
          "INSERT OR IGNORE INTO saved_wines (user_id, wine_nr, list) VALUES (?, ?, ?)"
        ).bind(user.id, nr, list || "favoriter").run();

        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // POST /remove — remove wine from list
      if (request.method === "POST" && url.pathname === "/remove") {
        const { token, nr, list } = await request.json();
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });

        await env.DB.prepare(
          "DELETE FROM saved_wines WHERE user_id = ? AND wine_nr = ? AND list = ?"
        ).bind(user.id, nr, list || "favoriter").run();

        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // GET /wines — get all saved wines
      if (request.method === "GET" && url.pathname === "/wines") {
        const token = url.searchParams.get("token");
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });

        const rows = await env.DB.prepare(
          "SELECT wine_nr, list FROM saved_wines WHERE user_id = ?"
        ).bind(user.id).all();

        const wines = {};
        for (const row of rows.results) {
          if (!wines[row.wine_nr]) wines[row.wine_nr] = [];
          wines[row.wine_nr].push(row.list);
        }

        return new Response(JSON.stringify({ wines }), { headers });
      }

      // POST /sync — merge local wines with server
      if (request.method === "POST" && url.pathname === "/sync") {
        const { token, wines } = await request.json();
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });

        // Merge: add all local wines to server (don't remove existing)
        if (wines && typeof wines === "object") {
          const stmt = env.DB.prepare(
            "INSERT OR IGNORE INTO saved_wines (user_id, wine_nr, list) VALUES (?, ?, ?)"
          );
          const batch = [];
          for (const [nr, lists] of Object.entries(wines)) {
            for (const list of (Array.isArray(lists) ? lists : [lists])) {
              batch.push(stmt.bind(user.id, nr, list));
            }
          }
          if (batch.length > 0) await env.DB.batch(batch);
        }

        // Return merged result
        const rows = await env.DB.prepare(
          "SELECT wine_nr, list FROM saved_wines WHERE user_id = ?"
        ).bind(user.id).all();

        const merged = {};
        for (const row of rows.results) {
          if (!merged[row.wine_nr]) merged[row.wine_nr] = [];
          merged[row.wine_nr].push(row.list);
        }

        return new Response(JSON.stringify({ ok: true, wines: merged }), { headers });
      }

      // GET /profile
      if (request.method === "GET" && url.pathname === "/profile") {
        const token = url.searchParams.get("token");
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });
        return new Response(JSON.stringify({ user: { id: user.id, email: user.email, name: user.name, created_at: user.created_at } }), { headers });
      }

      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  },
};
