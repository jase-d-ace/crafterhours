const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dbPath = process.env.DATABASE_PATH || './crafterhours.db'
const migrationsDir = path.join(__dirname, '..', 'lib', 'migrations')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Create migrations tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

const applied = new Set(
  db.prepare('SELECT name FROM _migrations').all().map((r) => r.name)
)

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

for (const file of files) {
  if (applied.has(file)) {
    console.log(`  skip: ${file} (already applied)`)
    continue
  }
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
  db.exec(sql)
  db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file)
  console.log(`  applied: ${file}`)
}

db.close()
console.log('Migrations complete.')
