/**
 * React context that boots the Worker and exposes the BackendClient.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { BackendClient } from '@recipe-app/backend';

// Vite understands `?worker` imports and bundles the worker properly
// import BackendWorker from '../../backend/src/worker.ts?worker';

const Ctx = createContext<BackendClient | null>(null);

export function useBackend(): BackendClient {
  const client = useContext(Ctx);
  if (!client) throw new Error("useBackend() used outside BackendProvider");
  return client;
}

export function BackendProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<BackendClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vite handles `new Worker(new URL(...), { type: "module" })` natively —
    // it bundles the worker entry point and its dependencies automatically.
    const worker = new Worker(
      // new URL("../../backend/src/worker.ts", import.meta.url),
      new URL('./worker.ts', import.meta.url),
      { type: "module" }
    );

    const c = new BackendClient(worker);

    c.waitReady()
      .then(() => setClient(c))
      .catch((err) => setError(err.message));

    return () => worker.terminate();
  }, []);

  if (error) {
    return (
      <div style={{ padding: 32, color: "crimson" }}>
        <h2>Backend failed to start</h2>
        <pre>{error}</pre>
        <p>
          Make sure your browser supports OPFS + SharedArrayBuffer, and that
          COOP/COEP headers are set (Vite dev server does this automatically).
        </p>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ padding: 32 }}>
        <p>Initialising local database…</p>
      </div>
    );
  }

  return <Ctx.Provider value={client}>{children}</Ctx.Provider>;
}