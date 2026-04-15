import { Zip, ZipPassThrough } from 'fflate';
import { DatabaseService } from '../../database';
import { Logger } from '../../logger';
import { OpfsDirectoryController } from '../../opfs';
import { WorkerErrorResponse, WorkerRequest, WorkerResponder, WorkerSuccessResponse } from '../../worker-message-broker';
import { BACKUP_ACTION } from './__names';
import { DATABASE_FILENAME, IMAGES_DIR } from '../../constants';

export const exportAction = (
  worker: DedicatedWorkerGlobalScope,
  _logger: Logger,
  dbService: DatabaseService,
  dirController: OpfsDirectoryController,
) => ({
  action: BACKUP_ACTION.EXPORT,
  async handle(
    req: WorkerRequest,
    res: WorkerResponder,
  ): Promise<WorkerSuccessResponse | WorkerErrorResponse> {
    const logger = _logger.createScopedLogger('export');

    try {
      const generator = generateZipChunks();
      
      const exportStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
        async pull(controller) {
          const { value, done } = await generator.next();
          if (done) {
            controller.close();
          } else {
            controller.enqueue(value);
          }
        },
        cancel() {
          generator.return(undefined);
        },
      });

      const message = 'Exporting all data in .zip';
      return res.success(message, exportStream, { stream: true });
    } catch (err: any) {
      const message = err?.message ?? 'Cannot export all data';
      logger.error(message, { err });
      return res.error(message, req.data);
    }

    async function* generateZipChunks(
      prefetch = 4, // number of files to read ahead
    ): AsyncGenerator<Uint8Array<ArrayBuffer>> {

      let resolve: DataChunkProcessFn | null = null;
      let error: Error | null = null;
      const pending: DataChunk[] = [];
  
      const zip = new Zip();
  
      zip.ondata = (err, chunk, final) => {
        if (err) {
          error = err;
          resolve?.({ data: new Uint8Array(), final: true });
          return;
        }
  
        const item = {
          data: chunk.slice(),
          final,
        };

        if (resolve) {
          const fn = resolve as DataChunkProcessFn;
          resolve = null;
          fn(item);
        } else {
          pending.push(item);
        }
      };
  
      const feedDone = feedZipBuffered(zip, prefetch).catch((err: any) => {
        error = err instanceof Error ? err : new Error(String(err));
      });
  
      while (true) {
        const item = pending.shift() ?? await new Promise<DataChunk>(done => resolve = done);
  
        if (error) {
          logger.error('Could not catch up with pending read files', { error });
          throw error;
        }

        yield item.data as Uint8Array<ArrayBuffer>;

        if (item.final) {
          break;
        }
      }
  
      await feedDone;
    }

    async function feedZipBuffered(zip: Zip, prefetch: number): Promise<void> {

      // Database first (no prefetch needed, just one file)
      const dbBuffer = await readDb();
      const dbEntry = new ZipPassThrough(DATABASE_FILENAME);
      logger.trace('Adding the database to the .zip');
      zip.add(dbEntry);
      dbEntry.push(new Uint8Array(dbBuffer), true);

      let imagesDir: FileSystemDirectoryHandle | null = null;

      try {
        logger.trace('Trying to get the handle of the /images directory');
        imagesDir = await dirController.dirHandle.getDirectoryHandle(IMAGES_DIR);  
      } catch {}

      if (!imagesDir) {
        throw new Error('Cannot find /images directory');
      }
  
      // Bounded prefetch buffer — acts like a Go channel with capacity N
      const buffer: { name: string; data: Uint8Array }[] = [];
      let readerDone = false;
      let slotAvailable: (() => void) | null = null;
      let dataAvailable: (() => void) | null = null;
  
      // Producer: reads files from OPFS into the buffer up to `prefetch`
      const readAhead = async () => {
        for await (const [name, _handle] of imagesDir.entries()) {

          logger.trace('Exporting image file', { filename: name });

          // Skip directories
          if (_handle.kind !== 'file') {
            continue;
          }
  
          // If buffer is full, wait for the consumer to drain a slot
          while (buffer.length >= prefetch) {
            await new Promise<void>(fn => slotAvailable = fn);
          }
  
          const handle = _handle as FileSystemFileHandle;
          const file = await handle.getFile();
          const data = new Uint8Array(await file.arrayBuffer());
          buffer.push({ name, data });
  
          // Signal the consumer that data is available
          if (dataAvailable) {
            const fn = dataAvailable;
            dataAvailable = null;
            fn();
          }
        }
  
        readerDone = true;
        if (dataAvailable) {
          const fn = dataAvailable as Function;
          dataAvailable = null;
          fn();
        }
      };
  
      // Start the producer in the background
      const readerPromise = readAhead();
  
      // Consumer: takes pre-read files and pushes them into the zip
      while (true) {

        // Wait for the producer to provide something
        while (buffer.length === 0 && !readerDone) {
          await new Promise<void>(done => dataAvailable = done);
        }
  
        const item = buffer.shift();
        if (!item) {
          break;
        }
  
        // Open a slot for the producer
        if (slotAvailable) {
          const fn = slotAvailable as Function;
          slotAvailable = null;
          fn();
        }
  
        const entry = new ZipPassThrough(`${IMAGES_DIR}/${item.name}`);
        zip.add(entry);
        entry.push(item.data, true);
      }
  
      await readerPromise;
      zip.end();
    }

    async function readDb(): Promise<ArrayBuffer> {
      const tempFilename = '.temp.db';
      await dirController.safeDeleteFile(tempFilename);
      dbService.db.exec({ sql: `VACUUM INTO 'file:${tempFilename}?vfs=opfs'` });
      logger.trace('Stored database into a temporary file', { tempFilename });

      const tempFile = await dirController.readFile(tempFilename);
      const tempBuffer = await tempFile.arrayBuffer();
      logger.trace('Exported database loaded into memory');

      await dirController.safeDeleteFile(tempFilename);
      logger.trace('Removed database temporary file');

      return tempBuffer;
    }
  },
});

type DataChunk = {
  data: Uint8Array;
  final: boolean;
};

type DataChunkProcessFn = (chunk: DataChunk) => void;