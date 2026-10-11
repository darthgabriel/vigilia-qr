import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasPin } from "../../server/auth.js";
import { json, methodNotAllowed, readJson } from "../../server/http.js";
import { db } from "../../server/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== "PUT" && req.method !== "DELETE") {
      methodNotAllowed(res, ["PUT", "DELETE"]);
      return;
    }
    if (!hasPin(req)) {
      json(res, 401, { error: "unauthorized" });
      return;
    }

    const id = String(req.query.id ?? "");
    if (!id) {
      json(res, 400, { error: "id_required" });
      return;
    }

    const existing = await db().execute({ sql: "SELECT id FROM topics WHERE id = ?", args: [id] });
    if (existing.rows.length === 0) {
      json(res, 404, { error: "not_found" });
      return;
    }

    if (req.method === "PUT") {
      const body = readJson(req);
      const title = String(body.title ?? "").trim();
      if (!title) {
        json(res, 400, { error: "title_required" });
        return;
      }
      await db().execute({ sql: "UPDATE topics SET title = ? WHERE id = ?", args: [title, id] });
      json(res, 200, { id, title });
      return;
    }

    await db().execute({ sql: "UPDATE participants SET topic_id = NULL WHERE topic_id = ?", args: [id] });
    await db().execute({ sql: "DELETE FROM topics WHERE id = ?", args: [id] });
    json(res, 200, { id, deleted: true });
  } catch (err) {
    console.error(err);
    json(res, 500, { error: "server_error" });
  }
}
