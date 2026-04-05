/**
 * Database layer – initialises SQLite WASM with OPFS persistence
 * and exposes a tiny query helper.
 *
 * IMPORTANT: this file MUST run inside a dedicated Web Worker so that
 * OpfsDb (which needs synchronous OPFS access handles) is available.
 */

import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

let db: any; // sqlite3.oo1.OpfsDb | sqlite3.oo1.DB

export async function initDb() {
  if (db) return db;

  const sqlite3 = await sqlite3InitModule({
    print: console.log,
    printErr: console.error,
  });

  if ("opfs" in sqlite3) {
    db = new sqlite3.oo1.OpfsDb("/recipes.sqlite3");
    console.log("[db] OPFS available – persistent DB at", db.filename);
  } else {
    db = new sqlite3.oo1.DB("/recipes.sqlite3", "ct");
    console.warn("[db] OPFS unavailable – transient in-memory DB");
  }

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT    NOT NULL,
      description   TEXT    NOT NULL DEFAULT '',
      image_filename TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

export function getDb() {
  if (!db) throw new Error("DB not initialised – call initDb() first");
  return db;
}