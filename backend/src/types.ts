// ---- REST-like transport protocol ----

export type HttpMethod = 'GET' | 'POST' | 'DELETE';

export interface WorkerRequest {
  id: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  /** For binary uploads, transferred alongside the message */
  binary?: ArrayBuffer;
}

export interface WorkerResponse {
  id: string;
  status: number;
  body?: unknown;
  /** For binary downloads (images) */
  binary?: ArrayBuffer;
}

// ---- Domain types ----

export interface Recipe {
  id: number;
  title: string;
  description: string;
  image_filename: string | null;
  created_at: string;
}

export interface CreateRecipeBody {
  title: string;
  description: string;
  /** original file name, used to derive extension */
  fileName?: string;
}