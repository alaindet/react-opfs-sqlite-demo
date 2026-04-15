import { CreateRecipeDto, Recipe } from '../types';
import { DataTransferProgress } from './features/backup/data-transfer-progress';
import { BACKEND_ACTION } from './core/constants';
import { enforceDataPersistance } from './core/opfs';
import { WorkerClient, WorkerResponse, WorkerSuccessResponse } from './core/worker-message-broker';

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
    export(
      onProgress?: (res: WorkerSuccessResponse<DataTransferProgress>) => void,
    ): Promise<WorkerSuccessResponse<ReadableStream>>  {
      return w.request(BACKEND_ACTION.BACKUP.EXPORT, null, {
        onProgress,
      });
    },

    import(
      restoreFile: ReadableStream<Uint8Array>,
      onProgress?: (res: WorkerSuccessResponse<DataTransferProgress>) => void,
    ): Promise<WorkerSuccessResponse<any>> {
      return w.request(BACKEND_ACTION.BACKUP.IMPORT, restoreFile, {
        onProgress,
        transfer: true,
      });
    },

    wipe() {
      return w.request(BACKEND_ACTION.BACKUP.WIPE);
    }
  },
};
