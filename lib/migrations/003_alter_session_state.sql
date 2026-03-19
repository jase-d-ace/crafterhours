-- Align session_state table with PLAN_ENDPOINT.md spec.
-- Replace the single `state` JSON blob with discrete columns:
-- status, messages, session_plan.

DROP TABLE IF EXISTS session_state;

CREATE TABLE session_state (
  id TEXT PRIMARY KEY,
  hobby_id TEXT NOT NULL REFERENCES hobbies(id),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'abandoned')),
  messages TEXT NOT NULL DEFAULT '[]', -- JSON stringified Message[]
  session_plan TEXT, -- JSON stringified SessionPlan or NULL
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
