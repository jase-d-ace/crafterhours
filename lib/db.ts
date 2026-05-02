import Database from 'better-sqlite3'
import path from 'path'
import type { Hobby, Artifact, Message, SessionPlan, SessionState, Session, SaveSessionInput, SaveArtifactInput, SessionDetail } from './types'

const DATABASE_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'crafterhours.db')
const db = new Database(DATABASE_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function rowToHobby(row: any): Hobby {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    goal: row.goal,
    focusAreas: JSON.parse(row.focus_areas),
    active: Boolean(row.active),
    createdAt: row.created_at,
  }
}

export function getHobbies(): Hobby[] {
  const rows = db.prepare('SELECT * FROM hobbies WHERE active = 1').all()
  return rows.map(rowToHobby)
}

export function getHobbyById(hobbyId: string): Hobby | null {
  const row = db.prepare('SELECT * FROM hobbies WHERE id = ?').get(hobbyId)
  if (!row) return null
  return rowToHobby(row)
}

function rowToSession(row: any): Session {
  return {
    id: row.id,
    hobbyId: row.hobby_id,
    duration: row.duration,
    notes: row.notes,
    artifactType: row.artifact_type as Artifact['type'],
    createdAt: row.created_at,
  }
}

export function getRecentSessions(limit = 10): Session[] {
  const rows = db.prepare(
    'SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?'
  ).all(limit)
  return rows.map(rowToSession)
}

export function saveSession(data: SaveSessionInput): Session {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO sessions (id, hobby_id, duration, notes, artifact_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, data.hobbyId, data.duration, data.notes, data.artifactType, now)
  return { id, ...data, createdAt: now }
}

export function saveArtifact(data: SaveArtifactInput): Artifact {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO artifacts (id, session_id, hobby_id, type, content, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, data.sessionId, data.hobbyId, data.type, data.content, now)
  return { id, ...data, createdAt: now }
}

export function getArtifactBySessionId(sessionId: string): Artifact | null {
  const row = db.prepare('SELECT * FROM artifacts WHERE session_id = ? LIMIT 1').get(sessionId) as any
  if (!row) return null
  return {
    id: row.id,
    sessionId: row.session_id,
    hobbyId: row.hobby_id,
    type: row.type as Artifact['type'],
    content: row.content,
    createdAt: row.created_at,
  }
}

export function getSessionDetails(limit = 50): SessionDetail[] {
  const rows = db.prepare(
    `SELECT
       s.id, s.hobby_id, s.duration, s.notes, s.artifact_type, s.created_at,
       h.name as hobby_name, h.emoji as hobby_emoji, h.goal as hobby_goal,
       h.focus_areas as hobby_focus_areas, h.active as hobby_active,
       h.created_at as hobby_created_at,
       a.id as artifact_id, a.type as artifact_type_full,
       a.content as artifact_content, a.created_at as artifact_created_at
     FROM sessions s
     JOIN hobbies h ON s.hobby_id = h.id
     LEFT JOIN artifacts a ON a.session_id = s.id
     ORDER BY s.created_at DESC
     LIMIT ?`
  ).all(limit) as any[]

  return rows.map((row) => ({
    id: row.id,
    hobbyId: row.hobby_id,
    duration: row.duration,
    notes: row.notes,
    artifactType: row.artifact_type as Artifact['type'],
    createdAt: row.created_at,
    hobby: {
      id: row.hobby_id,
      name: row.hobby_name,
      emoji: row.hobby_emoji,
      goal: row.hobby_goal,
      focusAreas: JSON.parse(row.hobby_focus_areas),
      active: Boolean(row.hobby_active),
      createdAt: row.hobby_created_at,
    },
    artifact: row.artifact_id
      ? {
          id: row.artifact_id,
          sessionId: row.id,
          hobbyId: row.hobby_id,
          type: row.artifact_type_full as Artifact['type'],
          content: row.artifact_content,
          createdAt: row.artifact_created_at,
        }
      : null,
  }))
}

// --- session_state CRUD ---

function rowToSessionState(row: any): SessionState {
  return {
    id: row.id,
    hobbyId: row.hobby_id,
    status: row.status,
    messages: JSON.parse(row.messages),
    sessionPlan: row.session_plan ? JSON.parse(row.session_plan) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createSession(hobbyId: string): SessionState {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO session_state (id, hobby_id, status, messages, session_plan, created_at, updated_at)
     VALUES (?, ?, 'planning', '[]', NULL, ?, ?)`
  ).run(id, hobbyId, now, now)
  return { id, hobbyId, status: 'planning', messages: [], sessionPlan: null, createdAt: now, updatedAt: now }
}

export function getSession(sessionId: string): SessionState | null {
  const row = db.prepare('SELECT * FROM session_state WHERE id = ?').get(sessionId)
  if (!row) return null
  return rowToSessionState(row)
}

export function updateSessionMessages(sessionId: string, messages: Message[]): void {
  db.prepare(
    `UPDATE session_state SET messages = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(JSON.stringify(messages), sessionId)
}

export function updateSessionStatus(sessionId: string, status: string): void {
  db.prepare(
    `UPDATE session_state SET status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(status, sessionId)
}

export function updateSessionPlan(sessionId: string, plan: SessionPlan): void {
  db.prepare(
    `UPDATE session_state SET session_plan = ?, status = 'confirmed', updated_at = datetime('now') WHERE id = ?`
  ).run(JSON.stringify(plan), sessionId)
}

export function abandonActiveSessions(): void {
  db.prepare(
    `UPDATE session_state SET status = 'abandoned', updated_at = datetime('now') WHERE status = 'planning'`
  ).run()
}

export { type Hobby, type Artifact, type Session, type SaveSessionInput, type SaveArtifactInput, type SessionDetail } from './types'
export { type Recommendation, type SessionPlan, type PlanItem, type SessionState } from './types'
