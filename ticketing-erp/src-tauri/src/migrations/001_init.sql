-- ============================================================
-- Migration 001 — Initial Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  username     TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  role         TEXT NOT NULL CHECK(role IN ('admin','manager','staff','requester')),
  department   TEXT NOT NULL CHECK(department IN ('IT','MNT','HR','PRC','ALL')),
  is_active    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tickets (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_no    TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  category     TEXT NOT NULL CHECK(category IN ('IT','MNT','HR','PRC')),
  priority     TEXT NOT NULL CHECK(priority IN ('P1','P2','P3','P4')),
  status       TEXT NOT NULL DEFAULT 'OPEN'
               CHECK(status IN ('OPEN','IN_PROGRESS','PENDING','RESOLVED','CLOSED')),
  requester_id INTEGER NOT NULL REFERENCES users(id),
  assignee_id  INTEGER REFERENCES users(id),
  desired_due  TEXT,
  sla_due      TEXT,
  resolved_at  TEXT,
  closed_at    TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_status    ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category  ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee  ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_requester ON tickets(requester_id);

CREATE TABLE IF NOT EXISTS comments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id    INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  content      TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attachments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id    INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  filepath     TEXT NOT NULL,
  filesize     INTEGER NOT NULL,
  uploaded_by  INTEGER NOT NULL REFERENCES users(id),
  uploaded_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id    INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  action       TEXT NOT NULL,
  old_value    TEXT,
  new_value    TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  ticket_id    INTEGER REFERENCES tickets(id),
  message      TEXT NOT NULL,
  is_read      INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS config (
  key          TEXT PRIMARY KEY,
  value        TEXT NOT NULL,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default config (INSERT OR IGNORE to avoid re-insert on migration re-run)
INSERT OR IGNORE INTO config VALUES ('sla_p1_hours', '4', datetime('now'));
INSERT OR IGNORE INTO config VALUES ('sla_p2_hours', '8', datetime('now'));
INSERT OR IGNORE INTO config VALUES ('sla_p3_hours', '24', datetime('now'));
INSERT OR IGNORE INTO config VALUES ('sla_p4_hours', '72', datetime('now'));
INSERT OR IGNORE INTO config VALUES ('company_name', 'PT SEKAI ID', datetime('now'));

-- Default admin user (password: admin123)
-- bcrypt hash of 'admin123' with cost=12
INSERT OR IGNORE INTO users (username, password_hash, full_name, role, department)
VALUES (
  'admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfxZlHvBhiTXi',
  'Administrator',
  'admin',
  'ALL'
);
