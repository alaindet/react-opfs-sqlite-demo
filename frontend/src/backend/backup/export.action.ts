import { Logger } from '../logger';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerSuccessResponse } from '../worker-message-broker';
import { BACKUP_ACTION } from './actions';
import { BackupService } from './backup.service';

export const createBackupExportAction = (
  logger: Logger,
  service: BackupService,
) => ({
  action: BACKUP_ACTION.EXPORT,
  async handle(
    req: WorkerRequest,
    res: WorkerResponder,
  ): Promise<(
    | WorkerSuccessResponse
    | WorkerErrorResponse
  )> {
    try {
      const data = await service.export();
      return res.success('Exported all data', data);
    } catch (err: any) {
      const errMessage = err?.message ?? 'Cannot export all data';
      return res.error(errMessage, req.data);
    }
  },
});
