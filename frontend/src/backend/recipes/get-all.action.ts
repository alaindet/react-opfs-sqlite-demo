import { Recipe } from '../../types';
import { recipesMock } from '../recipes.mock';
import { WorkerRequest, WorkerResponse, createOkWorkerResponse } from '../worker-message-broker';

export const RECIPES_GET_ALL_ACTION = {
  name: 'recipes/getAll',
  handle: (request: WorkerRequest<null>): WorkerResponse<Recipe[]> => {
    return createOkWorkerResponse(request, 'Get all recipes', recipesMock);
  }
};
