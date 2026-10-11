import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed, json } from "../server/http";
import { readState } from "../server/sorteo";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== "GET") {
      methodNotAllowed(res, ["GET"]);
      return;
    }

    json(res, 200, await readState());
  } catch (err) {
    console.error(err);
    json(res, 500, { error: "server_error" });
  }
}
