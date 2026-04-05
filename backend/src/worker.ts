/**
 * The Web Worker entry point.
 * Initialises the DB then listens for REST-like requests.
 */

import { initDb } from './db';
import { seed } from './seed';
import { dispatch } from './router';
import type { WorkerRequest } from './types';

export class BackendWorker {

  #worker: DedicatedWorkerGlobalScope;
  #ready = false;
  #pendingEvents: MessageEvent[] = [];

  constructor(worker: DedicatedWorkerGlobalScope) {
    this.#worker = worker;
    this.init();
  }

  async init() {
    try {

      this.#worker.addEventListener('message', (event: MessageEvent) => {
        if (!this.#ready) {
          this.#pendingEvents.push(event);
          return;
        }
        this.#handleMessage(event);
      });

      this.#boot();

    } catch (err) {
      console.error('[worker] Boot failed:', err);

      const message = (err instanceof Error)
        ? err.message
        : JSON.stringify(err);

      this.#worker.postMessage({ type: 'error', error: message });
    }
  }

  async #boot() {

    // Request persistent storage so the browser won't evict OPFS data
    if (navigator.storage?.persist) {
      const persisted = await navigator.storage.persist();
      console.log(`[worker] Storage persistence: ${persisted ? 'granted' : 'denied'}`);
    }

    await initDb();
    await seed();
    this.#ready = true;
    console.log("[worker] Backend ready");

    // Process any messages that arrived while booting
    for (const event of this.#pendingEvents) {
      this.#handleMessage(event);
    }

    // Clear all pending events
    this.#pendingEvents.length = 0;

    // Let the main thread know we're ready
    this.#worker.postMessage({ type: 'ready' });
  }

  async #handleMessage(event: MessageEvent) {
    const req = event.data as WorkerRequest;

    if (!req.id || !req.method || !req.path) {
      return;
    }

    const res = await dispatch(req);

    // Use transferable for binary responses (zero-copy)
    if (res.binary) {
      this.#worker.postMessage(res, [res.binary]);
    } else {
      this.#worker.postMessage(res);
    }
  }
}