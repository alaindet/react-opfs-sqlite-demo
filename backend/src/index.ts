/**
 * Public API of the backend package.
 *
 * The frontend imports `BackendClient` from here.
 * The worker entry point (worker.ts) is loaded separately via
 * `new Worker(...)` – Vite handles that with `?worker` imports.
 */

export { BackendWorker } from './worker';
export { BackendClient } from './client';
export type { Recipe, CreateRecipeBody, WorkerRequest, WorkerResponse } from './types';