import { WorkerRequest, WorkerResponder } from './worker-message-broker';
import { recipesMock } from '../mocks/recipes';
import { CreateRecipeDto, Recipe } from '../types';
import { BACKEND_ACTION } from './actions';

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let recipes = recipesMock;

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  const res = new WorkerResponder(ctx, req);

  switch (req.action) {
    case BACKEND_ACTION.RECIPES_GET_ALL: {
      return res.success('Get all recipes', recipes);
    }

    case BACKEND_ACTION.RECIPES_CREATE: {
      const dto = event.data.data as CreateRecipeDto;
      const titleQuery = dto.title.trim().toLowerCase();
      const existing = recipes.find(recipe => {
        return recipe.title.trim().toLowerCase().includes(titleQuery);
      });

      if (existing) {
        return res.error(`A recipe with title "${dto.title}" already exists`, dto);
      }

      const recipe: Recipe = {
        id: String(Math.random()),
        createdAt: Date.now(),
        title: dto.title,
        description: dto.description,
        imageFilename: 'todo',
      };
      recipes.push(recipe);
      return res.success(`Created recipe "${recipe.title}"`, recipe);
    }

    case BACKEND_ACTION.RECIPES_DELETE: {
      const recipe = event.data.data as Recipe;
      const recipeId = recipe.id;

      const existing = recipes.find(recipe => recipe.id === recipeId);

      if (!existing) {
        return res.error(`Recipe with ID ${recipeId} not found`, { id: recipeId });
      }

      recipes = recipes.filter(recipe => recipe.id !== recipeId);
      return res.success(`Recipe "${recipe.title}" deleted`, recipe);
    }
  }
};