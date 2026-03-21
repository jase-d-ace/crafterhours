import Database from 'better-sqlite3'
import path from 'path'
import type { Hobby, Artifact, Message, SessionPlan, SessionState } from './types'

const DATABASE_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'crafterhours.db')
const db = new Database(DATABASE_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} is not yet implemented`)
    this.name = 'NotImplementedError'
  }
}

export type Session = {
  id: string
  hobbyId: string
  duration: number
  notes: string
  artifactType: Artifact['type']
  createdAt: string
}

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

export function getRecentSessions(): Session[] {
  throw new NotImplementedError('getRecentSessions')
}

export function saveSession(_session: Omit<Session, 'id' | 'createdAt'>): Session {
  throw new NotImplementedError('saveSession')
}

export function saveArtifact(_artifact: Omit<Artifact, 'id' | 'createdAt'>): Artifact {
  throw new NotImplementedError('saveArtifact')
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

export { type Hobby, type Artifact } from './types'
export { type Recommendation, type SessionPlan, type PlanItem, type SessionState } from './types'
