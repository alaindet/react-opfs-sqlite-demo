import { Database } from '@sqlite.org/sqlite-wasm';

import { Logger } from '../logger';
import { OpfsDirectoryController } from '../opfs';
import { WorkerAction } from '../worker-message-broker';
import { createBackupDownloadAction } from './download.action';
import { createBackupRestoreAction } from './restore.actions';
import { BackupService } from './backup.service';

export const backupRoutes = (
  logger: Logger,
  db: Database,
  fs: OpfsDirectoryController,
): WorkerAction[] => {
  const service = new BackupService(logger, db, fs);

  return [
    createBackupDownloadAction(logger, service),
    createBackupRestoreAction(logger, service),
  ];
};