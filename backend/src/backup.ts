/**
 * Export / Import the entire database + images as a zip.
 *
 * Zip structure:
 *   recipes.sqlite3   – the SQLite database file
 *   images/           – all image files from OPFS
 *     <uuid>.webp
 *     ...
 *
 * Uses JSZip (bundled with the Worker via Vite).
 */

import JSZip from "jszip";
import { getDb } from "./db.js";
import { saveImageRaw, deleteAllImages } from "./images.js";

const DB_FILENAME = "recipes.sqlite3";
const IMAGE_DIR = "recipe-images";

// ---- Helpers to read OPFS ----

async function getOpfsRoot() {
  return navigator.storage.getDirectory();
}

async function readDbFile(): Promise<ArrayBuffer> {
  const root = await getOpfsRoot();
  const db = getDb();
  const exportName = ".recipes-export.sqlite3";

  // Clean up any leftover export file
  try {
    await root.removeEntry(exportName);
  } catch {
    // didn't exist
  }

  // VACUUM INTO creates a clean, standalone copy
  db.exec({ sql: `VACUUM INTO 'file:${exportName}?vfs=opfs'` });

  const fileHandle = await root.getFileHandle(exportName);
  const file = await fileHandle.getFile();
  const buffer = await file.arrayBuffer();

  // Clean up the export file
  try {
    await root.removeEntry(exportName);
  } catch {
    // best effort
  }

  return buffer;
}

async function readAllImages(): Promise<{ name: string; data: ArrayBuffer }[]> {
  const root = await getOpfsRoot();
  let imagesDir: FileSystemDirectoryHandle;
  try {
    imagesDir = await root.getDirectoryHandle(IMAGE_DIR);
  } catch {
    return []; // no images dir yet
  }

  const files: { name: string; data: ArrayBuffer }[] = [];
  for await (const [name, handle] of (imagesDir as any).entries()) {
    if (handle.kind === "file") {
      const file = await (handle as FileSystemFileHandle).getFile();
      files.push({ name, data: await file.arrayBuffer() });
    }
  }
  return files;
}

// ---- Export ----

export async function exportDatabase(): Promise<ArrayBuffer> {
  const zip = new JSZip();

  // 1. Add SQLite database
  const dbBuffer = await readDbFile();
  zip.file(DB_FILENAME, dbBuffer);

  // 2. Add all images
  const images = await readAllImages();
  const imgFolder = zip.folder("images")!;
  for (const img of images) {
    imgFolder.file(img.name, img.data);
  }

  console.log(
    `[backup] Exporting: DB (${(dbBuffer.byteLength / 1024).toFixed(1)} KB) + ${images.length} image(s)`
  );

  // Generate zip as ArrayBuffer
  return zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

// ---- Import ----

export async function importDatabase(zipBuffer: ArrayBuffer): Promise<void> {
  const zip = await JSZip.loadAsync(zipBuffer);

  // 1. Verify the zip contains a database file
  const dbFile = zip.file(DB_FILENAME);
  if (!dbFile) {
    throw new Error(
      `Invalid backup: missing ${DB_FILENAME} in zip. Found: ${Object.keys(zip.files).join(", ")}`
    );
  }

  // 2. Close current database
  const db = getDb();
  db.close();

  // 3. Import the database file into OPFS via OpfsDb.importDb
  const dbData = await dbFile.async("arraybuffer");

  // We need the sqlite3 module reference to call OpfsDb.importDb.
  const sqlite3InitModule = (await import("@sqlite.org/sqlite-wasm")).default;
  const sqlite3 = await sqlite3InitModule({
    print: console.log,
    printErr: console.error,
  });

  if (!("opfs" in sqlite3)) {
    throw new Error("OPFS not available – cannot import database");
  }

  // importDb overwrites the file in OPFS
  await sqlite3.oo1.OpfsDb.importDb("/recipes.sqlite3", new Uint8Array(dbData));

  // 4. Clear existing images
  await deleteAllImages();

  // 5. Write images from zip into OPFS using createSyncAccessHandle
  const imgFolder = zip.folder("images");
  if (imgFolder) {
    const imgFiles: { name: string; promise: Promise<ArrayBuffer> }[] = [];
    imgFolder.forEach((relativePath, file) => {
      if (!file.dir) {
        imgFiles.push({ name: relativePath, promise: file.async("arraybuffer") });
      }
    });

    for (const { name, promise } of imgFiles) {
      const data = await promise;
      await saveImageRaw(name, data);
    }

    console.log(`[backup] Imported ${imgFiles.length} image(s)`);
  }

  console.log("[backup] Import complete – database will reload");
}

// ---- Cleanup (delete everything) ----

export async function cleanupAll(): Promise<void> {
  // 1. Drop all rows
  const db = getDb();
  db.exec({ sql: "DELETE FROM recipes" });

  // 2. Delete all images from OPFS
  await deleteAllImages();

  console.log("[backup] All data cleaned up");
}