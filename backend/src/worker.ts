/**
 * The Web Worker entry point.
 * Initialises the DB then listens for REST-like requests.
 */

import { initDb } from "./db.js";
import { seed } from "./seed.js";
import { dispatch } from "./router.js";
import type { WorkerRequest, WorkerResponse } from "./types.js";

let ready = false;
const pending: MessageEvent[] = [];

async function boot() {
  // Request persistent storage so the browser won't evict OPFS data
  if (navigator.storage?.persist) {
    const persisted = await navigator.storage.persist();
    console.log(`[worker] Storage persistence: ${persisted ? "granted" : "denied"}`);
  }

  await initDb();
  await seed();
  ready = true;
  console.log("[worker] Backend ready");

  // Process any messages that arrived while booting
  for (const ev of pending) {
    handleMessage(ev);
  }
  pending.length = 0;

  // Let the main thread know we're ready
  self.postMessage({ type: "ready" });
}

async function handleMessage(ev: MessageEvent) {
  const req = ev.data as WorkerRequest;
  if (!req.id || !req.method || !req.path) return;

  const res = await dispatch(req);

  // Use transferable for binary responses (zero-copy)
  if (res.binary) {
    self.postMessage(res, [res.binary]);
  } else {
    self.postMessage(res);
  }
}

self.addEventListener("message", (ev: MessageEvent) => {
  if (!ready) {
    pending.push(ev);
    return;
  }
  handleMessage(ev);
});

boot().catch((err) => {
  console.error("[worker] Boot failed:", err);
  self.postMessage({ type: "error", error: err.message });
});