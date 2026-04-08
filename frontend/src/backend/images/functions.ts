import { deleteFile, fileExists, readFile, writeDataToFile } from '../opfs';

export const IMAGES_DIR = 'images';
export const IMAGE_MAX_DIMENSION = 1200; // px - longest edge
export const IMAGE_QUALITY = 0.8;

/** Compresses and stored an image */
export async function storeImage(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  file: File,
  options?: { overrideExisting: boolean },
): Promise<File> {
  const buffer = await file.arrayBuffer();
  const overrideExisting = !!options?.overrideExisting;

  const compressed = await compressAndResizeImage(buffer, {
    maxDimension: IMAGE_MAX_DIMENSION,
    quality: IMAGE_QUALITY,
  });

  const ext = compressed.type === 'image/webp' ? 'webp' : 'jpg';
  const fullFilename = `${filename}.${ext}`;

  const exists = await fileExists(dirHandle, fullFilename);
  if (exists && !overrideExisting) {
    throw new Error(`File already exists: ${fullFilename}`);
  }

  await writeDataToFile(dirHandle, fullFilename, compressed);
  const writtenFile = await readFile(dirHandle, fullFilename);
  return writtenFile;
}

/** Reads an image from OPFS */
export async function readImage(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
): Promise<File> {
  return readFile(dirHandle, filename);
}

/** Deleted an image from OPFS */
export async function deleteImage(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
) {
  return deleteFile(dirHandle, filename);
}

/**
 * Compresses and resizes an image via an OffscreenCanvas from an ArrayBuffer,
 * returns a Blob
 */
export async function compressAndResizeImage(
  buffer: ArrayBuffer,
  options?: {
    quality: number,
    maxDimension: number,
  },
): Promise<Blob> {
  const quality = options?.quality ?? IMAGE_QUALITY;
  const maxDimension = options?.maxDimension ?? IMAGE_MAX_DIMENSION;
  const bitmap = await createImageBitmap(new Blob([buffer]));

  let { width, height } = bitmap;

  // Resize the image?
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  try {
    return canvas.convertToBlob({ type: 'image/webp', quality });
  } catch {
    return canvas.convertToBlob({ type: 'image/jpeg', quality });
  }
}

export type PlaceholderImage = {
  blob: Blob;
  getUrl: () => string;
  destroy: () => void;
};

export async function createPlaceholderImage(
  width: number,
  height: number,
): Promise<PlaceholderImage> {
  let url: string | null = null;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#cccccc';
  ctx.fillRect(0, 0, width, height);

  // TODO: Check if it works
  ctx.font = '64px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${width} x ${height}`, width / 2, height / 2);

  const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });

  function getUrl() {
    if (!url) {
      url = URL.createObjectURL(blob);
    }

    return url;
  }

  function destroy() {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  return { blob, getUrl, destroy };
}
