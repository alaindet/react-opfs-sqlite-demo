import { CreateRecipeDto, Recipe, RecipeDatabaseRow } from '../../types';
import { ImagesController } from '../images';
import { IMAGE_MAX_DIMENSION, IMAGE_QUALITY } from '../constants';
import { Logger } from '../logger';
import { toSqlDatetime } from '../utils';
import { RecipesRepository } from './recipes.repository';

export class RecipesService {
  #logger!: Logger;
  #repo!: RecipesRepository;
  #images!: ImagesController;
  #mapper?: (row: RecipeDatabaseRow) => Promise<Recipe>;

  constructor(
    logger: Logger,
    repo: RecipesRepository,
    images: ImagesController,
  ) {
    this.#logger = logger.createScopedLogger('RecipesServices');
    this.#repo = repo;
    this.#images = images;
  }

  async getById(id: Recipe['id']): Promise<Recipe | null> {
    const dbRow = await this.#repo.getById(id);
    if (!dbRow) {
      return null;
    }

    const mapper = await this.#getMapper();
    return mapper(dbRow);
  }

  async getAll(): Promise<Recipe[]> {
    const dbRows = await this.#repo.getAll();
    const recipes: Recipe[] = [];
    const mapper = await this.#getMapper();

    for await (const recipe of dbRows.map(mapper)) {
      recipes.push(recipe);
    }
    return recipes;
  }

  async add(dto: CreateRecipeDto): Promise<Recipe> {

    const existing = await this.#repo.getByTitle(dto.title);

    if (existing) {
      const message = 'Recipe with this title already exists';
      this.#logger.error(message, { title: dto.title });
      throw new Error(message);
    }

    // Sync the fs
    let imageFile: File | null = null;

    if (dto.imageFile) {
      try {
        imageFile = await this.#images.saveImage(
          dto.imageFile.name,
          dto.imageFile,
          {
            maxSize: IMAGE_MAX_DIMENSION,
            quality: IMAGE_QUALITY,
          },
        );
      } catch (error) {
        const message = 'Error saving image';
        this.#logger.error(message, { error, imageFile });
        throw new Error(message);
      }
    }

    // Sync the db
    const dbRow = await this.#repo.add({
      title: dto.title,
      description: dto.description,
      imageFilename: imageFile ? imageFile.name : null,
      createdAt: toSqlDatetime(),
    });

    const mapper = await this.#getMapper();
    return mapper(dbRow);
  }

  async delete(recipe: Recipe): Promise<void> {
    const existing = await this.#repo.getById(recipe.id);
    if (!existing) {
      const message = 'Recipe with this ID does not exist';
      this.#logger.error(message, { recipe });
      throw new Error(message);
    }

    // Sync the db
    await this.#repo.delete(recipe.id);

    // Sync the fs
    if (recipe.imageFile) {
      await this.#images.deleteImage(recipe.imageFile.name);
    }
  }

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
        id: Number(row[0]),
        title: String(row[1]),
        description: String(row[2]),
        imageFile,
        createdAt,
      };
    };

    return this.#mapper;
  }
}