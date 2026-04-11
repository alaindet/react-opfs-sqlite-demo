
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
    req: WorkerRequest<File>,
    res: WorkerResponder,
  ): Promise<(
    | WorkerSuccessResponse
    | WorkerErrorResponse
  )> {
    if (req.data.type !== 'application/zip') {
      const message = 'Uploaded file must be a .zip file';
      logger.error(message);
      return res.error(message, { fileType: req.data.type });
    }

    const zipBuffer = await req.data.arrayBuffer();
    await service.import(zipBuffer);
    return res.success('Imported all data', null);
  },
});
