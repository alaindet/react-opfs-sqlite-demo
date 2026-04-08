import { Recipe } from '../../types';
import { RecipesDatabaseMock } from '../database.mock';
import { ImagesController } from '../images';
import { Logger } from '../logger';
import { WorkerRequest, WorkerResponder, WorkerResponse } from '../worker-message-broker';
import { RECIPES_ACTION } from './actions';

export const createRecipesGetAllAction = (
  db: RecipesDatabaseMock,
  images: ImagesController,
  logger: Logger,
) => ({
  action: RECIPES_ACTION.GET_ALL,
  async handle(
    req: WorkerRequest,
    res: WorkerResponder,
  ): Promise<WorkerResponse<Recipe[]>> {
    const recipes = await db.getAll();
    return res.success('Get all recipes', recipes);
  },
});
