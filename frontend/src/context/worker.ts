import { recipesMock } from '../mocks/recipes';
import { BackendRequest, CreateRecipeDto, Recipe } from '../types';
import { BACKEND_ACTION } from './actions';

let recipes = recipesMock;
const DELAY = 500;

self.onmessage = async (event: MessageEvent<BackendRequest>) => {
  console.log('[WORKER] From Main:', event);
  const res = createResponseFactory(event.data);

  switch (event.data.action) {
    case BACKEND_ACTION.RECIPES_GET_ALL: {
      res.ok('Get all recipes', recipes);
      break;
    }

    case BACKEND_ACTION.RECIPES_CREATE: {
      const dto = event.data.data as CreateRecipeDto;
      const titleQuery = dto.title.trim().toLowerCase();
      const existing = recipes.find(recipe => {
        return recipe.title.trim().toLowerCase().includes(titleQuery);
      });

      if (existing) {
        return res.err(
          `A recipe with title "${dto.title}" already exists`,
          dto
        );
      }

      const recipe: Recipe = {
        id: String(Math.random()),
        createdAt: Date.now(),
        title: dto.title,
        description: dto.description,
        imageFilename: 'todo',
      };
      recipes.push(recipe);
      res.ok(`Created recipe "${recipe.title}"`, recipe);
      break;
    }

    case BACKEND_ACTION.RECIPES_DELETE: {
      const recipe = event.data.data as Recipe;
      const recipeId = recipe.id;

      const existing = recipes.find(recipe => recipe.id === recipeId);

      if (!existing) {
        return res.err(
          `Recipe with ID ${recipeId} not found`,
          { id: recipeId },
        );
      }

      recipes = recipes.filter(recipe => recipe.id !== recipeId);
      res.ok(`Recipe "${recipe.title}" deleted`, recipe);
    }
  }
};

// TODO: Remove
function wait(delay: number): Promise<void> {
  return new Promise(done => {
    setTimeout(done, delay);
  });
}

function createResponseFactory(req: BackendRequest) {
  return {
    ok: async <T extends any = any>(message: string, data: T) => {
      await wait(DELAY);
      self.postMessage({
        id: req.id,
        action: req.action,
        message,
        error: false,
        data,
      });
    },
    err: async <T extends any = any>(message: string, data: T) => {
      await wait(DELAY);
      self.postMessage({
        id: req.id,
        action: req.action,
        message,
        error: true,
        data,
      });
    },
  };
}