import type { VercelRequest } from "@vercel/node";

export function hasPin(req: VercelRequest): boolean {
  const pin = process.env.ADMIN_PIN;
  if (!pin) return false;
  const given = req.headers["x-admin-pin"];
  return typeof given === "string" && given === pin;
}
