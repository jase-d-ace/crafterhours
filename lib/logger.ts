import Database from 'better-sqlite3'

type LogLevel = 'error' | 'warn' | 'info'

function serializeError(e: unknown): Record<string, unknown> {
  if (e instanceof Error) {
    return { message: e.message, name: e.name, stack: e.stack }
  }
  return { value: String(e) }
}

function getLogDb(): Database.Database {
  const dbPath = process.env.DATABASE_PATH || './crafterhours.db'
  return new Database(dbPath)
}

function persist(
  level: LogLevel,
  source: string,
  message: string,
  code?: string,
  metadata?: Record<string, unknown>
): void {
  try {
    const db = getLogDb()
    db.prepare(
      `INSERT INTO error_log (level, message, source, code, metadata) VALUES (?, ?, ?, ?, ?)`
    ).run(level, message, source, code ?? null, metadata ? JSON.stringify(metadata) : null)
    db.close()
  } catch (e) {
    console.warn('[logger] Failed to persist log entry:', e)
  }
}

function log(
  level: LogLevel,
  source: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const code = metadata?.code as string | undefined
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${source}]`

  console[level](prefix, message, metadata ?? '')
  persist(level, source, message, code, metadata)
}

export const logger = {
  info(source: string, message: string, metadata?: Record<string, unknown>): void {
    log('info', source, message, metadata)
  },
  warn(source: string, message: string, metadata?: Record<string, unknown>): void {
    log('warn', source, message, metadata)
  },
  error(source: string, message: string, metadata?: Record<string, unknown>): void {
    log('error', source, message, metadata)
  },
}

/** Extract a loggable metadata object from an unknown caught value. */
export { serializeError }
