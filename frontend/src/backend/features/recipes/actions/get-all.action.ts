import { Logger } from '../../../core/logger';
import { WorkerRequest, WorkerResponder, WorkerResponse } from '../../../core/worker-message-broker';
import { RECIPES_ACTION } from './__names';
import { RecipesService } from '../recipes.service';
import { Recipe } from '../../../../types';

export const getAllAction = (
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
