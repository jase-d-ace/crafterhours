CREATE TABLE IF NOT EXISTS error_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info')),
  message TEXT NOT NULL,
  source TEXT NOT NULL,
  code TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
