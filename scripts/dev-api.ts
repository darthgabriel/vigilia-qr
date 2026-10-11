import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import sorteoHandler from "../api/sorteo";
import registerHandler from "../api/register";
import manageHandler from "../api/manage/sorteo";
import topicsHandler from "../api/topics";
import topicByIdHandler from "../api/topics/[id]";
import topicsOrderHandler from "../api/topics/order";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
try {
  const raw = readFileSync(join(root, ".env"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  console.warn(".env no encontrado");
}

const PORT = Number(process.env.DEV_API_PORT ?? 8787);

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

function buildRes(nodeRes: ServerResponse) {
  let status = 200;
  const headers: Record<string, string> = {};
  const res = {
    status(code: number) {
      status = code;
      return res;
    },
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
      return res;
    },
    json(data: unknown) {
      nodeRes.writeHead(status, { "content-type": "application/json", ...headers });
      nodeRes.end(JSON.stringify(data));
    },
  };
  return res;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  if (req.method === "GET" || req.method === "DELETE") return undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return undefined;
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function route(pathname: string): { handler: Handler; id?: string } | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "api") return null;
  if (parts.length === 2 && parts[1] === "sorteo") return { handler: sorteoHandler as Handler };
  if (parts.length === 2 && parts[1] === "register") return { handler: registerHandler as Handler };
  if (parts.length === 3 && parts[1] === "manage" && parts[2] === "sorteo")
    return { handler: manageHandler as Handler };
  if (parts.length === 2 && parts[1] === "topics") return { handler: topicsHandler as Handler };
  if (parts.length === 3 && parts[1] === "topics" && parts[2] === "order")
    return { handler: topicsOrderHandler as Handler };
  if (parts.length === 3 && parts[1] === "topics") return { handler: topicByIdHandler as Handler, id: parts[2] };
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const match = route(url.pathname);
  if (!match) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
    return;
  }

  const body = await readBody(req);
  const vercelReq = {
    method: req.method ?? "GET",
    query: match.id ? { id: match.id } : {},
    body,
    headers: req.headers,
  } as unknown as VercelRequest;

  try {
    await match.handler(vercelReq, buildRes(res) as unknown as VercelResponse);
  } catch (err) {
    console.error(err);
    if (!res.writableEnded) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "server_error" }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`dev-api escuchando en http://localhost:${PORT}`);
});
