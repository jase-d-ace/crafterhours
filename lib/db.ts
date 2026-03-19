import Database from 'better-sqlite3'
import crypto from 'crypto'
import type { Hobby, Artifact, Message, SessionPlan } from './types'

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

export type SessionState = {
  id: string
  hobbyId: string
  status: 'planning' | 'confirmed' | 'abandoned'
  messages: Message[]
  sessionPlan: SessionPlan | null
  createdAt: string
  updatedAt: string
}

type SessionStateRow = {
  id: string
  hobby_id: string
  status: string
  messages: string
  session_plan: string | null
  created_at: string
  updated_at: string
}

function getDb(): Database.Database {
  const dbPath = process.env.DATABASE_PATH || './crafterhours.db'
  return new Database(dbPath)
}

function rowToSessionState(row: SessionStateRow): SessionState {
  return {
    id: row.id,
    hobbyId: row.hobby_id,
    status: row.status as SessionState['status'],
    messages: JSON.parse(row.messages) as Message[],
    sessionPlan: row.session_plan ? (JSON.parse(row.session_plan) as SessionPlan) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// --- Session state CRUD ---

export function createSession(hobbyId: string): SessionState {
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO session_state (id, hobby_id, status, messages, created_at, updated_at)
     VALUES (?, ?, 'planning', '[]', ?, ?)`
  ).run(id, hobbyId, now, now)

  db.close()

  return {
    id,
    hobbyId,
    status: 'planning',
    messages: [],
    sessionPlan: null,
    createdAt: now,
    updatedAt: now,
  }
}

export function getSession(sessionId: string): SessionState | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM session_state WHERE id = ?').get(sessionId) as
    | SessionStateRow
    | undefined

  db.close()

  if (!row) return null
  return rowToSessionState(row)
}

export function updateSessionMessages(sessionId: string, messages: Message[]): void {
  const db = getDb()
  const now = new Date().toISOString()

  db.prepare('UPDATE session_state SET messages = ?, updated_at = ? WHERE id = ?').run(
    JSON.stringify(messages),
    now,
    sessionId
  )

  db.close()
}

export function updateSessionStatus(
  sessionId: string,
  status: SessionState['status']
): void {
  const db = getDb()
  const now = new Date().toISOString()

  db.prepare('UPDATE session_state SET status = ?, updated_at = ? WHERE id = ?').run(
    status,
    now,
    sessionId
  )

  db.close()
}

export function updateSessionPlan(sessionId: string, plan: SessionPlan): void {
  const db = getDb()
  const now = new Date().toISOString()

  db.prepare(
    'UPDATE session_state SET session_plan = ?, status = ?, updated_at = ? WHERE id = ?'
  ).run(JSON.stringify(plan), 'confirmed', now, sessionId)

  db.close()
}

export function abandonActiveSessions(): void {
  const db = getDb()
  const now = new Date().toISOString()

  db.prepare(
    "UPDATE session_state SET status = 'abandoned', updated_at = ? WHERE status = 'planning'"
  ).run(now)

  db.close()
}

// --- Existing stubs ---

export function getHobbies(): Hobby[] {
  throw new NotImplementedError('getHobbies')
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

export { type Hobby, type Artifact } from './types'
export { type Recommendation, type SessionPlan, type PlanItem } from './types'
