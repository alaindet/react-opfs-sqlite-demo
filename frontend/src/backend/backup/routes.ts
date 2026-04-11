import { Database } from '@sqlite.org/sqlite-wasm';

import { Logger } from '../logger';
import { OpfsDirectoryController } from '../opfs';
import { WorkerAction } from '../worker-message-broker';
import { createBackupExportAction } from './export.action';
import { createBackupImportAction } from './import.actions';
import { BackupService } from './backup.service';

export const backupRoutes = (
  logger: Logger,
  db: Database,
  fs: OpfsDirectoryController,
): WorkerAction[] => {
  const service = new BackupService(logger, db, fs);

  return [
    createBackupExportAction(logger, service),
    createBackupImportAction(logger, service),
  ];
};