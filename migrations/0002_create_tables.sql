-- Replace KV blob store with proper relational tables

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    time TEXT,
    location TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    is_hidden INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS placed_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    activity_id TEXT NOT NULL,
    title TEXT,
    time TEXT,
    location TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_placed_activities_date ON placed_activities(date);
CREATE INDEX IF NOT EXISTS idx_placed_activities_activity_id ON placed_activities(activity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_placed_activities_date_activity
    ON placed_activities(date, activity_id);

CREATE TABLE IF NOT EXISTS leaves (
    date TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('full', 'morning', 'afternoon')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('totalLeaves', '25');
