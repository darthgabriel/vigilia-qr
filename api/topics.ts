import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasPin } from "../server/auth";
import { json, methodNotAllowed, readJson } from "../server/http";
import { db } from "../server/db";
import type { Topic } from "../shared/types";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method === "GET") {
      const rows = await db().execute("SELECT id, title, position FROM topics ORDER BY position");
      const topics: Topic[] = rows.rows.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        position: Number(r.position),
      }));
      json(res, 200, { topics });
      return;
    }

    if (req.method === "POST") {
      if (!hasPin(req)) {
        json(res, 401, { error: "unauthorized" });
        return;
      }
      const body = readJson(req);
      const title = String(body.title ?? "").trim();
      if (!title) {
        json(res, 400, { error: "title_required" });
        return;
      }
      const maxRow = await db().execute("SELECT COALESCE(MAX(position), -1) AS p FROM topics");
      const next = Number(maxRow.rows[0]?.p ?? -1) + 1;
      const id = crypto.randomUUID();
      await db().execute({
        sql: "INSERT INTO topics (id, title, position) VALUES (?, ?, ?)",
        args: [id, title, next],
      });
      json(res, 200, { id, title, position: next });
      return;
    }

    methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    console.error(err);
    json(res, 500, { error: "server_error" });
  }
}
