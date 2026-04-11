import { DatabaseService } from '../database/database.service';
import { ImagesController } from '../images';
import { Logger } from '../logger';
import { WorkerAction } from '../worker-message-broker';
import { createRecipesCreateAction } from './create.action';
import { createRecipesDeleteAction } from './delete.action';
import { createRecipesGetAllAction } from './get-all.action';
import { RecipesRepository } from './recipes.repository';
import { RecipesService } from './recipes.service';

export const recipesRoutes = (
  logger: Logger,
  db: DatabaseService,
  images: ImagesController,
): WorkerAction[] => {
  const repo = new RecipesRepository(logger, db);
  const service = new RecipesService(logger, repo, images);

  return [
    createRecipesGetAllAction(logger, service),
    createRecipesCreateAction(logger, service),
    createRecipesDeleteAction(logger, service),
  ];
};