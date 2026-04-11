
import { Logger } from '../logger';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerSuccessResponse } from '../worker-message-broker';
import { BACKUP_ACTION } from './actions';
import { BackupService } from './backup.service';

export const createBackupImportAction = (
  logger: Logger,
  service: BackupService,
) => ({
  action: BACKUP_ACTION.IMPORT,
  async handle(
    req: WorkerRequest,
    res: WorkerResponder,
  ): Promise<(
    | WorkerSuccessResponse
    | WorkerErrorResponse
  )> {
    // TODO: Check if given a zip file

    return res.asyncSuccess('Imported all data', '');
  },
});
