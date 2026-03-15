import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DEFAULT_DB_PATH = resolve(process.cwd(), 'data', 'app.sqlite');

export function getDbPath() {
  return process.env.DB_PATH ? resolve(process.cwd(), process.env.DB_PATH) : DEFAULT_DB_PATH;
}

export function createDb() {
  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS access_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code_hash TEXT NOT NULL UNIQUE,
      code_hint TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unused',
      max_uses INTEGER NOT NULL DEFAULT 1,
      use_count INTEGER NOT NULL DEFAULT 0,
      buyer_note TEXT,
      created_at TEXT NOT NULL,
      activated_at TEXT,
      expires_at TEXT,
      last_used_at TEXT,
      bound_session_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS access_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code_id INTEGER NOT NULL,
      session_hash TEXT NOT NULL UNIQUE,
      ip_hash TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY(code_id) REFERENCES access_codes(id)
    );

    CREATE TABLE IF NOT EXISTS answer_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code_id INTEGER NOT NULL,
      session_id INTEGER NOT NULL,
      result_id TEXT NOT NULL,
      answers_json TEXT NOT NULL,
      scores_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(code_id) REFERENCES access_codes(id),
      FOREIGN KEY(session_id) REFERENCES access_sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_access_codes_status ON access_codes(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_code_id ON access_sessions(code_id);
    CREATE INDEX IF NOT EXISTS idx_answers_code_id ON answer_records(code_id);
  `);

  return db;
}
