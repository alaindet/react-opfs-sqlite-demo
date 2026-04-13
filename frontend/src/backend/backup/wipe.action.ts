import { Logger } from '../logger';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerSuccessResponse } from '../worker-message-broker';
import { BACKUP_ACTION } from './actions';
import { BackupService } from './backup.service';

export const createBackupWipeAction = (
  logger: Logger,
  service: BackupService,
) => ({
  action: BACKUP_ACTION.WIPE,
  async handle(
    req: WorkerRequest<File>,
    res: WorkerResponder,
  ): Promise<(
    | WorkerSuccessResponse
    | WorkerErrorResponse
  )> {
    await service.wipe();
    return res.success('Wiped all data', null);
  },
});
