/**
 * Minimal REST-like router that maps (method, path) → handler.
 * Runs inside the Worker, dispatches WorkerRequest → WorkerResponse.
 */

import type {
  WorkerRequest,
  WorkerResponse,
  Recipe,
  CreateRecipeBody,
} from "./types.js";
import { getDb } from "./db.js";
import { saveImage, readImage, deleteImage } from "./images.js";
import { exportDatabase, importDatabase, cleanupAll } from "./backup.js";

type Handler = (
  req: WorkerRequest
) => Promise<{ status: number; body?: unknown; binary?: ArrayBuffer }>;

interface Route {
  method: string;
  /** Regex to match the path; named groups become params */
  pattern: RegExp;
  handler: Handler;
}

const routes: Route[] = [];

function route(method: string, path: string, handler: Handler) {
  // Convert "/recipes/:id" → /^\/recipes\/(?<id>[^/]+)$/
  const pattern = new RegExp(
    "^" + path.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$"
  );
  routes.push({ method, pattern, handler });
}

// ---- Routes ----

// GET /recipes – list all
route("GET", "/recipes", async () => {
  const db = getDb();
  const rows: Recipe[] = [];
  db.exec({
    sql: "SELECT id, title, description, image_filename, created_at FROM recipes ORDER BY id DESC",
    callback: (row: any) => {
      if (!row.row) return;
      rows.push({
        id: row.row[0],
        title: row.row[1],
        description: row.row[2],
        image_filename: row.row[3],
        created_at: row.row[4],
      });
    },
  });
  return { status: 200, body: rows };
});

// POST /recipes – create (with optional binary image)
route("POST", "/recipes", async (req) => {
  const { title, description, fileName } = req.body as CreateRecipeBody;
  if (!title) return { status: 400, body: { error: "title is required" } };

  let imageFilename: string | null = null;
  if (req.binary) {
    imageFilename = await saveImage(req.binary, fileName);
  }

  const db = getDb();
  db.exec({
    sql: "INSERT INTO recipes (title, description, image_filename) VALUES (?, ?, ?)",
    bind: [title, description || "", imageFilename],
  });

  const id = db.exec({
    sql: "SELECT last_insert_rowid()",
    returnValue: "resultRows",
  })[0][0];

  return {
    status: 201,
    body: { id, title, description, image_filename: imageFilename },
  };
});

// GET /images/:filename – serve an image as binary
route("GET", "/images/:filename", async (req) => {
  const match = req.path.match(/\/images\/(?<filename>.+)/);
  const filename = match?.groups?.filename;
  if (!filename) return { status: 400, body: { error: "missing filename" } };

  try {
    const { buffer, mime } = await readImage(filename);
    return { status: 200, body: { mime }, binary: buffer };
  } catch {
    return { status: 404, body: { error: "image not found" } };
  }
});

// DELETE /recipes/:id
route("DELETE", "/recipes/:id", async (req) => {
  const match = req.path.match(/\/recipes\/(?<id>\d+)/);
  const id = Number(match?.groups?.id);
  if (!id) return { status: 400, body: { error: "invalid id" } };

  const db = getDb();

  // Grab image filename before deleting
  const rows = db.exec({
    sql: "SELECT image_filename FROM recipes WHERE id = ?",
    bind: [id],
    returnValue: "resultRows",
  });

  if (rows.length && rows[0][0]) {
    try {
      await deleteImage(rows[0][0]);
    } catch {
      // image may already be gone
    }
  }

  db.exec({ sql: "DELETE FROM recipes WHERE id = ?", bind: [id] });
  return { status: 200, body: { deleted: id } };
});

// GET /backup/export – download entire DB + images as zip
route("GET", "/backup/export", async () => {
  try {
    const zipBuffer = await exportDatabase();
    return { status: 200, body: { size: zipBuffer.byteLength }, binary: zipBuffer };
  } catch (err: any) {
    return { status: 500, body: { error: err.message } };
  }
});

// POST /backup/import – upload a zip to replace the entire DB + images
route("POST", "/backup/import", async (req) => {
  if (!req.binary) {
    return { status: 400, body: { error: "No zip file provided" } };
  }
  try {
    await importDatabase(req.binary);
    return { status: 200, body: { success: true, reload: true } };
  } catch (err: any) {
    return { status: 500, body: { error: err.message } };
  }
});

// POST /backup/cleanup – delete all recipes and images
route("POST", "/backup/cleanup", async () => {
  try {
    await cleanupAll();
    return { status: 200, body: { success: true } };
  } catch (err: any) {
    return { status: 500, body: { error: err.message } };
  }
});

// ---- Dispatcher ----

export async function dispatch(req: WorkerRequest): Promise<WorkerResponse> {
  for (const r of routes) {
    if (r.method === req.method && r.pattern.test(req.path)) {
      try {
        const result = await r.handler(req);
        return {
          id: req.id,
          status: result.status,
          body: result.body,
          binary: result.binary,
        };
      } catch (err: any) {
        console.error("[router] handler error:", err);
        return {
          id: req.id,
          status: 500,
          body: { error: err.message || "Internal error" },
        };
      }
    }
  }
  return { id: req.id, status: 404, body: { error: "Not found" } };
}