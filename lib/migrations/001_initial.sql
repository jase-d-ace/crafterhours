CREATE TABLE IF NOT EXISTS hobbies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  goal TEXT NOT NULL,
  focus_areas TEXT NOT NULL, -- JSON array
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  hobby_id TEXT NOT NULL REFERENCES hobbies(id),
  duration INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  artifact_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  hobby_id TEXT NOT NULL REFERENCES hobbies(id),
  type TEXT NOT NULL CHECK (type IN ('journal', 'practice_log', 'coding_summary')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session_state (
  id TEXT PRIMARY KEY,
  hobby_id TEXT NOT NULL REFERENCES hobbies(id),
  state TEXT NOT NULL, -- JSON blob for in-progress session
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
