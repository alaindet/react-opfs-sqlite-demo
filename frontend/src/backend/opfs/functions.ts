import { trimLeft } from '../utils';

/**
 * Gets a directory handle from a directory name, a slash-separated path or
 * an array of path segments. Creates directories if needed
 */
export async function getDir(
  path?: string | string[],
): Promise<FileSystemDirectoryHandle> {
  let dir = await navigator.storage.getDirectory();

  // Root (no path)
  if (path === undefined || path === '/' || path === '') {
    return dir;
  }

  // Simple path with slashes
  if (typeof path === 'string' && path.indexOf('/') === -1) {
    return dir.getDirectoryHandle(path, { create: true });
  }

  const segments: string[] = [];

  // A simple array with path segments, ex.: ['foo', 'bar', 'baz']
  if (Array.isArray(path)) {
    segments.push(...path);
  }
  
  // A slash-separated path string, ex.: foo/bar/baz
  else {
    const relativePath = trimLeft(path, '/');
    segments.push(...relativePath.split('/'));
  }

  // Visit or create nested directories
  for (const segment of segments) {
    dir = await dir.getDirectoryHandle(segment, { create: true });
  }

  return dir;
}

export async function getRelativeDir(
  dirHandle: FileSystemDirectoryHandle,
  path: string | string[],
): Promise<FileSystemDirectoryHandle> {

  // Simple path
  if (typeof path === 'string' && path.indexOf('/') === -1) {
    return dirHandle.getDirectoryHandle(path, { create: true });
  }

  let temp = dirHandle;

  // Path segments
  const segments = (typeof path === 'string' && path.indexOf('/') !== -1)
    ? path.split('/')
    : (path as string[]);

  for (const segment of segments) {
    temp = await temp.getDirectoryHandle(segment, { create: true });
  }

  return temp;
}

/** Enforces data persistance of the OPFS */
export async function enforceDataPersistance(): Promise<{
  didEnablePersistance: boolean;
}> {
  const isPersistent = await navigator.storage.persisted();
  let didEnablePersistance = false;

  if (!isPersistent) {
    didEnablePersistance = await navigator.storage.persist();
  }

  return { didEnablePersistance };
}

/** Writes a File into the OPFS */
export async function writeFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  file: File,
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
}

/** Writes an ArrayBuffer or Blob into the OPFS */
export async function writeDataToFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  data: ArrayBuffer | Blob,
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

/** Reads a File from the OPFS */
export async function readFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
): Promise<File> {
  const fileHandle = await dirHandle.getFileHandle(filename);
  const file = await fileHandle.getFile();
  return file;
}

/** Deletes a file from the OPFS */
export async function deleteFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
): Promise<void> {
  await dirHandle.removeEntry(filename);
}

/** Deletes a directory from the OPFS */
export async function deleteDir(
  parentDirHandle: FileSystemDirectoryHandle,
  dirname: string,
): Promise<void> {
  await parentDirHandle.removeEntry(dirname, { recursive: true });
}

/** Remove all file and directories from a directory in the OPFS */
export async function emptyDir(
  dirHandle: FileSystemDirectoryHandle,
): Promise<void> {
  for await (const entryKey of dirHandle.keys()) {
    await dirHandle.removeEntry(entryKey, { recursive: true });
  }
}

/** Checks if a filename exists in the OPFS */
export async function fileExists(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
): Promise<boolean> {
  try {
    await dirHandle.getFileHandle(filename, { create: false });
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotFoundError') {
      return false;
    }

    throw err;
  }
}
/**
 * The "file extension" is strictly the last segment post-dot
 * Known constraint: this ignores extensions like .tar.gz
 */
export function stripFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return filename.slice(0, lastDotIndex);
}
