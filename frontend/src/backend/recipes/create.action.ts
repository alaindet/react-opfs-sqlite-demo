import { CreateRecipeDto, Recipe } from '../../types';
import { RecipesDatabaseMock } from '../database.mock';
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

    const recipe: Recipe = {
      id: String(Math.random()),
      createdAt: Date.now(),
      title: dto.title,
      description: dto.description,
      imageFilename: 'todo',
    };

    await recipesDb.create(recipe);
    const message = `Created recipe "${recipe.title}"`;
    return res.asyncSuccess(message, recipe);
  },
});