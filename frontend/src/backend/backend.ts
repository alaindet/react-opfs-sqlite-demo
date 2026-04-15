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
    exportFflate(
      onProgress?: (res: WorkerSuccessResponse<ExportProgress>) => void,
    ): Promise<WorkerSuccessResponse<ReadableStream>>  {
      return w.request(BACKEND_ACTION.BACKUP.EXPORT_FFLATE, null, { onProgress });
    },
    importFflate(
      restoreFile: ReadableStream<Uint8Array>,
      onProgress?: (res: WorkerSuccessResponse<ExportProgress>) => void,
    ): Promise<WorkerSuccessResponse<any>> {
      return w.request(BACKEND_ACTION.BACKUP.IMPORT_FFLATE, restoreFile, { onProgress });
    },
    wipe() {
      return w.request(BACKEND_ACTION.BACKUP.WIPE);
    }
  },
};
