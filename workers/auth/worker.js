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

// Rate limiter for login attempts (per email)
const loginAttempts = new Map();
function checkLoginRate(email, maxAttempts = 5, windowMs = 600000) {
  const now = Date.now();
  const entry = loginAttempts.get(email);
  if (!entry || now - entry.start > windowMs) {
    loginAttempts.set(email, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= maxAttempts;
}

// Generate HMAC-based unsubscribe token (no DB needed)
async function generateUnsubToken(email, secret) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email));
  return Array.from(new Uint8Array(sig).slice(0, 16), b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyUnsubToken(email, token, secret) {
  const expected = await generateUnsubToken(email, secret);
  return token === expected;
}

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

function getToken(request, url) {
  // Prefer Authorization header, fall back to query param
  const auth = request.headers.get("Authorization");
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  return url.searchParams.get("token");
}

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "https://smakfynd.se",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    const headers = { ...cors, "Content-Type": "application/json" };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    try {
      // POST /subscribe — frictionless newsletter signup (no verification)
      if (request.method === "POST" && url.pathname === "/subscribe") {
        const { email } = await request.json();
        if (!email || !email.includes("@")) {
          return new Response(JSON.stringify({ error: "Ogiltig email" }), { status: 400, headers });
        }
        const cleanEmail = email.toLowerCase().trim();
        if (!checkLoginRate(cleanEmail, 3)) {
          return new Response(JSON.stringify({ error: "För många försök" }), { status: 429, headers });
        }
        const existing = await env.DB.prepare("SELECT id, newsletter FROM users WHERE email = ?").bind(cleanEmail).first();
        if (existing) {
          if (!existing.newsletter) {
            await env.DB.prepare("UPDATE users SET newsletter = 1, newsletter_consent_at = ? WHERE id = ?")
              .bind(new Date().toISOString(), existing.id).run();
          }
        } else {
          await env.DB.prepare(
            "INSERT INTO users (email, newsletter, newsletter_consent_at) VALUES (?, 1, ?)"
          ).bind(cleanEmail, new Date().toISOString()).run();
        }
        return new Response(JSON.stringify({ ok: true, message: "Prenumeration aktiverad!" }), { headers });
      }

      // POST /login — Step 1: send verification code
      if (request.method === "POST" && url.pathname === "/login") {
        const body = await request.json();
        const { email, name, newsletter, code } = body;
        if (!email || !email.includes("@")) {
          return new Response(JSON.stringify({ error: "Ogiltig email" }), { status: 400, headers });
        }
        const cleanEmail = email.toLowerCase().trim();

        // Rate limit: max 5 login attempts per email per 10 minutes
        if (!checkLoginRate(cleanEmail)) {
          return new Response(JSON.stringify({ error: "För många försök. Vänta några minuter." }), { status: 429, headers });
        }

        // Step 2: verify code and complete login
        if (code) {
          const pending = await env.DB.prepare(
            "SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > datetime('now')"
          ).bind(cleanEmail, code).first();

          if (!pending) {
            return new Response(JSON.stringify({ error: "Felaktig eller utgången kod" }), { status: 401, headers });
          }

          // Delete used code
          await env.DB.prepare("DELETE FROM verification_codes WHERE email = ?").bind(cleanEmail).run();

          // Find or create user
          let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
          if (!user) {
            await env.DB.prepare(
              "INSERT INTO users (email, name, newsletter, newsletter_consent_at) VALUES (?, ?, ?, ?)"
            ).bind(cleanEmail, name || null, newsletter ? 1 : 0, newsletter ? new Date().toISOString() : null).run();
            user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
          } else {
            await env.DB.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").bind(user.id).run();
            if (newsletter) {
              await env.DB.prepare("UPDATE users SET newsletter = 1, newsletter_consent_at = ? WHERE id = ? AND newsletter = 0")
                .bind(new Date().toISOString(), user.id).run();
            }
          }

          // Create session token
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

        // Step 1: generate and store 6-digit code
        const verifyCode = String(Math.floor(100000 + Math.random() * 900000));
        await env.DB.prepare("DELETE FROM verification_codes WHERE email = ?").bind(cleanEmail).run();
        await env.DB.prepare(
          "INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, datetime('now', '+10 minutes'))"
        ).bind(cleanEmail, verifyCode).run();

        // Send code via Resend
        if (env.RESEND_API_KEY) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: env.FROM_EMAIL || "Smakfynd <onboarding@resend.dev>",
                to: [cleanEmail],
                subject: `${verifyCode} — din Smakfynd-kod`,
                html: `<div style="font-family:-apple-system,sans-serif;max-width:400px;margin:0 auto;padding:24px">
                  <div style="font-family:Georgia,serif;font-size:22px;color:#7a2332;margin-bottom:16px">Smakfynd</div>
                  <p style="font-size:14px;color:#4a4238;margin:0 0 16px">Här är din verifieringskod:</p>
                  <div style="font-size:32px;font-weight:700;letter-spacing:0.3em;text-align:center;padding:16px;background:#f7f3ec;border-radius:12px;color:#1e1710;font-family:monospace">${verifyCode}</div>
                  <p style="font-size:12px;color:#7a7060;margin:16px 0 0">Koden gäller i 10 minuter. Om du inte försökte logga in kan du ignorera detta mail.</p>
                </div>`,
              }),
            });
          } catch(e) {
            console.error("Email send failed:", e);
          }
        }

        return new Response(JSON.stringify({
          status: "code_sent",
          message: "En verifieringskod har skickats till din email",
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
        const token = getToken(request, url);
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
        const token = getToken(request, url);
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });
        return new Response(JSON.stringify({ user: { id: user.id, email: user.email, name: user.name, created_at: user.created_at } }), { headers });
      }

      // POST /unsubscribe — opt out of newsletter
      if (request.method === "POST" && url.pathname === "/unsubscribe") {
        const { token, email } = await request.json();
        // Allow unsubscribe by token or email (for email links)
        let user = token ? await getUserByToken(env.DB, token) : null;
        if (!user && email) {
          user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email.toLowerCase().trim()).first();
        }
        if (!user) return new Response(JSON.stringify({ error: "Användare hittades inte" }), { status: 404, headers });

        await env.DB.prepare("UPDATE users SET newsletter = 0 WHERE id = ?").bind(user.id).run();
        return new Response(JSON.stringify({ ok: true, message: "Avregistrerad från nyhetsbrev" }), { headers });
      }

      // GET /unsubscribe?email=X&token=Y — verified link for email footers
      if (request.method === "GET" && url.pathname === "/unsubscribe") {
        const email = url.searchParams.get("email");
        const unsubToken = url.searchParams.get("token");
        if (email && unsubToken) {
          const secret = env.ADMIN_KEY || "smakfynd-unsub";
          const valid = await verifyUnsubToken(email.toLowerCase().trim(), unsubToken, secret);
          if (valid) {
            await env.DB.prepare("UPDATE users SET newsletter = 0 WHERE email = ?").bind(email.toLowerCase().trim()).run();
            return new Response(
              '<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Avregistrerad</h2><p>Du kommer inte längre få nyhetsbrev från Smakfynd.</p><a href="https://smakfynd.se">Tillbaka till Smakfynd</a></body></html>',
              { headers: { ...cors, "Content-Type": "text/html" } }
            );
          }
        }
        return new Response(
          '<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Ogiltig länk</h2><p>Den här avregistreringslänken är ogiltig eller har gått ut.</p><a href="https://smakfynd.se">Tillbaka till Smakfynd</a></body></html>',
          { headers: { ...cors, "Content-Type": "text/html" } }
        );
      }

      // POST /delete-account — GDPR: delete all user data
      if (request.method === "POST" && url.pathname === "/delete-account") {
        const { token } = await request.json();
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });

        // Delete everything
        await env.DB.batch([
          env.DB.prepare("DELETE FROM saved_wines WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM user_tokens WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
        ]);

        return new Response(JSON.stringify({ ok: true, message: "Konto och all data raderad" }), { headers });
      }

      // GET /unsub-token?email=X — generate unsubscribe token (admin only, for email links)
      if (request.method === "GET" && url.pathname === "/unsub-token") {
        const adminKey = request.headers.get("X-Admin-Key");
        if (!adminKey || adminKey !== env.ADMIN_KEY) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
        }
        const email = url.searchParams.get("email");
        if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400, headers });
        const secret = env.ADMIN_KEY || "smakfynd-unsub";
        const token = await generateUnsubToken(email.toLowerCase().trim(), secret);
        return new Response(JSON.stringify({ email: email.toLowerCase().trim(), token }), { headers });
      }

      // GET /subscribers — list newsletter subscribers (admin, requires secret)
      if (request.method === "GET" && url.pathname === "/subscribers") {
        const adminKey = request.headers.get("X-Admin-Key");
        if (!adminKey || adminKey !== env.ADMIN_KEY) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
        }
        const result = await env.DB.prepare(
          "SELECT email, newsletter_consent_at FROM users WHERE newsletter = 1 ORDER BY newsletter_consent_at DESC"
        ).all();
        return new Response(JSON.stringify({ count: result.results.length, subscribers: result.results }), { headers });
      }

      // ═══ PREMIUM FEATURES ═══

      // POST /rate — rate a wine (builds taste profile)
      if (request.method === "POST" && url.pathname === "/rate") {
        const { token, nr, rating, notes } = await request.json();
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });
        if (!nr || !rating || rating < 1 || rating > 5) {
          return new Response(JSON.stringify({ error: "nr och rating (1-5) krävs" }), { status: 400, headers });
        }
        await env.DB.prepare(
          `INSERT INTO ratings (user_id, wine_nr, rating, notes)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id, wine_nr) DO UPDATE SET rating = ?, notes = ?, rated_at = datetime('now')`
        ).bind(user.id, nr, rating, notes || null, rating, notes || null).run();
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // GET /ratings?token=X — get all user ratings
      if (request.method === "GET" && url.pathname === "/ratings") {
        const token = getToken(request, url);
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });
        const rows = await env.DB.prepare(
          "SELECT wine_nr, rating, notes, rated_at FROM ratings WHERE user_id = ? ORDER BY rated_at DESC"
        ).bind(user.id).all();
        return new Response(JSON.stringify({ ratings: rows.results }), { headers });
      }

      // GET /taste-profile?token=X — calculated taste preferences from ratings
      if (request.method === "GET" && url.pathname === "/taste-profile") {
        const token = getToken(request, url);
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });
        const rows = await env.DB.prepare(
          "SELECT wine_nr, rating FROM ratings WHERE user_id = ? AND rating >= 4"
        ).bind(user.id).all();
        return new Response(JSON.stringify({ liked_wines: rows.results, count: rows.results.length }), { headers });
      }

      // POST /alert — set price/stock alert on a wine
      if (request.method === "POST" && url.pathname === "/alert") {
        const { token, nr, alert_type, threshold } = await request.json();
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });
        if (!nr || !alert_type) {
          return new Response(JSON.stringify({ error: "nr och alert_type krävs" }), { status: 400, headers });
        }
        const validTypes = ["price_drop", "price_below", "back_in_stock"];
        if (!validTypes.includes(alert_type)) {
          return new Response(JSON.stringify({ error: "Ogiltig alert_type" }), { status: 400, headers });
        }
        await env.DB.prepare(
          `INSERT INTO price_alerts (user_id, wine_nr, alert_type, threshold)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id, wine_nr, alert_type) DO UPDATE SET threshold = ?, active = 1`
        ).bind(user.id, nr, alert_type, threshold || null, threshold || null).run();
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // DELETE /alert — remove an alert
      if (request.method === "POST" && url.pathname === "/remove-alert") {
        const { token, nr, alert_type } = await request.json();
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });
        await env.DB.prepare(
          "DELETE FROM price_alerts WHERE user_id = ? AND wine_nr = ? AND alert_type = ?"
        ).bind(user.id, nr, alert_type).run();
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // GET /alerts?token=X — get all user alerts
      if (request.method === "GET" && url.pathname === "/alerts") {
        const token = getToken(request, url);
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });
        const rows = await env.DB.prepare(
          "SELECT wine_nr, alert_type, threshold, active, created_at FROM price_alerts WHERE user_id = ? AND active = 1"
        ).bind(user.id).all();
        return new Response(JSON.stringify({ alerts: rows.results }), { headers });
      }

      // POST /cellar — add wine to cellar / tasting diary
      if (request.method === "POST" && url.pathname === "/cellar") {
        const { token, nr, action, notes, occasion, rating } = await request.json();
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });
        if (!nr) return new Response(JSON.stringify({ error: "nr krävs" }), { status: 400, headers });

        if (action === "taste") {
          // Log a tasting
          await env.DB.prepare(
            "INSERT INTO cellar (user_id, wine_nr, status, notes, occasion, personal_rating, tasted_at) VALUES (?, ?, 'tasted', ?, ?, ?, datetime('now'))"
          ).bind(user.id, nr, notes || null, occasion || null, rating || null).run();
        } else {
          // Add to cellar (bought / planning)
          await env.DB.prepare(
            "INSERT OR IGNORE INTO cellar (user_id, wine_nr, status) VALUES (?, ?, 'in_cellar')"
          ).bind(user.id, nr).run();
        }
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      // GET /cellar?token=X — get cellar + tasting history
      if (request.method === "GET" && url.pathname === "/cellar") {
        const token = getToken(request, url);
        const user = await getUserByToken(env.DB, token);
        if (!user) return new Response(JSON.stringify({ error: "Inte inloggad" }), { status: 401, headers });
        const rows = await env.DB.prepare(
          "SELECT wine_nr, status, notes, occasion, personal_rating, tasted_at, created_at FROM cellar WHERE user_id = ? ORDER BY created_at DESC"
        ).bind(user.id).all();
        return new Response(JSON.stringify({ cellar: rows.results }), { headers });
      }

      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  },
};
