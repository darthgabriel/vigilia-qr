import type { AppState, Participant } from "../../shared/types";
import { verseFor } from "../../shared/verses";
import { api } from "../api";
import { esc, setLoading } from "./dom";
import type { Ctx } from "./ctx";

const ME_KEY = "vigilia.me";

function findParticipant(state: AppState, name: string): Participant | undefined {
  const key = name.trim().toLowerCase();
  return state.participants.find((p) => p.name.toLowerCase() === key);
}

function groupCard(state: AppState, me: Participant): string {
  const topic = state.topics.find((t) => t.id === me.topicId);
  if (!topic) return "";
  const idx = state.topics.findIndex((t) => t.id === topic.id);
  const members = state.participants.filter((p) => p.topicId === topic.id);
  const verse = verseFor(topic.title);
  return `
    <div class="card scan-card">
      <div class="group-number">${idx + 1}</div>
      <p class="hint" style="margin:0">Tu grupo de oración</p>
      <p class="scan-topic">${esc(topic.title)}</p>
      <blockquote class="verse">
        <p>“${esc(verse.text)}”</p>
        <cite>${esc(verse.ref)}</cite>
      </blockquote>
      <p class="hint">Integrantes</p>
      <ul class="scan-members">
        ${members.map((m) => `<li>${esc(m.name)}${m.id === me.id ? " (tú)" : ""}</li>`).join("")}
      </ul>
      <p class="hint">Este teléfono quedó marcado con tu nombre: la próxima vez que escanees verás tu grupo directo.</p>
    </div>`;
}

export function renderScan(view: HTMLElement, ctx: Ctx): void {
  const state = ctx.state;
  const { topics, participants } = state;

  if (topics.length === 0) {
    view.innerHTML = `
      <div class="empty" style="padding-top:48px">
        <p>No hay motivos de oración configurados.</p>
        <p>Contacta al organizador.</p>
      </div>`;
    return;
  }

  const saved = localStorage.getItem(ME_KEY);
  const me = saved ? findParticipant(state, saved) : undefined;
  if (saved && !me) {
    localStorage.removeItem(ME_KEY);
  }

  if (me && me.topicId) {
    view.innerHTML = groupCard(state, me);
    return;
  }

  const prefill = me ? me.name : "";
  const options = participants.map((p) => `<option value="${esc(p.name)}"></option>`).join("");

  view.innerHTML = `
    <div class="card" style="margin-top:16px">
      <h1 style="margin-bottom:4px">¿Quién eres?</h1>
      <p class="hint" style="margin-top:0">Escribe tu nombre para registrarte y ver tu grupo de oración.</p>
      <form id="me-form">
        <label for="me">Tu nombre</label>
        <input id="me" list="name-options" autocomplete="name" maxlength="60" value="${esc(prefill)}" required />
        <datalist id="name-options">${options}</datalist>
        <p class="error" id="me-error" hidden></p>
        <div style="height:12px"></div>
        <button class="btn btn-primary" type="submit">Entrar a mi grupo</button>
      </form>
    </div>
  `;

  const form = view.querySelector<HTMLFormElement>("#me-form")!;
  const input = view.querySelector<HTMLInputElement>("#me")!;
  const errorNode = view.querySelector<HTMLElement>("#me-error")!;
  const submit = view.querySelector<HTMLButtonElement>("button[type=submit]")!;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorNode.hidden = true;
    const name = input.value.trim();
    if (!name) {
      errorNode.textContent = "Escribe tu nombre.";
      errorNode.hidden = false;
      return;
    }
    setLoading(submit, true);
    try {
      const res = await api.register(name);
      localStorage.setItem(ME_KEY, name);
      if (res.existing) {
        const existing = findParticipant(res, name);
        if (existing && !existing.topicId) {
          setLoading(submit, false);
          errorNode.textContent = "Tu nombre ya está, pero aún no tiene grupo. Consulta al organizador.";
          errorNode.hidden = false;
          return;
        }
      }
      await ctx.refresh();
    } catch (err) {
      setLoading(submit, false);
      const code = (err as Error).message;
      errorNode.textContent =
        code === "name_too_long"
          ? "El nombre es demasiado largo."
          : "No se pudo registrar. Intenta de nuevo.";
      errorNode.hidden = false;
    }
  });
}
