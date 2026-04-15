import { DatabaseService } from '../database/database.service';
import { Logger } from '../logger';
import { OpfsDirectoryController } from '../opfs';
import { WorkerAction } from '../worker-message-broker';
import { BackupService } from './backup.service';
import { createBackupExportFflateAction } from './export-fflate.action';
import { createBackupImportFflateAction } from './import-fflate.action';
import { createBackupWipeAction } from './wipe.action';

export const backupRoutes = (
  logger: Logger,
  ctx: DedicatedWorkerGlobalScope,
  db: DatabaseService,
  fs: OpfsDirectoryController,
): WorkerAction[] => {
  const service = new BackupService(logger, ctx, db, fs);

  return [
    // createBackupExportAction(logger, service),
    // createBackupExportStreamAction(logger, service),
    createBackupExportFflateAction(logger, service),
    // createBackupImportAction(logger, service),
    createBackupImportFflateAction(logger, db, fs, ctx),
    createBackupWipeAction(logger, service),
  ];
};