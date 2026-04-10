import { CreateRecipeDto, Recipe } from '../../types';
import { Logger } from '../logger';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerSuccessResponse } from '../worker-message-broker';
import { RECIPES_ACTION } from './actions';
import { RecipesService } from './recipes.service';

export const createRecipesCreateAction = (
  logger: Logger,
  service: RecipesService,
) => ({
  action: RECIPES_ACTION.CREATE,
  async handle(
    req: WorkerRequest<CreateRecipeDto>,
    res: WorkerResponder,
  ): Promise<(
    | WorkerSuccessResponse<Recipe>
    | WorkerErrorResponse
  )> {
    const dto = req.data;

    try {
      const recipe = await service.add(dto);
      const message = `Created recipe "${recipe.title}"`;
      return res.success(message, recipe);
    } catch (err: any) {
      const errMessage = err?.message ?? 'Cannot create recipe';
      return res.error(errMessage, dto);
    }
  },
});
