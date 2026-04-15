import { DatabaseService } from '../../../core/database';
import { Logger } from '../../../core/logger';
import { OpfsDirectoryController } from '../../../core/opfs';
import { WorkerAction } from '../../../core/worker-message-broker';
import { exportAction } from './export.action';
import { importAction } from './import.action';
import { wipeAction } from './wipe.action';

export const backupRoutes = (
  worker: DedicatedWorkerGlobalScope,
  logger: Logger,
  dbService: DatabaseService,
  dirController: OpfsDirectoryController,
): WorkerAction[] => {
  return [
    exportAction(worker, logger, dbService, dirController),
    importAction(worker, logger, dbService, dirController),
    wipeAction(worker, logger, dbService, dirController),
  ];
};