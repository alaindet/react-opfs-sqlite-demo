import { RecipesDatabaseMock } from '../database.mock';
import { ImagesController } from '../images';
import { Logger } from '../logger';
import { WorkerAction } from '../worker-message-broker';
import { createRecipesCreateAction } from './create.action';
import { createRecipesDeleteAction } from './delete.action';
import { createRecipesGetAllAction } from './get-all.action';

export const createRecipesActions = (
  db: RecipesDatabaseMock,
  images: ImagesController,
  logger: Logger,
): WorkerAction[] => [
  createRecipesGetAllAction(db, images, logger),
  createRecipesCreateAction(db, images, logger),
  createRecipesDeleteAction(db, images, logger),
  // ...s
];