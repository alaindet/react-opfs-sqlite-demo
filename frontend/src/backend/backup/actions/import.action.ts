import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { Unzip, UnzipFile, UnzipInflate } from 'fflate';

import { DATABASE_FILENAME, IMAGES_DIR } from '../../constants';
import { DatabaseService } from '../../database';
import { Logger } from '../../logger';
import { OpfsDirectoryController } from '../../opfs';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerSuccessResponse } from '../../worker-message-broker';
import { BACKUP_ACTION } from './__names';

export const importAction = (
  worker: DedicatedWorkerGlobalScope,
  _logger: Logger,
  dbService: DatabaseService,
  dirController: OpfsDirectoryController,
) => ({
  action: BACKUP_ACTION.IMPORT,
  async handle(
    req: WorkerRequest<ReadableStream<Uint8Array>>,
    res: WorkerResponder,
  ): Promise<WorkerSuccessResponse | WorkerErrorResponse> {
    const logger = _logger.createScopedLogger('import');

    return new Promise(async sendResponse => {
      try {
        const imagesDir = await setup();
        const unzip = new Unzip();
        unzip.register(UnzipInflate);
        logger.trace('Initialized fflate');

        unzip.onfile = file => {
          logger.trace('Streamed .zip file', file);
          try {
            unzipFile(imagesDir, file);
          } catch (error: any) {
            const message = error?.message ?? 'Importing failed';
            logger.error(message, { error });
            sendResponse(res.error(message, { error }));
          }
        };

        const message = await consumeZipStream(unzip, req.data);
        logger.trace('Imported all data');
        sendResponse(res.success(message, null));
      } catch (error: any) {
        const message = error?.message ?? 'Importing failed';
        logger.error(message, { error });
        sendResponse(res.error(message, { error }));
      }
    });

    async function setup(): Promise<FileSystemDirectoryHandle> {
      logger.trace('Setup import');
      dbService.db.close();
      logger.trace('Database connection closed');
      await dirController.safeDeleteDir(IMAGES_DIR);
      logger.trace('Images directory deleted');
      const imagesDirController = await dirController.getDir(IMAGES_DIR);
      return imagesDirController.dirHandle;
    }

    async function consumeZipStream(
      unzip: Unzip,
      zipStream: ReadableStream<Uint8Array>,
    ): Promise<string> {
      const zipReader = zipStream.getReader();
      logger.trace('Start consuming the .zip stream');

      while (true) {
        const { value, done } = await zipReader.read();
        logger.trace('.zip stream read', { value, done });
        if (done) {
          unzip.push(new Uint8Array(0), true);
          logger.trace('.zip stream consumed');
          return 'Importing .zip stream';
        }
        unzip.push(value, false);
      }
    }

    function unzipFile(
      imagesDir: FileSystemDirectoryHandle,
      fileStream: UnzipFile,
    ): void {
      logger.trace('Start extracting file');
      const dataChunks: Uint8Array[] = [];
  
      // Drain the whole file stream
      fileStream.ondata = (err, dataChunk, final) => {
        logger.trace('.zip file data chunk read', { err, dataChunk, final });

        if (err) {
          const message = 'Cannot extract zipped file';
          logger.error(message, { err });
          throw new Error(message);
        }

        // The chunk is internally re-used, so copy it before storing it
        dataChunks.push(dataChunk.slice());

        // Merge all data chunks into one
        if (final) {
          logger.trace('Merging all extracted zipped file data chunks')
          const bytesLength = dataChunks.reduce((b, chunk) => b + chunk.length, 0);
          const fileData = new Uint8Array(bytesLength);
          let offset = 0;

          for (const dataChunk of dataChunks) {
            fileData.set(dataChunk, offset);
            offset += dataChunk.length;
          }

          if (fileStream.name === DATABASE_FILENAME) {
            restoreDb(fileData);
          } else {
            restoreImage(imagesDir, fileStream.name, fileData);
          }
        }
      };

      fileStream.start();
    }

    async function restoreDb(dbData: Uint8Array) {
      logger.trace('Restoring the database');

      const sqlite3 = await sqlite3InitModule({
        print: logger.trace,
        printErr: logger.error,
      });

      if (!('opfs' in sqlite3)) {
        const message = 'OPFS not available, cannot import database';
        logger.error(message);
        throw new Error(message);
      }

      await sqlite3.oo1.OpfsDb.importDb(DATABASE_FILENAME, dbData);
      logger.trace('Database restored');

      dbService.setDb(new sqlite3.oo1.OpfsDb(DATABASE_FILENAME));
      logger.trace('Database connection saved into DatabaseService dependency');
    }

    async function restoreImage(
      imagesDir: FileSystemDirectoryHandle,
      filename: string,
      fileData: Uint8Array,
    ) {
      logger.trace('Restoring image', { filename });

      if (!filename.startsWith(`${IMAGES_DIR}/`)) {
        const message = 'This file is not an image';
        logger.error(message, { filename });
        throw new Error(message);
      }

      const name = filename.slice(IMAGES_DIR.length + 1);
      if (!name || name.includes('/')) {
        const message = 'Invalid file name';
        logger.error(message, { filename });
        throw new Error(message);
      }

      const fileHandle = await imagesDir.getFileHandle(name, { create: true });
      const accessHandle = await fileHandle.createSyncAccessHandle();
      try {
        accessHandle.write(fileData, { at: 0 });
        accessHandle.truncate(fileData.byteLength);
        accessHandle.flush();
        logger.trace('Restored image', { filename });
      } finally {
        accessHandle.close();
      }
    }
  },
});