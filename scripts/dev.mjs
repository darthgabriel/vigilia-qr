import { spawn, spawnSync } from "node:child_process";

const children = [
  spawn("npm run dev:api", { stdio: "inherit", shell: true }),
  spawn("npm run dev:web", { stdio: "inherit", shell: true }),
];

console.log("Formador de Grupos - RD dev: API + web juntos. Ctrl+C para parar.\n");

let stopping = false;

function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.pid) {
      try {
        spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      } catch {
        child.kill();
      }
    }
  }
  process.exit(code);
}

for (const child of children) {
  child.on("exit", (code) => shutdown(code ?? 0));
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
