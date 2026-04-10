import type { Database } from '@sqlite.org/sqlite-wasm';
import sql from 'sql-template-tag';

import { CreateRecipeDatabaseRow, Recipe, RecipeDatabaseRow } from '../../types';
import { ImagesController } from '../images';
import { Logger } from '../logger';

const query = {
  selectOne: sql`
    SELECT id, title, description, image_filename, created_at
    FROM recipes
    WHERE id = ?
  `,
  selectAll: sql`
    SELECT id, title, description, image_filename, created_at
    FROM recipes
  `,
  insert: sql`
    INSERT INTO recipes (title, description, image_filename)
    VALUES (?, ?, ?)
  `,
  delete: sql`DELETE FROM recipe WHERE id = ?`,
  lastId: sql`SELECT last_insert_rowid()`,
};

/**
 * Split this between the database manipulation and the filesystem manipulation
 * and then aggregate together the two via a RecipesService
 */
export class RecipesRepository {
  #logger!: Logger;
  #db!: Database;
  #images!: ImagesController;
  #mapper?: (row: RecipeDatabaseRow) => Promise<Recipe>;

  constructor(
    logger: Logger,
    db: Database,
    images: ImagesController,
  ) {
    this.#logger = logger;
    this.#db = db;
    this.#images = images;
  }

  async getById(id: string): Promise<Recipe | null> {
    const rows = this.#db.exec({
      sql: query.selectOne.sql,
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
      sql: query.selectAll.sql,
      returnValue: 'resultRows',
    }) as RecipeDatabaseRow[];

    const toRecipe = await this.#getMapper();
    const recipes: Recipe[] = [];

    for await (const recipe of rows.map(toRecipe)) {
      recipes.push(recipe);
    }

    return recipes;
  }

  async add(dto: CreateRecipeDatabaseRow): Promise<Recipe> {
    await this.addRaw(dto);

    const id = this.#db.exec({
      sql: query.lastId.sql,
      returnValue: 'resultRows',
    })[0][0];

    return this.getById(String(id)) as Promise<Recipe>;
  }

  async addRaw(dto: CreateRecipeDatabaseRow): Promise<void> {
    this.#db.exec({
      sql: query.insert.sql,
      bind: [dto.title, dto.description, dto.imageFilename],
    });

    const rowsAffected = this.#db.changes();
    if (rowsAffected !== 1) {
      const message = 'Recipe not created on the database';
      this.#logger.error(message, dto);
      throw new Error(message);
    }
  }

  async delete(id: string): Promise<Recipe> {
    const recipe = await this.getById(id);
    if (!recipe) {
      const message = 'Recipe not found on the database';
      this.#logger.error(message, { id });
      throw new Error(message);
    }

    await this.deleteRaw(id);
    return recipe;
  }

  async deleteRaw(id: string): Promise<void> {
    this.#db.exec({
      sql: query.delete.sql,
      bind: [id],
    });

    const rowsAffected = this.#db.changes();
    if (rowsAffected !== 1) {
      const message = 'Recipe not removed from the database';
      this.#logger.error(message, { id });
      throw new Error(message);
    }
  }

  // TODO: Move to service
  async #getMapper(): Promise<(row: RecipeDatabaseRow) => Promise<Recipe>> {
    if (this.#mapper) {
      return this.#mapper;
    }

    const dirHandle = this.#images.dirHandle;

    this.#mapper = async (row: RecipeDatabaseRow): Promise<Recipe> => {
      const imageFilename = String(row[3]);

      let imageFile: File | null = null;

      try {
        const imageFileHandle = await dirHandle.getFileHandle(imageFilename);
        imageFile = await imageFileHandle.getFile();
      } catch (err) {
        console.error(err);
        imageFile = null;
      }

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
