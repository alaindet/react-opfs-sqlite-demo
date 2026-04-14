import { Logger } from '../logger';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerSuccessResponse } from '../worker-message-broker';
import { BACKUP_ACTION } from './actions';
import { BackupService } from './backup.service';

export const createBackupExportFflateAction = (
  logger: Logger,
  service: BackupService,
) => ({
  action: BACKUP_ACTION.EXPORT_FFLATE,
  async handle(
    req: WorkerRequest,
    res: WorkerResponder,
  ): Promise<WorkerSuccessResponse | WorkerErrorResponse> {
    try {
      const data = await service.exportFflate(req);
      return res.success('Exporting all data via stream', data, { stream: true });
    } catch (err: any) {
      const errMessage = err?.message ?? 'Cannot export all data';
      return res.error(errMessage, req.data);
    }
  },
});
