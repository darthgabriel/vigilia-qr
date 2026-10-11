import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasPin } from "../../server/auth.js";
import { json, methodNotAllowed, readJson } from "../../server/http.js";
import { db } from "../../server/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== "PUT") {
      methodNotAllowed(res, ["PUT"]);
      return;
    }
    if (!hasPin(req)) {
      json(res, 401, { error: "unauthorized" });
      return;
    }

    const body = readJson(req);
    const order = body.order;
    if (!Array.isArray(order) || order.length === 0) {
      json(res, 400, { error: "order_required" });
      return;
    }

    const d = db();
    const rows = await d.execute("SELECT id FROM topics");
    const valid = new Set(rows.rows.map((r) => String(r.id)));
    const ids = order.map(String);
    if (ids.length !== valid.size || ids.some((id) => !valid.has(id))) {
      json(res, 400, { error: "invalid_order" });
      return;
    }

    for (let i = 0; i < ids.length; i++) {
      await d.execute({ sql: "UPDATE topics SET position = ? WHERE id = ?", args: [i, ids[i]] });
    }
    json(res, 200, { ok: true });
  } catch (err) {
    console.error(err);
    json(res, 500, { error: "server_error" });
  }
}
