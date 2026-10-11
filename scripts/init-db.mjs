import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(join(root, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {
    throw new Error(".env no encontrado");
  }
  return env;
}

const SEED = JSON.parse(readFileSync(join(root, "shared", "topics.json"), "utf8"));

const env = loadEnv();
const url = env.TURSO_DATABASE_URL;
const authToken = env.TURSO_AUTH_TOKEN;
if (!url || !authToken) throw new Error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN faltan en .env");

const db = createClient({ url, authToken });

await db.execute(
  "CREATE TABLE IF NOT EXISTS sorteo (id TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
);
await db.execute(
  "CREATE TABLE IF NOT EXISTS topics (id TEXT PRIMARY KEY, title TEXT NOT NULL, position INTEGER NOT NULL)",
);
await db.execute(
  "CREATE TABLE IF NOT EXISTS participants (id INTEGER PRIMARY KEY AUTOINCREMENT, sorteo_id TEXT NOT NULL, name TEXT NOT NULL, topic_id TEXT)",
);
await db.execute(
  "CREATE INDEX IF NOT EXISTS idx_participants_sorteo ON participants(sorteo_id)",
);

const existing = await db.execute("SELECT COUNT(*) AS n FROM topics");
const count = Number(existing.rows[0].n);
if (count === 0) {
  for (let i = 0; i < SEED.length; i++) {
    await db.execute({
      sql: "INSERT INTO topics (id, title, position) VALUES (?, ?, ?)",
      args: [crypto.randomUUID(), SEED[i], i],
    });
  }
  console.log(`DB lista. ${SEED.length} motivos sembrados.`);
} else {
  console.log(`DB lista. ${count} motivos existentes, sin cambios.`);
}

const check = await db.execute("SELECT id, title, position FROM topics ORDER BY position");
for (const row of check.rows) console.log(` ${row.position}. ${row.title}`);
