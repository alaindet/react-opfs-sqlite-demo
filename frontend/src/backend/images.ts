const IMAGES_DIR = 'images';
const MAX_SIZE = 1200; // px - longest edge
const QUALITY = 0.8;

/**
 * Gets a directory handle from a directory name, a slash-separated path or
 * an array of path segments
 */
async function getDir(
  path: string | string[],
): Promise<FileSystemDirectoryHandle> {
  let dir = await navigator.storage.getDirectory();

  if (typeof path === 'string' && path.indexOf('/') === -1) {
    return dir.getDirectoryHandle(path, { create: true });
  }

  const segments = (typeof path === 'string' && path.indexOf('/') !== -1)
    ? path.split('/')
    : path;

  for (const segment of segments) {
    dir = await dir.getDirectoryHandle(segment, { create: true });
  }

  return dir;
}

/**
 * Writes a file synchronously, only works in a Worker 
 */
async function writeFile(
  dir: FileSystemDirectoryHandle,
  filename: string,
  data: Uint8Array,
): Promise<void> {
  const file = await dir.getFileHandle(filename, { create: true });
  const fileAccess = await file.createSyncAccessHandle();

  try {
    fileAccess.write(data, { at: 0 });
    fileAccess.truncate(data.byteLength);
    fileAccess.flush();
  } finally {
    fileAccess.close();
  }
}

/**
 * Compresses and resizes an image via an OffscreenCanvas from an ArrayBuffer,
 * returns a Blob
 */
async function compressAndResizeImage(
  buffer: ArrayBuffer,
  options: {
    maxDimension: number,
    quality: number,  
  },
): Promise<Blob> {
  const { maxDimension, quality } = options;
  const bitmap = await createImageBitmap(new Blob([buffer]));

  let { width, height } = bitmap;
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