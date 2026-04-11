import { deleteDir, deleteFile, emptyDir, fileExists, getDir, getRelativeDir, readFile, writeDataToFile, writeFile } from './functions';

export class OpfsDirectoryController {

  #dirHandle!: FileSystemDirectoryHandle;

  constructor(dirHandle: FileSystemDirectoryHandle) {
    this.#dirHandle = dirHandle;
  }

  static async fromRoot(): Promise<OpfsDirectoryController> {
    const rootDirHandle = await navigator.storage.getDirectory();
    return new OpfsDirectoryController(rootDirHandle);
  }

  static async fromPath(
    path?: string | string[],
  ): Promise<OpfsDirectoryController> {
    const dirHandle = await getDir(path);
    return new OpfsDirectoryController(dirHandle);
  }

  get dirHandle(): FileSystemDirectoryHandle {
    return this.#dirHandle;
  }

  async getDir(path: string | string[]): Promise<OpfsDirectoryController> {
    const dir = await getRelativeDir(this.#dirHandle, path);
    return new OpfsDirectoryController(dir);
  }

  async writeFile(filename: string, file: File): Promise<void> {
    return writeFile(this.#dirHandle, filename, file);
  }

  async writeDataToFile(filename: string, data: ArrayBuffer | Blob): Promise<void> {
    return writeDataToFile(this.#dirHandle, filename, data);
  }

  async readFile(filename: string): Promise<File> {
    return readFile(this.#dirHandle, filename);
  }  

  async deleteFile(filename: string): Promise<void> {
    return deleteFile(this.#dirHandle, filename);
  }

  async deleteDir(filename: string): Promise<void> {
    return deleteDir(this.#dirHandle, filename);
  }

  async safeDeleteFile(filename: string): Promise<void> {
    if (await fileExists(this.#dirHandle, filename)) {
      await deleteFile(this.#dirHandle, filename);
    }
  }

  async empty(): Promise<void> {
    return emptyDir(this.#dirHandle);
  }

  async fileExists(filename: string): Promise<boolean> {
    return fileExists(this.#dirHandle, filename);
  }
}