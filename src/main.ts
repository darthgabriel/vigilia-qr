import "./styles.css";
import type { AppState } from "../shared/types";
import { api } from "./api";
import { icons } from "./icons";
import { applyStoredTheme, currentTheme, toggleTheme } from "./theme";
import { renderAdmin } from "./ui/admin";
import type { Ctx } from "./ui/ctx";
import { renderGrupos } from "./ui/grupos";
import { renderPersonas } from "./ui/personas";
import { renderQr } from "./ui/qr";
import { renderScan } from "./ui/scan";

type Route = "personas" | "grupos" | "qr" | "admin" | "scan";

const app = document.getElementById("app")!;

let state: AppState | null = null;
let loadError = false;

function parseRoute(): Route {
  const h = location.hash.replace(/^#\/?/, "");
  if (h === "admin") return "admin";
  if (h === "v") return "scan";
  if (h === "grupos" || h === "formacion" || h === "sorteo") return "grupos";
  if (h === "qr") return "qr";
  return "personas";
}

async function loadState(): Promise<void> {
  try {
    state = await api.state();
    loadError = false;
  } catch {
    loadError = true;
  }
}

function header(): string {
  const themeIcon = currentTheme() === "dark" ? icons.sun : icons.moon;
  const themeLabel = currentTheme() === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  return `
    <header class="topbar">
      <span class="brand"><img src="/logo.png" alt="" /> Formador de Grupos - RD</span>
      <button class="iconbtn" id="theme-btn" aria-label="${themeLabel}">${themeIcon}</button>
      <a class="iconbtn" href="#/admin" aria-label="Panel de administración">${icons.lock}</a>
    </header>`;
}

function tabbar(route: Route): string {
  const tabs: { id: Route; hash: string; label: string; icon: string }[] = [
    { id: "personas", hash: "#/", label: "Personas", icon: icons.users },
    { id: "grupos", hash: "#/grupos", label: "GRUPOS", icon: icons.dice },
    { id: "scan", hash: "#/v", label: "YO", icon: icons.user },
    { id: "qr", hash: "#/qr", label: "QR", icon: icons.qr },
  ];
  return `
    <nav class="tabbar" aria-label="Navegación principal">
      ${tabs
        .map(
          (t) => `
        <a class="tab ${route === t.id ? "active" : ""}" href="${t.hash}" ${
            route === t.id ? 'aria-current="page"' : ""
          }>${t.icon}<span>${t.label}</span></a>`,
        )
        .join("")}
    </nav>`;
}

async function render(): Promise<void> {
  const route = parseRoute();
  await loadState();

  const ctx: Ctx = {
    get state() {
      if (!state) throw new Error("state not loaded");
      return state;
    },
    refresh: async () => {
      await loadState();
      await render();
    },
  };

  const isTab = route === "personas" || route === "grupos" || route === "qr" || route === "scan";
  app.innerHTML = `
    ${header()}
    <main class="${isTab ? "" : "no-tabs"}"><div id="view"></div></main>
    ${isTab ? tabbar(route) : ""}
  `;

  document.getElementById("theme-btn")!.addEventListener("click", () => {
    toggleTheme();
    void render();
  });

  const view = document.getElementById("view")!;

  if (loadError) {
    view.innerHTML = `
      <div class="empty" style="padding-top:48px">
        <p>No se pudo conectar con el servidor.</p>
        <p>Revisa tu conexión e intenta de nuevo.</p>
      </div>
      <button class="btn btn-primary" id="retry">Reintentar</button>`;
    document.getElementById("retry")!.addEventListener("click", () => void render());
    return;
  }

  switch (route) {
    case "personas":
      renderPersonas(view, ctx);
      break;
    case "grupos":
      renderGrupos(view, ctx);
      break;
    case "qr":
      renderQr(view, ctx);
      break;
    case "admin":
      await renderAdmin(view, ctx);
      break;
    case "scan":
      renderScan(view, ctx);
      break;
  }
}

applyStoredTheme();
window.addEventListener("hashchange", () => void render());
void render();
