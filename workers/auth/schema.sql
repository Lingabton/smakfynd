-- Smakfynd User Auth Schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  newsletter INTEGER DEFAULT 0,  -- 0=no, 1=yes
  newsletter_consent_at TEXT,    -- when they opted in (GDPR)
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT DEFAULT (datetime('now')),
  preferences TEXT  -- JSON: taste prefs, favorite categories, etc.
);

CREATE TABLE IF NOT EXISTS saved_wines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  wine_nr TEXT NOT NULL,
  list TEXT DEFAULT 'favoriter',  -- favoriter, att-testa, budget, middag, helg, fest
  added_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, wine_nr, list),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_tokens (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_wines(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON user_tokens(user_id);
