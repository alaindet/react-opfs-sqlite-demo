import sql from 'sql-template-tag';

export const DB_SCHEMA = sql`
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_filename TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;