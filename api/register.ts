import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, readJson } from "../server/http.js";
import { register } from "../server/sorteo.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== "POST") {
      methodNotAllowed(res, ["POST"]);
      return;
    }

    const body = readJson(req);
    const name = String(body.name ?? "").trim();
    if (!name) {
      json(res, 400, { error: "name_required" });
      return;
    }
    if (name.length > 60) {
      json(res, 400, { error: "name_too_long" });
      return;
    }

    const result = await register(name);
    json(res, 200, { ...result.state, existing: result.existing });
  } catch (err) {
    console.error(err);
    json(res, 500, { error: "server_error" });
  }
}
