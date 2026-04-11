
import { Logger } from '../logger';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerSuccessResponse } from '../worker-message-broker';
import { BACKUP_ACTION } from './actions';
import { BackupService } from './backup.service';

export const createBackupRestoreAction = (
  logger: Logger,
  service: BackupService,
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
