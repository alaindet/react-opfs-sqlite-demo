import { CreateRecipeDto, Recipe } from '../types';
import { BACKEND_ACTION } from './actions';
import { recipesMock } from './recipes.mock';
import { RECIPES_GET_ALL_ACTION } from './recipes/get-all.action';
import { WorkerRequest, WorkerResponse } from './worker-message-broker';

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let recipes = recipesMock;

// TODO: Init dependencies
// TODO: Register routes with dependencies

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  const res = await resolve(req);
  ctx.postMessage(res);

  // switch (req.action) {
  //   case RECIPES_GET_ALL_ACTION.name:
  //     return res.dispatch(RECIPES_GET_ALL_ACTION.handle(req));

  //   case BACKEND_ACTION.RECIPES_CREATE: {
  //     const dto = event.data.data as CreateRecipeDto;
  //     const titleQuery = dto.title.trim().toLowerCase();
  //     const existing = recipes.find(recipe => {
  //       return recipe.title.trim().toLowerCase().includes(titleQuery);
  //     });

  //     if (existing) {
  //       return res.error(`A recipe with title "${dto.title}" already exists`, dto);
  //     }

  //     const recipe: Recipe = {
  //       id: String(Math.random()),
  //       createdAt: Date.now(),
  //       title: dto.title,
  //       description: dto.description,
  //       imageFilename: 'todo',
  //     };
  //     recipes.push(recipe);
  //     return res.success(`Created recipe "${recipe.title}"`, recipe);
  //   }

  //   case BACKEND_ACTION.RECIPES_DELETE: {
  //     const recipe = event.data.data as Recipe;
  //     const recipeId = recipe.id;

  //     const existing = recipes.find(recipe => recipe.id === recipeId);

  //     if (!existing) {
  //       return res.error(`Recipe with ID ${recipeId} not found`, { id: recipeId });
  //     }

  //     recipes = recipes.filter(recipe => recipe.id !== recipeId);
  //     return res.success(`Recipe "${recipe.title}" deleted`, recipe);
  //   }
  // }
};

async function resolve(req: WorkerRequest): Promise<WorkerResponse> {
  switch (req.action) {

    case RECIPES_GET_ALL_ACTION.name:
      return RECIPES_GET_ALL_ACTION.handle(req);

    default:
      throw new Error('Action not implemented');
  }
}
