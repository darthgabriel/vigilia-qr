import { api } from "../api";
import { icons } from "../icons";
import { esc, setLoading, toast } from "./dom";
import type { Ctx } from "./ctx";

let verified = false;

const PIN_KEY = "vigilia.pin";

function pin(): string {
  return localStorage.getItem(PIN_KEY) ?? "";
}

function renderPinForm(view: HTMLElement, ctx: Ctx): void {
  view.innerHTML = `
    <h1>Panel</h1>
    <div class="card">
      <p class="hint" style="margin-top:0">Zona privada. Ingresa el PIN para editar motivos y resetear la formación.</p>
      <form id="pin-form">
        <label for="pin">PIN de acceso</label>
        <input id="pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password" required />
        <p class="error" id="pin-error" hidden></p>
        <div style="height: 12px"></div>
        <button class="btn btn-primary" type="submit">Entrar</button>
      </form>
    </div>
  `;

  const form = view.querySelector<HTMLFormElement>("#pin-form")!;
  const input = view.querySelector<HTMLInputElement>("#pin")!;
  const errorNode = view.querySelector<HTMLElement>("#pin-error")!;
  const submit = view.querySelector<HTMLButtonElement>("button[type=submit]")!;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorNode.hidden = true;
    const value = input.value.trim();
    if (!value) return;
    setLoading(submit, true);
    try {
      await api.manage("status", value);
      localStorage.setItem(PIN_KEY, value);
      verified = true;
      await renderAdmin(view, ctx);
      toast("Bienvenido");
    } catch {
      setLoading(submit, false);
      errorNode.textContent = "PIN incorrecto.";
      errorNode.hidden = false;
      input.focus();
    }
  });
}

function groupsPreview(ctx: Ctx): string {
  const { topics, participants } = ctx.state;

  if (topics.length === 0) {
    return `<p class="hint">No hay motivos de oración.</p>`;
  }
  if (participants.length === 0) {
    return `<p class="hint">Aún no hay personas registradas.</p>`;
  }

  return topics
    .map((t, i) => {
      const members = participants.filter((p) => p.topicId === t.id);
      return `
      <div class="member" style="align-items:flex-start; flex-direction:column; gap:4px">
        <div class="group-head" style="width:100%; margin:0">
          <strong>${i + 1}. ${esc(t.title)}</strong>
          <span class="badge">${members.length}</span>
        </div>
        <span class="hint" style="margin:0">${members.length === 0 ? "Sin integrantes" : members.map((m) => esc(m.name)).join(" · ")}</span>
      </div>`;
    })
    .join("");
}

function renderDashboard(view: HTMLElement, ctx: Ctx): void {
  const { topics, participants } = ctx.state;
  const p = pin();
  const hasRegistrations = participants.length > 0;

  const rows = topics
    .map(
      (t, i) => `
      <li class="topic-row">
        <input value="${esc(t.title)}" data-id="${esc(t.id)}" data-role="title" aria-label="Motivo ${i + 1}" />
        <button class="iconbtn" data-act="up" data-id="${esc(t.id)}" aria-label="Subir motivo" ${i === 0 ? "disabled" : ""}>${icons.up}</button>
        <button class="iconbtn" data-act="down" data-id="${esc(t.id)}" aria-label="Bajar motivo" ${i === topics.length - 1 ? "disabled" : ""}>${icons.down}</button>
        <button class="iconbtn" data-act="del" data-id="${esc(t.id)}" aria-label="Eliminar motivo">${icons.trash}</button>
      </li>`,
    )
    .join("");

  view.innerHTML = `
    <h1>Panel</h1>

    <div class="card">
      <h2>Motivos de oración</h2>
      <p class="hint">${topics.length} activos · ${participants.length} personas registradas</p>
      <ul class="topic-list" id="topic-list">${rows}</ul>
      <form id="add-form" class="row" style="margin-top:12px">
        <input id="add-input" placeholder="Nuevo motivo" aria-label="Nuevo motivo" style="flex:1" />
        <button class="btn btn-primary btn-sm" type="submit" aria-label="Agregar motivo" style="width:48px;padding:0">${icons.plus}</button>
      </form>
      <p class="error" id="admin-error" hidden></p>
    </div>

    <div class="card">
      <h2>Grupos actuales</h2>
      <div id="groups-preview">${groupsPreview(ctx)}</div>
    </div>

    <div class="card danger-zone">
      <h2>Formación</h2>
      <p class="hint">Vacía todos los registros. La gente vuelve a escanear para registrarse.</p>
      <div class="stack">
        <button class="btn btn-outline" id="reset-btn" ${hasRegistrations ? "" : "disabled"}>Resetear formación</button>
        <button class="btn btn-outline" id="logout-btn">Salir del panel</button>
      </div>
    </div>
  `;

  const errorNode = view.querySelector<HTMLElement>("#admin-error")!;
  const fail = (msg: string, btn?: HTMLButtonElement | null) => {
    if (btn) btn.disabled = false;
    errorNode.textContent = msg;
    errorNode.hidden = false;
  };

  const list = view.querySelector<HTMLUListElement>("#topic-list")!;

  list.querySelectorAll<HTMLInputElement>('input[data-role="title"]').forEach((input) => {
    const id = input.dataset.id ?? "";
    const original = input.value;
    input.addEventListener("change", async () => {
      const title = input.value.trim();
      if (!title || title === original) {
        input.value = title || original;
        return;
      }
      try {
        await api.renameTopic(id, title, p);
        toast("Motivo actualizado");
      } catch (e) {
        input.value = original;
        fail((e as Error).message === "unauthorized" ? "PIN inválido. Entra de nuevo." : "No se pudo renombrar.");
      }
    });
  });

  list.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-act]");
    if (!btn) return;
    const id = btn.dataset.id ?? "";
    const act = btn.dataset.act;
    const order = topics.map((t) => t.id);
    const idx = order.indexOf(id);
    if (idx < 0) return;

    try {
      if (act === "up" && idx > 0) {
        [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
        await api.reorderTopics(order, p);
        await ctx.refresh();
      } else if (act === "down" && idx < order.length - 1) {
        [order[idx + 1], order[idx]] = [order[idx], order[idx + 1]];
        await api.reorderTopics(order, p);
        await ctx.refresh();
      } else if (act === "del") {
        const title = topics.find((t) => t.id === id)?.title ?? "";
        if (!window.confirm(`¿Eliminar el motivo "${title}"? Sus personas quedan sin grupo.`)) return;
        await api.deleteTopic(id, p);
        toast("Motivo eliminado");
        await ctx.refresh();
      }
    } catch (err) {
      fail((err as Error).message === "unauthorized" ? "PIN inválido. Entra de nuevo." : "No se pudo completar la acción.");
    }
  });

  const addForm = view.querySelector<HTMLFormElement>("#add-form")!;
  const addInput = view.querySelector<HTMLInputElement>("#add-input")!;
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = addInput.value.trim();
    if (!title) return;
    try {
      await api.addTopic(title, p);
      addInput.value = "";
      toast("Motivo agregado");
      await ctx.refresh();
    } catch (err) {
      fail((err as Error).message === "unauthorized" ? "PIN inválido." : "No se pudo agregar.");
    }
  });

  view.querySelector<HTMLButtonElement>("#reset-btn")!.addEventListener("click", async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    if (!window.confirm("Se borrarán todas las personas registradas. ¿Continuar?")) return;
    btn.disabled = true;
    try {
      await api.manage("reset", p);
      await ctx.refresh();
      toast("Formación vaciada");
    } catch (err) {
      fail((err as Error).message === "unauthorized" ? "PIN inválido." : "No se pudo resetear.", btn);
    }
  });

  view.querySelector<HTMLButtonElement>("#logout-btn")!.addEventListener("click", () => {
    localStorage.removeItem(PIN_KEY);
    verified = false;
    void renderAdmin(view, ctx);
  });
}

export async function renderAdmin(view: HTMLElement, ctx: Ctx): Promise<void> {
  if (!verified) {
    const stored = pin();
    if (stored) {
      try {
        await api.manage("status", stored);
        verified = true;
      } catch {
        localStorage.removeItem(PIN_KEY);
      }
    }
  }
  if (!verified) {
    renderPinForm(view, ctx);
    return;
  }
  renderDashboard(view, ctx);
}
