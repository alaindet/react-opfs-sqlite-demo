import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { WorkerClient } from './worker-message-broker';
import { CreateRecipeDto, Recipe } from '../types';
import { BACKEND_ACTION } from './actions';
import { WorkerResponse } from './worker-message-broker';

type BackendContext = {
  getRecipes(): Promise<WorkerResponse>;
  createRecipe(dto: CreateRecipeDto): Promise<WorkerResponse>;
  deleteRecipe(recipe: Recipe): Promise<WorkerResponse>;
};

const ctx = createContext<BackendContext | null>(null);

export function useBackend(): BackendContext {
  const backend = useContext(ctx);

  if (!backend) {
    throw new Error('useBackend() used outside BackendProvider');
  }

  return backend;
}

export function BackendProvider({ children }: PropsWithChildren) {

  const [workerClient, setWorkerClient] = useState<WorkerClient | null>(null);

  const getRecipes = useCallback(() => {
    return workerClient!.request(BACKEND_ACTION.RECIPES_GET_ALL);
  }, [workerClient]);

  const createRecipe = useCallback((dto: CreateRecipeDto) => {
    return workerClient!.request(BACKEND_ACTION.RECIPES_CREATE, dto);
  }, [workerClient]);

  const deleteRecipe = useCallback((recipe: Recipe) => {
    return workerClient!.request(BACKEND_ACTION.RECIPES_DELETE, recipe);
  }, [workerClient]);

  const ctxValue = useMemo<BackendContext | null>(() => ({
    getRecipes,
    createRecipe,
    deleteRecipe,
  }), [
    workerClient,
    getRecipes,
    createRecipe,
    deleteRecipe,
  ]);
  
  useEffect(() => {
    const worker = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' },
    );
    setWorkerClient(new WorkerClient(worker));
    return () => worker.terminate();
  }, []);

  if (!workerClient) {
    return (
      <p>Initializing worker...</p>
    );
  }

  return (
    <ctx.Provider value={ctxValue!}>
      {children}
    </ctx.Provider>
  );
}