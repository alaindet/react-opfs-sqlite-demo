import { Database } from '@sqlite.org/sqlite-wasm';

import { Logger } from '../logger';
import { ImagesController } from '../images';
import { WorkerAction } from '../worker-message-broker';
import { createBackupDownloadAction } from './download.action';
import { createBackupRestoreAction } from './restore.actions';

export const backupRoutes = (
  logger: Logger,
  db: Database,
  images: ImagesController,
): WorkerAction[] => [
  createBackupDownloadAction(logger, db, images),
  createBackupRestoreAction(logger, db, images),
];