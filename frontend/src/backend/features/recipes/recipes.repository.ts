import sql from 'sql-template-tag';
import { Recipe, RecipeDatabaseRow, CreateRecipeDatabaseRow } from '../../../types';
import { DatabaseService } from '../../core/database';
import { Logger } from '../../core/logger';

const query = {
  selectByTitle: sql`
    SELECT id, title, description, image_filename, created_at
    FROM recipes
    WHERE title = ? COLLATE NOCASE
  `,
  selectById: sql`
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
  delete: sql`DELETE FROM recipes WHERE id = ?`,
  lastId: sql`SELECT last_insert_rowid()`,
};

export class RecipesRepository {
  #logger!: Logger;
  #db!: DatabaseService;

  constructor(logger: Logger, db: DatabaseService) {
    this.#logger = logger.createScopedLogger('RecipesRepository');
    this.#db = db;
  }

  async getById(id: Recipe['id']): Promise<RecipeDatabaseRow | null> {
    const rows = this.#db.db.exec({
      sql: query.selectById.sql,
      bind: [id],
      returnValue: 'resultRows',
    });

    return rows.length > 0
      ? rows[0] as RecipeDatabaseRow
      : null;
  }

  async getByTitle(title: Recipe['title']): Promise<RecipeDatabaseRow | null> {
    const rows = this.#db.db.exec({
      sql: query.selectByTitle.sql,
      bind: [title.trim()],
      returnValue: 'resultRows',
    });

    return rows.length > 0
      ? rows[0] as RecipeDatabaseRow
      : null;
  }

  async getAll(): Promise<RecipeDatabaseRow[]> {
    const rows = this.#db.db.exec({
      sql: query.selectAll.sql,
      returnValue: 'resultRows',
    });

    return rows as RecipeDatabaseRow[];
  }

  async add(dto: CreateRecipeDatabaseRow): Promise<RecipeDatabaseRow> {
    this.#db.db.exec({
      sql: query.insert.sql,
      bind: [dto.title, dto.description, dto.imageFilename],
    });

    const rowsAffected = this.#db.db.changes();
    if (rowsAffected !== 1) {
      const message = 'Recipe not created';
      this.#logger.error(message, dto);
      throw new Error(message);
    }

    const id = this.#db.db.exec({
      sql: query.lastId.sql,
      returnValue: 'resultRows',
    })[0][0];

    return [
      Number(id),
      dto.title,
      dto.description,
      dto.imageFilename,
      dto.createdAt,
    ];
  }

  async delete(id: Recipe['id']): Promise<void> {
    this.#db.db.exec({
      sql: query.delete.sql,
      bind: [id],
    });

    const rowsAffected = this.#db.db.changes();
    if (rowsAffected !== 1) {
      const message = 'Recipe not removed';
      this.#logger.error(message, { id });
      throw new Error(message);
    }
  }
}
