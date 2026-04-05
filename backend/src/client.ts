/**
 * REST-like client that talks to the Worker via postMessage.
 *
 * This is the "communication library" the frontend imports.
 * It hides the Worker plumbing and exposes a fetch-like API.
 *
 * Later, to go isomorphic, swap this implementation with one
 * that uses real `fetch()` against a remote server – the
 * interface stays identical.
 */

import type { HttpMethod, WorkerRequest, WorkerResponse } from "./types.js";

export type { Recipe, CreateRecipeBody } from "./types.js";

export class BackendClient {
  private worker: Worker;
  private pending = new Map<
    string,
    {
      resolve: (res: WorkerResponse) => void;
      reject: (err: Error) => void;
    }
  >();
  private readyPromise: Promise<void>;

  constructor(worker: Worker) {
    this.worker = worker;

    this.readyPromise = new Promise((resolve) => {
      const onReady = (ev: MessageEvent) => {
        if (ev.data?.type === "ready") {
          this.worker.removeEventListener("message", onReady);
          resolve();
        }
      };
      this.worker.addEventListener("message", onReady);
    });

    this.worker.addEventListener("message", (ev: MessageEvent) => {
      const res = ev.data as WorkerResponse;
      if (!res.id) return;
      const p = this.pending.get(res.id);
      if (p) {
        this.pending.delete(res.id);
        p.resolve(res);
      }
    });
  }

  /** Wait until the Worker signals it's ready */
  async waitReady(): Promise<void> {
    return this.readyPromise;
  }

  /** Send a REST-like request to the Worker */
  async request(
    method: HttpMethod,
    path: string,
    body?: unknown,
    binary?: ArrayBuffer
  ): Promise<WorkerResponse> {
    const id = crypto.randomUUID();
    const msg: WorkerRequest = { id, method, path, body, binary };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      // Transfer binary for zero-copy
      if (binary) {
        this.worker.postMessage(msg, [binary]);
      } else {
        this.worker.postMessage(msg);
      }

      // Timeout after 30s
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Request ${method} ${path} timed out`));
        }
      }, 30_000);
    });
  }

  // ---- Convenience helpers ----

  async getRecipes() {
    const res = await this.request("GET", "/recipes");
    return res.body as import("./types.js").Recipe[];
  }

  async createRecipe(
    title: string,
    description: string,
    imageBuffer?: ArrayBuffer,
    fileName?: string
  ) {
    const res = await this.request(
      "POST",
      "/recipes",
      { title, description, fileName },
      imageBuffer
    );
    return res;
  }

  async deleteRecipe(id: number) {
    return this.request("DELETE", `/recipes/${id}`);
  }

  /**
   * Fetch an image as an Object URL (ready for <img src>).
   * The caller is responsible for revoking via URL.revokeObjectURL().
   */
  async getImageUrl(filename: string): Promise<string | null> {
    const res = await this.request("GET", `/images/${filename}`);
    if (res.status !== 200 || !res.binary) return null;
    const mime = (res.body as any)?.mime || "image/webp";
    const blob = new Blob([res.binary], { type: mime });
    return URL.createObjectURL(blob);
  }

  /**
   * Export the entire database (SQLite + images) as a zip ArrayBuffer.
   */
  async exportBackup(): Promise<ArrayBuffer> {
    const res = await this.request("GET", "/backup/export");
    if (res.status !== 200 || !res.binary) {
      throw new Error((res.body as any)?.error || "Export failed");
    }
    return res.binary;
  }

  /**
   * Import a zip backup, replacing the current database and images.
   * Returns true if the app should reload.
   */
  async importBackup(zipBuffer: ArrayBuffer): Promise<boolean> {
    const res = await this.request("POST", "/backup/import", undefined, zipBuffer);
    if (res.status !== 200) {
      throw new Error((res.body as any)?.error || "Import failed");
    }
    return (res.body as any)?.reload === true;
  }

  /**
   * Delete all recipes and images. Returns true on success.
   */
  async cleanupAll(): Promise<boolean> {
    const res = await this.request("POST", "/backup/cleanup");
    if (res.status !== 200) {
      throw new Error((res.body as any)?.error || "Cleanup failed");
    }
    return true;
  }
}