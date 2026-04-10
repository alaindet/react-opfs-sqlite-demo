import { Recipe } from '../../types';
import { Logger } from '../logger';
import { WorkerRequest, WorkerResponder, WorkerResponse } from '../worker-message-broker';
import { RECIPES_ACTION } from './actions';
import { RecipesService } from './recipes.service';

export const createRecipesGetAllAction = (
  logger: Logger,
  service: RecipesService,
) => ({
  action: RECIPES_ACTION.GET_ALL,
  async handle(
    req: WorkerRequest,
    res: WorkerResponder,
  ): Promise<WorkerResponse<Recipe[]>> {
    const recipes = await service.getAll();
    return res.success('Get all recipes', recipes);
  },
});
