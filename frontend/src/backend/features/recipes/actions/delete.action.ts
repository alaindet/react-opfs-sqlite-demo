import { Logger } from '../../../core/logger';
import { WorkerRequest, WorkerResponder } from '../../../core/worker-message-broker';
import { RECIPES_ACTION } from './__names';
import { RecipesService } from '../recipes.service';
import { Recipe } from '../../../../types';

export const deleteAction = (
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