/**
 * Smakfynd Weekly Analytics Report
 * Runs every Monday 07:00 UTC, emails report via Resend.
 * Daily health check at 08:00 UTC — sends immediate alert on red status.
 */

// Known bot UA patterns
const BOT_UA_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|mediapartners|google-inspectiontool|headlesschrome|phantomjs|puppet|wget|curl|python-requests|go-http-client|java\/|libwww|httpunit|nutch|biglotron|teoma|convera|gigablast|ia_archiver|webmon|httrack|grub|netresearchserver|speedy|fluffy|findlink|panscient|iodc|yandex|rambler|openbot|duckduckbot|ahrefsbot|semrushbot|dotbot|mj12bot|rogerbot|screaming frog|petalbot|bytespider/i;

function isBot(ua) {
  if (!ua) return true; // no UA = likely bot
  return BOT_UA_RE.test(ua);
}

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

// ─── Health checks ───────────────────────────────────────────────────

async function checkHealth(db) {
  const checks = [];

  // 1. Sessions this week vs last week
  const [thisWeek] = await q(db,
    `SELECT COUNT(DISTINCT session) as n FROM events WHERE ts >= datetime('now', '-7 days')`);
  const [lastWeek] = await q(db,
    `SELECT COUNT(DISTINCT session) as n FROM events WHERE ts >= datetime('now', '-14 days') AND ts < datetime('now', '-7 days')`);

  if ((thisWeek?.n || 0) === 0) {
    checks.push({ status: "red", label: "Noll sessioner senaste 7 dagarna", action: "Kontrollera att analytics-workern svarar och att frontend skickar events" });
  } else if (lastWeek?.n > 0 && thisWeek.n < lastWeek.n * 0.4) {
    checks.push({ status: "amber", label: `Sessioner ner ${Math.round((1 - thisWeek.n / lastWeek.n) * 100)}% vecka-över-vecka`, action: "Kolla om deploy/CDN gick sönder eller om det är en naturlig dipp" });
  } else {
    checks.push({ status: "green", label: `${thisWeek.n} sessioner (OK)` });
  }

  // 2. Data freshness — any event in last 24h?
  const [recent] = await q(db,
    `SELECT COUNT(*) as n FROM events WHERE ts >= datetime('now', '-24 hours')`);
  if ((recent?.n || 0) === 0) {
    checks.push({ status: "red", label: "Inga events senaste 24h", action: "Analytics-workern kan vara nere — kolla Cloudflare dashboard" });
  } else {
    checks.push({ status: "green", label: `${recent.n} events senaste 24h` });
  }

  // 3. Price data freshness
  const [latestPrice] = await q(db,
    `SELECT MAX(snapshot_date) as d FROM price_history`);
  if (latestPrice?.d) {
    const daysSince = Math.floor((Date.now() - new Date(latestPrice.d + "T00:00:00Z").getTime()) / 86400000);
    if (daysSince > 10) {
      checks.push({ status: "red", label: `Prisdata ${daysSince} dagar gammal`, action: "daily-update.yml kan ha stannat — kolla GitHub Actions" });
    } else if (daysSince > 7) {
      checks.push({ status: "amber", label: `Prisdata ${daysSince} dagar gammal`, action: "Inte kritiskt ännu men bör uppdateras snart" });
    } else {
      checks.push({ status: "green", label: `Prisdata ${daysSince}d gammal` });
    }
  }

  // 4. Bot traffic ratio
  const [botRatio] = await q(db,
    `SELECT
       SUM(CASE WHEN ua IS NULL OR ua = '' THEN 1 ELSE 0 END) as no_ua,
       COUNT(*) as total
     FROM events WHERE ts >= datetime('now', '-7 days') AND event = 'session_end'`);
  // Sessions with session_end = JS ran = likely real. If very few have session_end vs total distinct sessions, flag it.
  const [totalSessions] = await q(db,
    `SELECT COUNT(DISTINCT session) as n FROM events WHERE ts >= datetime('now', '-7 days')`);
  const [endedSessions] = await q(db,
    `SELECT COUNT(DISTINCT session) as n FROM events WHERE ts >= datetime('now', '-7 days') AND event = 'session_end'`);
  const humanPct = totalSessions?.n ? Math.round((endedSessions?.n || 0) / totalSessions.n * 100) : 0;
  if (humanPct < 20 && (totalSessions?.n || 0) > 10) {
    checks.push({ status: "amber", label: `Bara ${humanPct}% sessioner med JS-interaktion`, action: "Hög bot-andel eller trasig session_end-tracking" });
  }

  const overall = checks.some(c => c.status === "red") ? "red"
    : checks.some(c => c.status === "amber") ? "amber" : "green";

  return { overall, checks };
}

// ─── Bot/human session classification ────────────────────────────────

async function classifySessions(db, days) {
  // A "human" session has a session_end event (JS lifecycle fired)
  // AND doesn't have a known-bot UA
  const sessions = await q(db, `
    SELECT
      session,
      COUNT(*) as events,
      MAX(CASE WHEN event = 'session_end' THEN 1 ELSE 0 END) as has_end,
      GROUP_CONCAT(DISTINCT ua) as uas,
      MAX(device) as device
    FROM events
    WHERE ts >= datetime('now', '-${days} days')
    GROUP BY session
  `);

  let human = 0, bot = 0;
  const humanSessions = [];
  for (const s of sessions) {
    const uaStr = s.uas || "";
    const uaIsBot = isBot(uaStr);
    // Bot if: known bot UA, OR no session_end AND single event (crawl hit)
    if (uaIsBot || (!s.has_end && s.events <= 1)) {
      bot++;
    } else {
      human++;
      humanSessions.push(s.session);
    }
  }
  return { human, bot, total: sessions.length, humanSessions };
}

// ─── Report builder ──────────────────────────────────────────────────

async function buildReport(db) {
  const days = 7;

  // Health status
  const health = await checkHealth(db);

  // Bot/human split
  const sessionSplit = await classifySessions(db, days);
  const prevSplit = await classifySessions(db, days * 2);
  // prevSplit covers 14 days; subtract this week's humans for last-week-only
  const prevHuman = Math.max(0, prevSplit.human - sessionSplit.human);

  // Core metrics (human sessions only)
  const humanFilter = sessionSplit.humanSessions.length > 0
    ? `session IN (${sessionSplit.humanSessions.map(s => `'${s}'`).join(",")})`
    : "1=0";

  const [overview] = await q(db,
    `SELECT COUNT(DISTINCT session) as sessions, COUNT(*) as events FROM events WHERE ts >= datetime('now', '-${days} days') AND ${humanFilter}`);

  // Device split (human only)
  const devices = await q(db,
    `SELECT device, COUNT(DISTINCT session) as n FROM events WHERE ts >= datetime('now', '-${days} days') AND ${humanFilter} GROUP BY device ORDER BY n DESC`);

  // Top wines (all traffic — bots don't click)
  const topWines = await q(db,
    `SELECT json_extract(data, '$.name') as name, json_extract(data, '$.nr') as nr,
            json_extract(data, '$.score') as score, COUNT(*) as clicks
     FROM events WHERE event='click' AND ts >= datetime('now', '-${days} days')
     GROUP BY nr ORDER BY clicks DESC LIMIT 10`);

  // SB clicks
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

  // Daily trend (human only)
  const daily = await q(db,
    `SELECT date(ts) as day, COUNT(DISTINCT session) as sessions, COUNT(*) as events
     FROM events WHERE ts >= datetime('now', '-${days} days') AND ${humanFilter}
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

  // Week-over-week change (human sessions)
  const sessionDelta = prevHuman
    ? Math.round(((sessionSplit.human - prevHuman) / prevHuman) * 100)
    : null;
  const deltaStr = sessionDelta !== null
    ? `${sessionDelta >= 0 ? "+" : ""}${sessionDelta}% vs förra veckan`
    : "Första veckan med data";

  // Health status colors
  const statusColors = { green: "#2d6b3f", amber: "#b8860b", red: "#c0392b" };
  const statusBg = { green: "#e8f0e4", amber: "#fef9e7", red: "#fde8e8" };
  const statusDot = { green: "\u25CF", amber: "\u25CF", red: "\u25CF" };

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

  <!-- Health status -->
  <div style="padding:16px;border-radius:12px;background:${statusBg[health.overall]};border:2px solid ${statusColors[health.overall]};margin-bottom:20px">
    <div style="font-size:14px;font-weight:700;color:${statusColors[health.overall]};margin-bottom:${health.checks.some(c => c.status !== "green") ? "8px" : "0"}">
      <span style="font-size:18px">${statusDot[health.overall]}</span> Hälsostatus: ${health.overall === "green" ? "Allt OK" : health.overall === "amber" ? "Varning" : "Problem"}
    </div>
    ${health.checks.filter(c => c.status !== "green").map(c => `
      <div style="font-size:12px;color:${statusColors[c.status]};margin-top:4px;padding-left:22px">
        ${statusDot[c.status]} ${c.label}${c.action ? ` — <em>${c.action}</em>` : ""}
      </div>
    `).join("")}
  </div>

  <!-- Traffic split -->
  <div style="padding:14px 16px;border-radius:12px;background:#fff;border:1px solid #e6ddd0;margin-bottom:20px;display:flex;gap:16px;align-items:center">
    <div style="flex:1">
      <div style="font-size:20px;font-weight:700;color:#1e1710;font-family:Georgia,serif">${sessionSplit.human}</div>
      <div style="font-size:11px;color:#2d6b3f">Troliga besökare</div>
    </div>
    <div style="flex:1">
      <div style="font-size:20px;font-weight:700;color:#9a9080;font-family:Georgia,serif">${sessionSplit.bot}</div>
      <div style="font-size:11px;color:#9a9080">Troliga bottar</div>
    </div>
    <div style="flex:1">
      <div style="font-size:20px;font-weight:700;color:#7a7060;font-family:Georgia,serif">${sessionSplit.total}</div>
      <div style="font-size:11px;color:#7a7060">Totalt</div>
    </div>
  </div>

  <!-- KPIs (human only) -->
  <div style="display:flex;gap:12px;margin-bottom:20px">
    ${[
      ["Sessioner", overview?.sessions || 0, deltaStr],
      ["Events", overview?.events || 0, "enbart mänskliga"],
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
    <div style="font-size:12px;font-weight:600;color:#1e1710;margin-bottom:10px">Daglig trend (mänskliga sessioner)</div>
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
    <div style="font-size:12px;font-weight:600;color:#1e1710;margin-bottom:8px">Enheter (mänskliga)</div>
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

// ─── Email sender ────────────────────────────────────────────────────

async function sendEmail(env, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Smakfynd <onboarding@resend.dev>",
      to: [env.REPORT_EMAIL],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error("Email failed:", await res.text());
  }
}

async function buildAlertHtml(checks) {
  const reds = checks.filter(c => c.status === "red");
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f7f3ec;font-family:-apple-system,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 20px">
  <div style="margin-bottom:16px">
    <span style="font-family:Georgia,serif;font-size:22px;color:#7a2332">Smakfynd</span>
    <span style="font-size:13px;color:#c0392b;margin-left:8px;font-weight:600">ALERT</span>
  </div>
  <div style="padding:16px;border-radius:12px;background:#fde8e8;border:2px solid #c0392b">
    <div style="font-size:14px;font-weight:700;color:#c0392b;margin-bottom:8px">\u25CF Problem upptäckt</div>
    ${reds.map(c => `
      <div style="font-size:13px;color:#7a2332;margin-top:6px;padding:8px 12px;background:#fff;border-radius:8px;border:1px solid #e8b4b8">
        <strong>${c.label}</strong><br>
        <span style="font-size:12px;color:#666">${c.action}</span>
      </div>
    `).join("")}
  </div>
  <div style="font-size:10px;color:#9a9080;text-align:center;margin-top:20px">
    Smakfynd · Alert ${new Date().toISOString().slice(0, 16)} UTC · Olav Innovation AB
  </div>
</div>
</body></html>`;
}

export default {
  // Cron triggers:
  //   Monday 07:00 — weekly report
  //   Daily 08:00  — health check, alert on red
  async scheduled(event, env) {
    const cronPattern = event?.cron || "";

    if (cronPattern === "0 8 * * *") {
      // Daily health check — only alert on red
      const health = await checkHealth(env.DB);
      if (health.overall === "red") {
        const html = await buildAlertHtml(health.checks);
        await sendEmail(env, `\u26A0 Smakfynd ALERT — ${new Date().toLocaleDateString("sv-SE")}`, html);
      }
      return;
    }

    // Default: weekly report
    const html = await buildReport(env.DB);
    await sendEmail(env, `Smakfynd veckorapport — ${new Date().toLocaleDateString("sv-SE")}`, html);
  },

  // HTTP trigger — for testing
  async fetch(request, env) {
    const url = new URL(request.url);
    const adminKey = request.headers.get("X-Admin-Key") || url.searchParams.get("key");
    if (url.pathname === "/report") {
      if (adminKey !== env.ADMIN_KEY) return new Response("Unauthorized", { status: 401 });
      const html = await buildReport(env.DB);
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/health") {
      if (adminKey !== env.ADMIN_KEY) return new Response("Unauthorized", { status: 401 });
      const health = await checkHealth(env.DB);
      return new Response(JSON.stringify(health, null, 2), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/send") {
      if (adminKey !== env.ADMIN_KEY) return new Response("Unauthorized", { status: 401 });
      await this.scheduled({ cron: "0 7 * * 1" }, env);
      return new Response("Report sent!");
    }
    if (url.pathname === "/alert-test") {
      if (adminKey !== env.ADMIN_KEY) return new Response("Unauthorized", { status: 401 });
      const health = await checkHealth(env.DB);
      if (health.overall === "red") {
        const html = await buildAlertHtml(health.checks);
        await sendEmail(env, `\u26A0 Smakfynd ALERT — ${new Date().toLocaleDateString("sv-SE")}`, html);
        return new Response("Alert sent!");
      }
      return new Response(`No red issues. Status: ${health.overall}`);
    }
    return new Response("Smakfynd Report Worker", { status: 200 });
  },
};
