import { Database } from '@sqlite.org/sqlite-wasm';

import { DB_SCHEMA } from './schema.sql';

export async function seedDatabase(db: Database): Promise<void> {
  db.exec(DB_SCHEMA);
}