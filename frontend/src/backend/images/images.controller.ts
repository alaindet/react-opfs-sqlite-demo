import { OpfsDirectoryController, stripFileExtension } from '../opfs';
import { IMAGE_MAX_DIMENSION, IMAGE_QUALITY } from './functions';

export class ImagesController {

  dir!: OpfsDirectoryController;

  constructor(dir: OpfsDirectoryController) {
    this.dir = dir;
  }

  static async fromPath(
    dir: OpfsDirectoryController,
    path: string | string[],
  ): Promise<ImagesController> {
    const subdir = await dir.getDir(path);
    return new ImagesController(subdir);
  }

  /**
   * This overrides the existing file, resizes the image to a max size,
   * compresses it, then stores it
   */
  async saveImage(
    filename: string,
    file: File,
    options?: {
      maxSize?: number;
      quality?: number;
    },
  ): Promise<File> {
    const maxDimension = options?.maxSize ?? IMAGE_MAX_DIMENSION;
    const quality = options?.quality ?? IMAGE_QUALITY;

    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    // Resize
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    let blob: Blob = file;

    // Compress
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    try {
      blob = await canvas.convertToBlob({ type: 'image/webp', quality });
    } catch {
      blob = await canvas.convertToBlob({ type: 'image/jpeg', quality});
    }

    // Store image
    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const fullFilename = `${stripFileExtension(filename)}.${ext}`;
    await this.dir.writeDataToFile(fullFilename, blob);

    // Return a synthetic file from blob
    // return new File([blob], fullFilename, { type: blob.type });

    // Re-read the file from the OPFS
    return this.dir.readFile(fullFilename);
  }

  async readImage(filename: string): Promise<File> {
    return this.dir.readFile(filename);
  }

  async deleteImage(filename: string): Promise<void> {
    return this.dir.deleteFile(filename);
  }
}
