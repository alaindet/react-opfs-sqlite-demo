import { CreateRecipeDto, Recipe } from '../../types';
import { RecipesDatabaseMock } from '../database.mock';
import { getImagesDir, storeImage } from '../images';
import { Logger } from '../logger';
import { WorkerRequest, WorkerResponder } from '../worker-message-broker';
import { RECIPES_ACTION } from './actions';

export const createRecipesCreateAction = (
  recipesDb: RecipesDatabaseMock,
  logger: Logger,
) => ({
  action: RECIPES_ACTION.CREATE,
  async handle(
    req: WorkerRequest,
    res: WorkerResponder,
  ) {
    const dto = req.data as CreateRecipeDto;
    const existing = await recipesDb.getByTitle(dto.title);

    if (existing) {
      const message = `A recipe with title "${dto.title}" already exists`;
      return res.asyncError(message, dto);
    }

    // Sync the fs
    let imageFile!: File;
    try {
      const imagesDir = await getImagesDir();
      imageFile = await storeImage(imagesDir, dto.imageFile.name, dto.imageFile);
    } catch (error) {
      const message = 'Cannot store image';
      const data = { error, filename: dto.imageFile.name };
      logger.error(message, data);
      res.error(message, data);
    }

    // Sync the db
    const recipe: Recipe = {
      id: String(Math.random()),
      createdAt: Date.now(),
      title: dto.title,
      description: dto.description,
      imageFile,
    };

    try {
      await recipesDb.create(recipe);
    } catch (error) {
      const message = 'Cannot save recipe into database';
      const data = { error, recipe };
      logger.error(message, data);
      return res.error(message, data);
    }

    const message = `Created recipe "${recipe.title}"`;
    return res.asyncSuccess(message, recipe);
  },
});
