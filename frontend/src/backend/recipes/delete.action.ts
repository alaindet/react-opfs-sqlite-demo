import { Recipe } from '../../types';
import { RecipesDatabaseMock } from '../database.mock';
import { Logger } from '../logger';
import { WorkerRequest, WorkerResponder } from '../worker-message-broker';
import { RECIPES_ACTION } from './actions';

export const createRecipesDeleteAction = (
  recipesDb: RecipesDatabaseMock,
  logger: Logger,
) => ({
  action: RECIPES_ACTION.DELETE,
  async handle(
    req: WorkerRequest<Recipe>,
    res: WorkerResponder,
  ) {
    const recipe = req.data;
    const recipeId = recipe.id;
    const existing = await recipesDb.getById(recipeId);

    if (!existing) {
      return res.error(`Recipe with ID ${recipeId} not found`, { id: recipeId });
    }

    await recipesDb.deleteById(recipeId);

    // TODO: Remove the image

    return res.success(`Recipe "${recipe.title}" deleted`, recipe);
  },
});