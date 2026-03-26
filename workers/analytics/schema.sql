-- Smakfynd Analytics Schema

-- All user events (clicks, searches, filters, saves)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT DEFAULT (datetime('now')),
  session TEXT,           -- anonymous session ID (generated client-side)
  user_id TEXT,           -- future: logged-in user ID
  event TEXT NOT NULL,    -- event type: view, click, search, filter, save, share, sb_click, ai_query
  wine_nr TEXT,           -- product nr (if applicable)
  data TEXT,              -- JSON blob with event-specific data
  page TEXT,              -- page/route where event happened
  device TEXT,            -- mobile/desktop
  referrer TEXT           -- how they got here
);

-- AI interactions (queries + responses)
CREATE TABLE IF NOT EXISTS ai_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT DEFAULT (datetime('now')),
  session TEXT,
  user_id TEXT,
  meal TEXT NOT NULL,          -- user's input
  response TEXT,               -- full JSON response
  mode TEXT,                   -- recommend/question
  wines_suggested TEXT,         -- comma-separated wine nrs matched
  latency_ms INTEGER,
  model TEXT                   -- which AI model was used
);

-- Price snapshots (weekly)
CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL,
  wine_nr TEXT NOT NULL,
  price REAL,
  assortment TEXT,
  UNIQUE(snapshot_date, wine_nr)
);

-- Popular wines (aggregated daily)
CREATE TABLE IF NOT EXISTS popular_wines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  wine_nr TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  sb_clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  UNIQUE(date, wine_nr)
);

-- Search queries (what people search for)
CREATE TABLE IF NOT EXISTS searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT DEFAULT (datetime('now')),
  session TEXT,
  query TEXT NOT NULL,
  results_count INTEGER,
  clicked_nr TEXT          -- which wine they clicked after searching
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_event ON events(event);
CREATE INDEX IF NOT EXISTS idx_events_wine ON events(wine_nr);
CREATE INDEX IF NOT EXISTS idx_ai_ts ON ai_logs(ts);
CREATE INDEX IF NOT EXISTS idx_price_wine ON price_history(wine_nr);
CREATE INDEX IF NOT EXISTS idx_popular_date ON popular_wines(date);
CREATE INDEX IF NOT EXISTS idx_searches_query ON searches(query);
