import { Recipe } from '../../types';
import { RecipesDatabaseMock } from '../database.mock';
import { ImagesController } from '../images';
import { Logger } from '../logger';
import { WorkerRequest, WorkerResponder } from '../worker-message-broker';
import { RECIPES_ACTION } from './actions';

export const createRecipesDeleteAction = (
  db: RecipesDatabaseMock,
  images: ImagesController,
  logger: Logger,
) => ({
  action: RECIPES_ACTION.DELETE,
  async handle(
    req: WorkerRequest<Recipe>,
    res: WorkerResponder,
  ) {
    const recipe = req.data;
    const recipeId = recipe.id;
    const existing = await db.getById(recipeId);

    if (!existing) {
      return res.error(`Recipe with ID ${recipeId} not found`, { id: recipeId });
    }

    // Sync the db
    await db.deleteById(recipeId);

    // Sync the fs
    if (recipe.imageFile) {
      await images.deleteImage(recipe.imageFile.name);
    }

    return res.success(`Recipe "${recipe.title}" deleted`, recipe);
  },
});