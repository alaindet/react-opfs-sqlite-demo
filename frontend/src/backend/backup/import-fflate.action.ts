import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { Unzip, UnzipInflate } from 'fflate';

import { Logger } from '../logger';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerResponse, WorkerSuccessResponse } from '../worker-message-broker';
import { BACKUP_ACTION } from './actions';
import { BackupService } from './backup.service';
import { DATABASE_FILENAME, IMAGES_DIR } from '../constants';
import { DatabaseService } from '../database/database.service';
import { OpfsDirectoryController } from '../opfs';

export const createBackupImportFflateAction = (
  logger: Logger,
  dbService: DatabaseService,
  dirController: OpfsDirectoryController,
  ctx: DedicatedWorkerGlobalScope,
  // service: BackupService,
) => ({
  action: BACKUP_ACTION.IMPORT_FFLATE,
  async handle(
    req: WorkerRequest<ReadableStream<Uint8Array>>,
    res: WorkerResponder,
  ): Promise<(
    | WorkerSuccessResponse
    | WorkerErrorResponse
  )> {
    // Setup
    dbService.db.close();
    await dirController.safeDeleteDir(IMAGES_DIR);
    const imagesDirController = await dirController.getDir(IMAGES_DIR);
    const imagesDir = imagesDirController.dirHandle;

    return new Promise(async sendResponse => {
      const unzip = new Unzip();
      unzip.register(UnzipInflate);

      unzip.onfile = fileStream => {
        const chunks: Uint8Array[] = [];
  
        // Drain the whole file stream
        fileStream.ondata = (err, chunk, final) => {
  
          if (err) {
            sendResponse(res.error('Cannot extract file', err));
            return;
          }
  
          // The chunk is internally re-used, so copy it before storing it
          chunks.push(chunk.slice());
  
          if (final) {
            const bytesLength = chunks.reduce((b, chunk) => b + chunk.length, 0);
            const fileData = new Uint8Array(bytesLength);
  
            let offset = 0;
            for (const chunk of chunks) {
              fileData.set(chunk, offset);
              offset += chunk.length;
            }

            restoreFile(fileStream.name, fileData);
          }
        };
  
        fileStream.start();
      };

      // Consume the input .zip stream
      try {
        const zipReader = req.data.getReader();

        while (true) {
          const { value, done } = await zipReader.read();
          if (done) {
            unzip.push(new Uint8Array(0), true);
            sendResponse(res.success('Importing .zip stream', null));
            return;
          }
          unzip.push(value, false);
        }
      } catch (err) {
        sendResponse(res.error('Cannot read .zip stream', err));
      }
    });

    function restoreFile(filename: string, fileData: Uint8Array) {
      if (filename === DATABASE_FILENAME) {
        restoreDb(fileData);
        return;
      }

      restoreImage(filename, fileData);
    }

    async function restoreDb(dbData: Uint8Array) {
      const sqlite3 = await sqlite3InitModule({
        print: logger.trace,
        printErr: logger.error,
      });

      if (!('opfs' in sqlite3)) {
        throw new Error('OPFS not available, cannot import database');
      }

      await sqlite3.oo1.OpfsDb.importDb(DATABASE_FILENAME, dbData);
      dbService.setDb(new sqlite3.oo1.OpfsDb(DATABASE_FILENAME));
    }

    async function restoreImage(filename: string, fileData: Uint8Array) {

      if (!filename.startsWith(`${IMAGES_DIR}/`)) {
        throw new Error('This file is not an image');
      }

      const name = filename.slice(IMAGES_DIR.length + 1);
      if (!name || name.includes('/')) {
        throw new Error('Invalid file name');
      }

      const fileHandle = await imagesDir.getFileHandle(name, { create: true });
      const accessHandle = await fileHandle.createSyncAccessHandle();
      try {
        accessHandle.write(fileData, { at: 0 });
        accessHandle.truncate(fileData.byteLength);
        accessHandle.flush();
      } finally {
        accessHandle.close();
      }
    }
  },
});