import { Logger } from '../logger';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerSuccessResponse } from '../worker-message-broker';
import { BACKUP_ACTION } from './actions';
import { BackupService } from './backup.service';

export const createBackupDownloadAction = (
  logger: Logger,
  service: BackupService,
) => ({
  action: BACKUP_ACTION.DOWNLOAD,
  async handle(
    req: WorkerRequest,
    res: WorkerResponder,
  ): Promise<(
    | WorkerSuccessResponse
    | WorkerErrorResponse
  )> {
    try {
      const data = await service.download();
      return res.success('Downloaded all data', data);
    } catch (err: any) {
      const errMessage = err?.message ?? 'Cannot download all data';
      return res.error(errMessage, req.data);
    }
  },
});
