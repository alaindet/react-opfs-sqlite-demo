import { Recipe } from '../../types';
import { RecipesDatabaseMock } from '../database.mock';
import { Logger } from '../logger';
import { WorkerRequest, WorkerResponder, WorkerResponse } from '../worker-message-broker';
import { RECIPES_ACTION } from './actions';

export const createRecipesGetAllAction = (
  recipesDb: RecipesDatabaseMock,
  logger: Logger,
) => ({
  action: RECIPES_ACTION.GET_ALL,
  async handle(
    req: WorkerRequest,
    res: WorkerResponder,
  ): Promise<WorkerResponse<Recipe[]>> {
    const recipes = await recipesDb.getAll();
    return res.success('Get all recipes', recipes);
  },
});
