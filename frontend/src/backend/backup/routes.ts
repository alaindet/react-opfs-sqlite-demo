import { DatabaseService } from '../database/database.service';
import { Logger } from '../logger';
import { OpfsDirectoryController } from '../opfs';
import { WorkerAction } from '../worker-message-broker';
import { BackupService } from './backup.service';
import { createBackupExportAction } from './export.action';
import { createBackupImportAction } from './import.action';
import { createBackupWipeAction } from './wipe.action';

export const backupRoutes = (
  logger: Logger,
  db: DatabaseService,
  fs: OpfsDirectoryController,
): WorkerAction[] => {
  const service = new BackupService(logger, db, fs);

  return [
    createBackupExportAction(logger, service),
    createBackupImportAction(logger, service),
    createBackupWipeAction(logger, service),
  ];
};