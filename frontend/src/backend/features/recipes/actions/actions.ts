import { DatabaseService } from '../../../core/database';
import { ImagesController } from '../../../core/images';
import { Logger } from '../../../core/logger';
import { WorkerAction } from '../../../core/worker-message-broker';
import { getAllAction } from './get-all.action';
import { createAction } from './create.action';
import { deleteAction } from './delete.action';
import { RecipesRepository } from '../recipes.repository';
import { RecipesService } from '../recipes.service';

export const recipesRoutes = (
  logger: Logger,
  db: DatabaseService,
  images: ImagesController,
): WorkerAction[] => {
  const repo = new RecipesRepository(logger, db);
  const service = new RecipesService(logger, repo, images);

  return [
    getAllAction(logger, service),
    createAction(logger, service),
    deleteAction(logger, service),
  ];
};