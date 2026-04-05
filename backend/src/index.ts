/**
 * Public API of the backend package.
 *
 * The frontend imports `BackendClient` from here.
 * The worker entry point (worker.ts) is loaded separately via
 * `new Worker(...)` – Vite handles that with `?worker` imports.
 */

export { BackendClient } from "./client.js";
export type {
  Recipe,
  CreateRecipeBody,
  WorkerRequest,
  WorkerResponse,
} from "./types.js";