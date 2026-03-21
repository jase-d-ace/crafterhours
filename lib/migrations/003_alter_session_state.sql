-- Reshape session_state for the planning conversation flow.
-- Replaces the generic `state` JSON blob with explicit columns
-- for status, messages, and session_plan.
--
-- SQLite doesn't support DROP COLUMN before 3.35.0, so we
-- recreate the table to guarantee compatibility.

CREATE TABLE IF NOT EXISTS session_state_new (
  id TEXT PRIMARY KEY,
  hobby_id TEXT NOT NULL REFERENCES hobbies(id),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'abandoned')),
  messages TEXT NOT NULL DEFAULT '[]',        -- JSON array of {role, content}
  session_plan TEXT,                          -- JSON SessionPlan or NULL
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO session_state_new (id, hobby_id, status, messages, session_plan, created_at, updated_at)
  SELECT id, hobby_id, 'abandoned', '[]', NULL, created_at, updated_at
  FROM session_state;

DROP TABLE session_state;

ALTER TABLE session_state_new RENAME TO session_state;
