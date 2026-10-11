import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasPin } from "../../server/auth.js";
import { json, methodNotAllowed } from "../../server/http.js";
import { clearAll } from "../../server/sorteo.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== "POST") {
      methodNotAllowed(res, ["POST"]);
      return;
    }
    if (!hasPin(req)) {
      json(res, 401, { error: "unauthorized" });
      return;
    }

    const body = (req.body ?? {}) as { action?: unknown };
    const action = String(body.action ?? "reset");

    if (action === "status") {
      json(res, 200, { ok: true });
      return;
    }

    if (action === "reset") {
      json(res, 200, await clearAll());
      return;
    }

    json(res, 400, { error: "unknown_action" });
  } catch (err) {
    console.error(err);
    json(res, 500, { error: "server_error" });
  }
}
