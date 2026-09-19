import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/mrs.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      title_zh TEXT NOT NULL,
      field TEXT NOT NULL,
      subfield TEXT,
      difficulty INTEGER DEFAULT 5,
      status TEXT DEFAULT 'open',
      millennium INTEGER DEFAULT 0,
      summary TEXT NOT NULL,
      summary_zh TEXT NOT NULL,
      formal_statement TEXT,
      known_partial TEXT,
      key_obstacles TEXT,
      references_json TEXT DEFAULT '[]',
      tags_json TEXT DEFAULT '[]',
      priority INTEGER DEFAULT 50,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_zh TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      description TEXT NOT NULL,
      description_zh TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      capabilities_json TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      strategy TEXT,
      progress REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (problem_id) REFERENCES problems(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      title TEXT,
      status TEXT DEFAULT 'running',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role_id TEXT,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'analysis',
      metadata_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      problem_id TEXT,
      campaign_id TEXT,
      session_id TEXT,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      formal_lang TEXT,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (problem_id) REFERENCES problems(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      order_index INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS literature (
      id TEXT PRIMARY KEY,
      problem_id TEXT,
      title TEXT NOT NULL,
      authors TEXT,
      year INTEGER,
      venue TEXT,
      url TEXT,
      doi TEXT,
      abstract TEXT,
      notes TEXT,
      relevance INTEGER DEFAULT 3,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (problem_id) REFERENCES problems(id)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      problem_id TEXT,
      campaign_id TEXT,
      source TEXT,
      role TEXT,
      title TEXT,
      content TEXT NOT NULL,
      claims_json TEXT DEFAULT '[]',
      score REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (problem_id) REFERENCES problems(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS syntheses (
      id TEXT PRIMARY KEY,
      problem_id TEXT,
      campaign_id TEXT,
      title TEXT,
      focus TEXT,
      result_ids_json TEXT DEFAULT '[]',
      report_md TEXT NOT NULL,
      meta_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (problem_id) REFERENCES problems(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    CREATE INDEX IF NOT EXISTS idx_problems_field ON problems(field);
    CREATE INDEX IF NOT EXISTS idx_results_problem ON results(problem_id);
    CREATE INDEX IF NOT EXISTS idx_syntheses_problem ON syntheses(problem_id);
    CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);
    CREATE INDEX IF NOT EXISTS idx_campaigns_problem ON campaigns(problem_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_campaign ON sessions(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_artifacts_problem ON artifacts(problem_id);
    CREATE INDEX IF NOT EXISTS idx_literature_problem ON literature(problem_id);
  `);
}
