import sqlite3InitModule, { Database } from '@sqlite.org/sqlite-wasm';
import JSZip from 'jszip';

import { Logger } from '../logger';
import { OpfsDirectoryController } from '../opfs';
import { DATABASE_FILENAME, IMAGES_DIR } from '../constants';

export class BackupService {
  #logger!: Logger;
  #db!: Database;
  #fs!: OpfsDirectoryController;

  constructor(
    logger: Logger,
    db: Database,
    fs: OpfsDirectoryController,
  ) {
    this.#logger = logger.createScopedLogger('BackupService');
    this.#db = db;
    this.#fs = fs;
  }

  /** TODO: Stream this? */
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
    const extractedDbFile = zip.file(DATABASE_FILENAME);

    if (!extractedDbFile) {
      const message = 'No database file found in zip';
      this.#logger.error(message);
      throw new Error(message);
    }

    this.#db.close();
    const dbData = await extractedDbFile.async('arraybuffer');
    const sqlite3 = await sqlite3InitModule({
      print: this.#logger.trace,
      printErr: this.#logger.error,
    });

    if (!('opfs' in sqlite3)) {
      const message = 'OPFS not available, cannot import database';
      this.#logger.error(message);
      throw new Error(message);
    }

    await sqlite3.oo1.OpfsDb.importDb(
      `/${DATABASE_FILENAME}`,
      new Uint8Array(dbData),
    );

    // TODO
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
    this.#db.exec({ sql: `VACUUM INTO 'file:${tempFilename}?vfs=opfs'` });
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