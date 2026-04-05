/**
 * Image storage helpers – uses OPFS (outside of SQLite) to persist
 * image files, and OffscreenCanvas for basic compression / resize.
 *
 * All file writes use createSyncAccessHandle() which is the most
 * reliable and performant path inside a dedicated Web Worker.
 * Reads use the async getFile() API (no lock needed for reads).
 */

const IMAGE_DIR = "recipe-images";
const MAX_DIMENSION = 1200; // px – longest edge
const QUALITY = 0.8; // WebP quality

/** Get (or create) the images directory handle */
async function imagesDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(IMAGE_DIR, { create: true });
}

/**
 * Write raw bytes to an OPFS file using createSyncAccessHandle.
 * This is the only write method guaranteed to work in all browsers
 * that support OPFS (including Safari 17+), as long as we're in a
 * dedicated Worker.
 */
async function writeFileSync(
  dir: FileSystemDirectoryHandle,
  name: string,
  data: Uint8Array
): Promise<void> {
  const fileHandle = await dir.getFileHandle(name, { create: true });
  const accessHandle = await (fileHandle as any).createSyncAccessHandle();
  try {
    accessHandle.write(data, { at: 0 });
    accessHandle.truncate(data.byteLength);
    accessHandle.flush();
  } finally {
    accessHandle.close();
  }
}

/**
 * Compress an image buffer using OffscreenCanvas.
 * Returns a WebP blob (falls back to JPEG if WebP unsupported).
 */
async function compressImage(buffer: ArrayBuffer): Promise<Blob> {
  const bitmap = await createImageBitmap(new Blob([buffer]));

  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Try WebP first, fall back to JPEG
  try {
    return await canvas.convertToBlob({ type: "image/webp", quality: QUALITY });
  } catch {
    return await canvas.convertToBlob({ type: "image/jpeg", quality: QUALITY });
  }
}

/**
 * Save an image to OPFS, returns the generated filename.
 */
export async function saveImage(
  buffer: ArrayBuffer,
  _originalName?: string
): Promise<string> {
  const compressed = await compressImage(buffer);
  const ext = compressed.type === "image/webp" ? "webp" : "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;

  const dir = await imagesDir();
  const data = new Uint8Array(await compressed.arrayBuffer());
  await writeFileSync(dir, filename, data);

  return filename;
}

/**
 * Write a raw buffer to OPFS (no compression). Used by backup import.
 */
export async function saveImageRaw(
  filename: string,
  buffer: ArrayBuffer
): Promise<void> {
  const dir = await imagesDir();
  await writeFileSync(dir, filename, new Uint8Array(buffer));
}

/**
 * Read an image from OPFS, returns the raw ArrayBuffer + MIME type.
 */
export async function readImage(
  filename: string
): Promise<{ buffer: ArrayBuffer; mime: string }> {
  const dir = await imagesDir();
  const fileHandle = await dir.getFileHandle(filename);
  const file = await fileHandle.getFile();
  const buffer = await file.arrayBuffer();
  const mime =
    file.type ||
    (filename.endsWith(".webp") ? "image/webp" : "image/jpeg");
  return { buffer, mime };
}

/**
 * Delete an image from OPFS.
 */
export async function deleteImage(filename: string): Promise<void> {
  const dir = await imagesDir();
  await dir.removeEntry(filename);
}

/**
 * Delete ALL images (wipes the images directory and recreates it).
 */
export async function deleteAllImages(): Promise<void> {
  const root = await navigator.storage.getDirectory();
  try {
    await root.removeEntry(IMAGE_DIR, { recursive: true });
  } catch {
    // directory may not exist
  }
  // Recreate the empty directory
  await root.getDirectoryHandle(IMAGE_DIR, { create: true });
}