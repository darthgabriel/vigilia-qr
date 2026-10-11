import { esc } from "./dom";
import type { Ctx } from "./ctx";

export function renderPersonas(view: HTMLElement, ctx: Ctx): void {
  const { participants, topics } = ctx.state;
  const topicTitles = new Map(topics.map((t) => [t.id, t.title]));

  if (participants.length === 0) {
    view.innerHTML = `
      <h1>Personas</h1>
      <div class="empty">
        <p>Aún no hay personas registradas.</p>
        <p>Comparte el QR para que se registren.</p>
      </div>`;
    return;
  }

  view.innerHTML = `
    <h1>Personas</h1>
    <div class="card">
      <div class="group-head">
        <h2>Registradas</h2>
        <span class="badge">${participants.length}</span>
      </div>
      <div>
        ${participants
          .map((p) => {
            const group = p.topicId ? topicTitles.get(p.topicId) : null;
            return `<div class="member"><span class="member-name">${esc(p.name)}${group ? ` - ${esc(group)}` : ""}</span></div>`;
          })
          .join("")}
      </div>
    </div>
    <p class="hint">Solo consulta. El registro se hace escaneando el QR.</p>
  `;
}
