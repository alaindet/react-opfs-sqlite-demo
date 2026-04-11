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
  _logger: Logger,
  dbPath: string,
): Promise<Database> {
  let db!: Database;
  const logger = _logger.createScopedLogger('SQLite');

  // Initialize SQLite library
  logger.trace('Initializing SQLite library');
  const sqlite3 = await sqlite3InitModule({
    print: logger.trace,
    printErr: logger.error,
  });

  // Initialize database from file and/or create it
  logger.trace('Initializing database from OPFS');

  // ERROR: OPFS not available
  if (!('opfs' in sqlite3)) {
    const message = 'OPFS not available, cannot initialize database';
    logger.error(message);
    throw new Error(message);
  }

  db = new sqlite3.oo1.OpfsDb(dbPath);
  logger.trace('Database initialized');
  return db;
}
