import { CreateRecipeDto, Recipe } from '../types';
import { BACKEND_ACTION } from './actions';
import { enforceDataPersistance } from './opfs/functions';
import { WorkerClient, WorkerResponse } from './worker-message-broker';

const workerUrl = new URL('./worker.ts', import.meta.url);
const worker = new Worker(workerUrl, { type: 'module' });
const workerClient = new WorkerClient(worker);

enforceDataPersistance();

// TODO: Refactor
export const backend = {
  getRecipes: (): Promise<WorkerResponse<Recipe[]>> => {
    return workerClient.request(BACKEND_ACTION.RECIPES.GET_ALL);
  },
  createRecipe: (dto: CreateRecipeDto): Promise<WorkerResponse<Recipe>> => {
    return workerClient.request(BACKEND_ACTION.RECIPES.CREATE, dto);
  },
  deleteRecipe: (recipe: Recipe): Promise<WorkerResponse<Recipe>> => {
    return workerClient.request(BACKEND_ACTION.RECIPES.DELETE, recipe);
  },
};
