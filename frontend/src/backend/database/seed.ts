import { Database } from '@sqlite.org/sqlite-wasm';

import { DB_SCHEMA } from './schema.sql';
import { recipesSeed } from './recipes.seed.sql';

export async function seedDatabase(db: Database): Promise<void> {
  db.exec(DB_SCHEMA);
  // db.exec(recipesSeed);
}