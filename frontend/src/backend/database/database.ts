/**
 * This initializes SQLite WASM with OPFS persistence
 *
 * WARNING: This must run inside a dedicated Web Worker since SQLite's OpfsDb
 * needs synchronous access to OPFS
 */
import sqlite3InitModule, { Database } from '@sqlite.org/sqlite-wasm';

import { Logger } from '../logger';

let db: Database | null = null;

export function getDatabase(): Database {
  if (!db) {
    throw new Error('SQLite initialization error: call initDatabase() first');
  }
  return db;
}

export async function initDatabase(
  logger: Logger,
  dbPath: string,
): Promise<Database> {
  let db!: Database;

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

  logger.trace('[SQLite] Database initialized');
  return db;
}
