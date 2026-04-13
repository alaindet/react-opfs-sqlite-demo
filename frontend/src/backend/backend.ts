import { CreateRecipeDto, Recipe } from '../types';
import { ExportProgress } from './backup/types';
import { BACKEND_ACTION } from './constants';
import { enforceDataPersistance } from './opfs/functions';
import { WorkerClient, WorkerResponse, WorkerSuccessResponse } from './worker-message-broker';

const workerUrl = new URL('./worker.ts', import.meta.url);
const worker = new Worker(workerUrl, { type: 'module' });
const w = new WorkerClient(worker);

enforceDataPersistance();

export const backend = {
  recipes: {
    getAll(): Promise<WorkerResponse<Recipe[]>> {
      return w.request(BACKEND_ACTION.RECIPES.GET_ALL);
    },
    create(dto: CreateRecipeDto): Promise<WorkerResponse<Recipe>> {
      return w.request(BACKEND_ACTION.RECIPES.CREATE, dto);
    },
    delete(recipe: Recipe): Promise<WorkerResponse<Recipe>> {
      return w.request(BACKEND_ACTION.RECIPES.DELETE, recipe);
    },
  },
  backup: {
    export(): Promise<WorkerResponse<ArrayBuffer>> {
      return w.request(BACKEND_ACTION.BACKUP.EXPORT);
    },
    exportStream(
      onProgress?: (res: WorkerSuccessResponse<ExportProgress>) => void,
    ): Promise<WorkerSuccessResponse<ReadableStream>>  {
      return w.request(BACKEND_ACTION.BACKUP.EXPORT_STREAM, null, { onProgress });
    },
    import(restoreFile: File) {
      return w.request(BACKEND_ACTION.BACKUP.IMPORT, restoreFile);
    },
    wipe() {
      return w.request(BACKEND_ACTION.BACKUP.WIPE);
    }
  },
};
