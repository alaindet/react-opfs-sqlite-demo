import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { downloadZip, InputWithSizeMeta } from 'client-zip';
import JSZip from 'jszip';

import { DATABASE_FILENAME, IMAGES_DIR } from '../constants';
import { DatabaseService } from '../database/database.service';
import { Logger } from '../logger';
import { OpfsDirectoryController } from '../opfs';
import { WorkerRequest, WorkerResponse, workerSuccessResponse } from '../worker-message-broker';
import { ExportProgress } from './types';

export class BackupService {
  #logger!: Logger;
  #ctx!: DedicatedWorkerGlobalScope;
  #db!: DatabaseService;
  #fs!: OpfsDirectoryController;

  constructor(
    logger: Logger,
    ctx: DedicatedWorkerGlobalScope,
    db: DatabaseService,
    fs: OpfsDirectoryController,
  ) {
    this.#logger = logger.createScopedLogger('BackupService');
    this.#ctx = ctx;
    this.#db = db;
    this.#fs = fs;
  }

  async exportStream(req: WorkerRequest): Promise<
    ReadableStream<Uint8Array<ArrayBuffer>> | null
  > {
    return downloadZip(this.#exportStream(req)).body;
  }

  /**
   * This generates data sequentially to be streamed into the .zip file
   */
  async* #exportStream(req: WorkerRequest): AsyncGenerator<InputWithSizeMeta> {

    const startMessage = 'Exporting data start';
    this.#logger.trace(startMessage);
    const startRes = workerSuccessResponse.progressStart(req, startMessage, null);
    this.#ctx.postMessage(startRes);

    const imagesDir = await this.#fs.dirHandle.getDirectoryHandle(IMAGES_DIR);

    let totalFiles = 1; // Start from 1 to account for the database file
    for await (const _ of imagesDir.keys()) {
      totalFiles++;
    }

    const progress = this.#createExportProgress(req, totalFiles);
    const notifyProgress = () => {
      const progressData = progress();
      this.#logger.trace('Export progress', progressData);
      this.#ctx.postMessage(progressData);
    };
    const dbBuffer = await this.#readDb();

    const exportItem: InputWithSizeMeta = {
      name: DATABASE_FILENAME,
      lastModified: new Date(),
      input: dbBuffer,
    };

    yield exportItem;
    notifyProgress();
    
    for await (const [name, handle] of imagesDir.entries()) {
      if (handle.kind !== 'file') {
        continue;
      }

      const fileHandle = handle as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      const data = await file.arrayBuffer();

      const exportItem: InputWithSizeMeta = {
        name: `${IMAGES_DIR}/${name}`,
        lastModified: new Date(),
        input: data,
      }; 

      yield exportItem;
      notifyProgress();
    }

    const endMessage = 'Exporting data end';
    this.#logger.trace(endMessage);
    const endRes = workerSuccessResponse.progressStart(req, endMessage, null);
    this.#ctx.postMessage(endRes);
  }

  #createExportProgress(req: WorkerRequest, totalFiles: number) {
    let currentFile = 0;

    return (): WorkerResponse<ExportProgress> => {
      currentFile++;

      return workerSuccessResponse.progress(req, 'Exporting in progress', {
        name: 'EXPORT_PROGRESS',
        currentFile,
        totalFiles,
        percent: Math.round((currentFile / totalFiles) * 100),
      });
    };
  }

  async export(): Promise<ArrayBuffer> {
    const zip = new JSZip();
    const dbBuffer = await this.#readDb();
    zip.file(DATABASE_FILENAME, dbBuffer);

    const imagesDir = zip.folder(IMAGES_DIR)!;
    const images = await this.#readImages();
    let imagesTotalBytesLength = 0;
    for (const { name, data } of images) {
      imagesTotalBytesLength += data.byteLength;
      imagesDir.file(name, data);
    }

    const dbReport = this.#getDbReport(dbBuffer.byteLength);
    const imagesSize = this.#getImagesReport(images.length, imagesTotalBytesLength);
    this.#logger.trace(`Exporting data: database (${dbReport}), images (${imagesSize})`);

    return zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  }

  async import(data: ArrayBuffer): Promise<void> {
    const zip = await JSZip.loadAsync(data);

    // Extract the database file from the archive
    const extractedDbFile = zip.file(DATABASE_FILENAME);
    if (!extractedDbFile) {
      const message = 'No database file found in zip';
      this.#logger.error(message);
      throw new Error(message);
    }

    // Close the existing database
    this.#db.db.close();

    // Open the new database connection
    const sqlite3 = await sqlite3InitModule({
      print: this.#logger.trace,
      printErr: this.#logger.error,
    });

    // ERROR: OPFS not available
    if (!('opfs' in sqlite3)) {
      const message = 'OPFS not available, cannot import database';
      this.#logger.error(message);
      throw new Error(message);
    }

    // Import the database data
    const dbData = await extractedDbFile.async('arraybuffer');
    await sqlite3.oo1.OpfsDb.importDb(
      `/${DATABASE_FILENAME}`,
      new Uint8Array(dbData),
    );

    // Store the reference to the new database connection
    this.#db.setDb(new sqlite3.oo1.OpfsDb(DATABASE_FILENAME));

    // Remove all existing images
    await this.#fs.safeDeleteDir(IMAGES_DIR);

    const extractedImagesDir = zip.folder(IMAGES_DIR);

    // ERROR: If no images to import from the .zip file
    if (!extractedImagesDir) {
      const message = 'No images to import found';
      this.#logger.error(message);
      throw new Error(message);
    }

    // Get the images directory handle on OPFS
    const imagesDirController = await this.#fs.getDir(IMAGES_DIR);
    const imagesDir = imagesDirController.dirHandle;

    // Read all images from .zip in memory
    // TODO: Stream/chunk?
    const imageFiles: FileRestored[] = [];
    extractedImagesDir.forEach((name, imageFile) => {
      if (!imageFile.dir) {
        const data$ = imageFile.async('arraybuffer');
        imageFiles.push({ name, data$ });
      }
    });

    // Write extracted images into the OPFS
    for await (const { name, data$ } of imageFiles) {
      const buffer = await data$;
      const data = new Uint8Array(buffer);
      const fileHandle = await imagesDir.getFileHandle(name, { create: true });
      const accessHandle = await fileHandle.createSyncAccessHandle();
      try {
        accessHandle.write(data, { at: 0 });
        accessHandle.truncate(data.byteLength);
        accessHandle.flush();
      } finally {
        accessHandle.close();
      }
    }
  }

  async wipe(): Promise<void> {
    // TODO: Make more generic?
    this.#db.db.exec({ sql: 'DELETE FROM recipes' });
    this.#logger.trace('Wiped database');
    await this.#fs.safeDeleteDir(IMAGES_DIR);
    this.#logger.trace('Wiped images');
  }

  #getDbReport(bytesLength: number): string {
    const kb = bytesLength / 1024;
    const mb = kb / 1024;
    return `${mb.toFixed(3)} MB`;
  }

  #getImagesReport(filesCount: number, bytesLength: number): string {
    const kb = bytesLength / 1024;
    const mb = kb / 1024;
    return `${filesCount} images, ${mb} MB total`;
  }

  async #readDb(): Promise<ArrayBuffer> {
    const tempFilename = '.temp.db';
    await this.#fs.safeDeleteFile(tempFilename);
    this.#db.db.exec({ sql: `VACUUM INTO 'file:${tempFilename}?vfs=opfs'` });
    const tempFile = await this.#fs.readFile(tempFilename);
    const tempBuffer = await tempFile.arrayBuffer();
    await this.#fs.safeDeleteFile(tempFilename);
    return tempBuffer;
  }

  async #readImages(): Promise<FileBackup[]> {
    const rootDir = this.#fs.dirHandle;
    const imagesDir = await rootDir.getDirectoryHandle(IMAGES_DIR);
    const files: FileBackup[] = [];

    for await (const [name, handle] of imagesDir.entries()) {
      if (handle.kind === 'file') {
        const fileHandle = handle as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const fileData = await file.arrayBuffer();
        files.push({ name, data: fileData });
      }
    }

    return files;
  }
}

type FileBackup = {
  name: string;
  data: ArrayBuffer;
};

type FileRestored = {
  name: string;
  data$: Promise<ArrayBuffer>;
};