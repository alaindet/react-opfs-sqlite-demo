import { RecipesDatabaseMock } from '../database.mock';
import { Logger } from '../logger';
import { WorkerAction } from '../worker-message-broker';
import { createRecipesCreateAction } from './create.action';
import { createRecipesDeleteAction } from './delete.action';
import { createRecipesGetAllAction } from './get-all.action';

export const createRecipesActions = (
  recipesDb: RecipesDatabaseMock,
  logger: Logger,
): WorkerAction[] => [
  createRecipesGetAllAction(recipesDb, logger),
  createRecipesCreateAction(recipesDb, logger),
  createRecipesDeleteAction(recipesDb, logger),
  // ...s
];