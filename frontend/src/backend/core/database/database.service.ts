import { Database } from '@sqlite.org/sqlite-wasm';

/**
 * This is just a wrapper so that you can preserve the DatabaseService reference
 * and still switch the internal database connection reference
 */
export class DatabaseService {
  db!: Database;

  constructor(db: Database) {
    this.db = db;
  }

  setDb(newDb: Database) {
    if (this.db.isOpen()) {
      this.db.close();
    }

    this.db = newDb;
  }
}