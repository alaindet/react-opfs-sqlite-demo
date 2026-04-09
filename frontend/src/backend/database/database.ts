/**
 * This initializes SQLite WASM with OPFS persistence
 *
 * WARNING: This must run inside a dedicated Web Worker since SQLite's OpfsDb
 * needs synchronous access to OPFS
 */
import { Logger } from '../logger';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

let db: any; // sqlite3.oo1.OpfsDb | sqlite3.oo1.DB

export async function getDatabase() {
  if (!db) {
    throw new Error('SQLite initialization error: call initDatabase() first');
  }
  return db;
}

export async function initDatabase(logger: Logger, dbPath: string) {
  let db!: any;

  // Initialize SQLite library
  logger.trace('[SQLite] Initializing SQLite library');
  const sqlite3 = await sqlite3InitModule({
    print: logger.trace,
    printErr: logger.error,
  });

  // Initialize database from file and/or create it
  logger.trace('[SQLite] Initializing SQLite database from OPFS');
  if ('opfs' in sqlite3) {
    db = new sqlite3.oo1.OpfsDb(dbPath);
    logger.trace('[SQLite] OPFS available, database persisted', { path: db.filename });
  } else {
    db = new sqlite3.oo1.DB(dbPath, 'ct');
    logger.trace('[SQLite] OPFS unavailable, database is in-memory');
  }

  // TODO: Run schema and seeders?
  // db.exec(`
  //   CREATE TABLE IF NOT EXISTS recipes (
  //     id            INTEGER PRIMARY KEY AUTOINCREMENT,
  //     title         TEXT    NOT NULL,
  //     description   TEXT    NOT NULL DEFAULT '',
  //     image_filename TEXT,
  //     created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  //   );
  // `);

  logger.trace('[SQLite] Database initialized');
  return db;
}
