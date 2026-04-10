import { Database } from '@sqlite.org/sqlite-wasm';

import { ImagesController } from '../images';
import { Logger } from '../logger';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerSuccessResponse } from '../worker-message-broker';
import { BACKUP_ACTION } from './actions';

export const createBackupRestoreAction = (
  logger: Logger,
  db: Database,
  images: ImagesController,
) => ({
  action: BACKUP_ACTION.RESTORE,
  async handle(
    req: WorkerRequest,
    res: WorkerResponder,
  ): Promise<(
    | WorkerSuccessResponse
    | WorkerErrorResponse
  )> {
    return res.asyncSuccess('Restore', '');
  },
});
