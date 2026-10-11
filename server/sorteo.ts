import { db } from "./db";
import { pickSmallest } from "../shared/balance";
import type { Participant, Sorteo, Topic } from "../shared/types";

export interface State {
  sorteo: Sorteo | null;
  topics: Topic[];
  participants: Participant[];
}

export async function readState(): Promise<State> {
  const d = db();
  const [sorteoRow, topicRows, participantRows] = await Promise.all([
    d.execute("SELECT id, created_at FROM sorteo LIMIT 1"),
    d.execute("SELECT id, title, position FROM topics ORDER BY position"),
    d.execute(
      "SELECT p.id, p.name, p.topic_id FROM participants p JOIN sorteo s ON s.id = p.sorteo_id ORDER BY p.id",
    ),
  ]);

  const sorteo = sorteoRow.rows[0]
    ? { id: String(sorteoRow.rows[0].id), createdAt: String(sorteoRow.rows[0].created_at) }
    : null;

  return {
    sorteo,
    topics: topicRows.rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      position: Number(r.position),
    })),
    participants: participantRows.rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      topicId: r.topic_id === null ? null : String(r.topic_id),
    })),
  };
}

async function ensureSorteo(): Promise<void> {
  const d = db();
  const row = await d.execute("SELECT id FROM sorteo LIMIT 1");
  if (row.rows.length === 0) {
    await d.execute("INSERT INTO sorteo (id) VALUES ('current')");
  }
}

async function smallestTopic(): Promise<string | null> {
  const d = db();
  const [topicRows, countRows] = await Promise.all([
    d.execute("SELECT id FROM topics ORDER BY position"),
    d.execute(
      "SELECT topic_id, COUNT(*) AS n FROM participants WHERE topic_id IS NOT NULL GROUP BY topic_id",
    ),
  ]);
  const counts = new Map(countRows.rows.map((r) => [String(r.topic_id), Number(r.n)]));
  return pickSmallest(
    topicRows.rows.map((r) => String(r.id)),
    counts,
  );
}

export async function register(rawName: string): Promise<{ state: State; existing: boolean }> {
  const name = rawName.trim();
  const d = db();

  const existing = await d.execute({
    sql: "SELECT id, topic_id FROM participants WHERE LOWER(name) = LOWER(?) LIMIT 1",
    args: [name],
  });

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    if (row.topic_id === null || row.topic_id === undefined) {
      const target = await smallestTopic();
      if (target) {
        await d.execute({
          sql: "UPDATE participants SET topic_id = ? WHERE id = ?",
          args: [target, row.id],
        });
      }
    }
    return { state: await readState(), existing: true };
  }

  await ensureSorteo();
  const target = await smallestTopic();
  await d.execute({
    sql: "INSERT INTO participants (sorteo_id, name, topic_id) VALUES ('current', ?, ?)",
    args: [name, target],
  });
  return { state: await readState(), existing: false };
}

export async function clearAll(): Promise<State> {
  const d = db();
  await d.execute("DELETE FROM participants");
  await d.execute("DELETE FROM sorteo");
  return readState();
}
