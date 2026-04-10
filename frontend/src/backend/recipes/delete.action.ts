import { Recipe } from '../../types';
import { Logger } from '../logger';
import { WorkerRequest, WorkerResponder } from '../worker-message-broker';
import { RECIPES_ACTION } from './actions';
import { RecipesService } from './recipes.service';

export const createRecipesDeleteAction = (
  logger: Logger,
  service: RecipesService,
) => ({
  action: RECIPES_ACTION.DELETE,
  async handle(
    req: WorkerRequest<Recipe>,
    res: WorkerResponder,
  ) {
    const recipe = req.data;

    try {
      await service.delete(req.data);
      const message = `Removed recipe "${recipe.title}"`;
      return res.success(message, recipe);
    } catch (err: any) {
      const errMessage = err?.message ?? 'Cannot remove recipe';
      return res.error(errMessage, req.data);
    }
  },
});