import type { Database } from '@sqlite.org/sqlite-wasm';
import sql from 'sql-template-tag';

import { Recipe, RecipeDatabaseRow } from '../../types';
import { ImagesController } from '../images';

const query = {
  getById: sql`
    SELECT id, title, description, image_filename, created_at
    FROM recipes
    WHERE id = ?
  `,
  getAll: sql`
    SELECT id, title, description, image_filename, created_at
    FROM recipes
  `,
};

export class RecipesRepository {
  #db!: Database;
  #images!: ImagesController;
  #mapper?: (row: RecipeDatabaseRow) => Promise<Recipe>;

  constructor(db: Database, images: ImagesController) {
    this.#db = db;
    this.#images = images;
  }

  async getById(id: number): Promise<Recipe | null> {
    const rows = this.#db.exec({
      sql: query.getById.sql,
      bind: [id],
      returnValue: 'resultRows',
    });

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0] as RecipeDatabaseRow;
    const toRecipe = await this.#getMapper();
    return toRecipe(row);
  }

  async getAll(): Promise<Recipe[]> {
    const rows = this.#db.exec({
      sql: query.getAll.sql,
      returnValue: 'resultRows',
    });

    const toRecipe = await this.#getMapper();
    const recipes: Recipe[] = [];

    for (await const row of rows) {
      
    }

    return recipes;
  }

  // getAll
  // find
  // add
  // update
  // remove
  // addMany

  async #getMapper(): Promise<(row: RecipeDatabaseRow) => Promise<Recipe>> {
    if (this.#mapper) {
      return this.#mapper;
    }

    const dirHandle = this.#images.dirHandle;

    this.#mapper = async (row: RecipeDatabaseRow): Promise<Recipe> => {
      const imageFilename = String(row[3]);
      const imageFileHandle = await dirHandle.getFileHandle(imageFilename);
      const imageFile = await imageFileHandle.getFile();

      const createdAtTimestamp = row[4] + 'Z';
      const createdAtDate = new Date(createdAtTimestamp);
      const createdAt = createdAtDate.getTime();

      return {
        id: String(row[0]), // TODO?
        title: String(row[1]),
        description: String(row[2]),
        imageFile,
        createdAt,
      };
    };

    return this.#mapper;
  }
}