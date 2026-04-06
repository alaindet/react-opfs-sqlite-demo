import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

type BackendContext = {
  worker: Worker;
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

  const [worker, setWorker] = useState<Worker | null>(null);

  const ctxValue = useMemo<BackendContext | null>(() => {
    if (!worker) {
      return null;
    }
    return { worker };
  }, [worker]);
  
  useEffect(() => {
    setWorker(new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' },
    ));

    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, []);

  if (!worker) {
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