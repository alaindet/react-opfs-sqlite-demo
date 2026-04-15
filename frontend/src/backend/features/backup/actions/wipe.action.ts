import { IMAGES_DIR } from '../../../core/constants';
import { DatabaseService } from '../../../core/database';
import { Logger } from '../../../core/logger';
import { OpfsDirectoryController } from '../../../core/opfs';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerSuccessResponse } from '../../../core/worker-message-broker';
import { BACKUP_ACTION } from './__names';

export const wipeAction = (
  worker: DedicatedWorkerGlobalScope,
  logger: Logger,
  dbService: DatabaseService,
  dirController: OpfsDirectoryController,
) => ({
  action: BACKUP_ACTION.WIPE,
  async handle(
    req: WorkerRequest<File>,
    res: WorkerResponder,
  ): Promise<WorkerSuccessResponse | WorkerErrorResponse> {
    dbService.db.exec({ sql: 'DELETE FROM recipes' });
    logger.trace('Wiped database');

    await dirController.safeDeleteDir(IMAGES_DIR);
    logger.trace('Wiped images');
    
    return res.success('Wiped all data', null);
  },
});
