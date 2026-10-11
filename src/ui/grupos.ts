import type { AppState } from "../../shared/types";
import { esc, toast } from "./dom";
import type { Ctx } from "./ctx";

function whatsappText(state: AppState): string {
  const lines: string[] = ["GRUPOS DE ORACIÓN", ""];
  state.topics.forEach((t, i) => {
    lines.push(`${i + 1}. ${t.title}`);
    const members = state.participants.filter((p) => p.topicId === t.id);
    if (members.length === 0) lines.push("(sin integrantes)");
    else members.forEach((m) => lines.push(`• ${m.name}`));
    lines.push("");
  });
  const unassigned = state.participants.filter((p) => !p.topicId);
  if (unassigned.length > 0) {
    lines.push("Sin grupo:");
    unassigned.forEach((m) => lines.push(`• ${m.name}`));
  }
  return lines.join("\n").trim();
}

export function renderGrupos(view: HTMLElement, ctx: Ctx): void {
  const { topics, participants } = ctx.state;

  if (participants.length === 0) {
    view.innerHTML = `
      <h1>GRUPOS</h1>
      <div class="empty">
        <p>Aún no hay personas registradas.</p>
        <p>Comparte el QR para que se registren.</p>
      </div>`;
    return;
  }

  const unassigned = participants.filter((p) => !p.topicId);

  const cards = topics
    .map((t, i) => {
      const members = participants.filter((p) => p.topicId === t.id);
      const memberRows =
        members.length === 0
          ? `<p class="hint" style="padding:8px 0 0">Sin integrantes</p>`
          : members
              .map(
                (m) => `
          <div class="member">
            <span class="member-name">${esc(m.name)}</span>
          </div>`,
              )
              .join("");
      return `
      <div class="card">
        <div class="group-head">
          <h2>${i + 1}. ${esc(t.title)}</h2>
          <span class="badge">${members.length}</span>
        </div>
        ${memberRows}
      </div>`;
    })
    .join("");

  const unassignedCard =
    unassigned.length > 0
      ? `<div class="notice"><strong>${unassigned.length} sin grupo:</strong> ${unassigned
          .map((p) => esc(p.name))
          .join(", ")}</div>`
      : "";

  view.innerHTML = `
    <h1>GRUPOS</h1>
    ${unassignedCard}
    <div class="row" style="margin-bottom:16px">
      <button class="btn btn-outline" id="copy">Copiar lista</button>
    </div>
    ${cards}
  `;

  view.querySelector<HTMLButtonElement>("#copy")!.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(whatsappText(ctx.state));
      toast("Lista copiada");
    } catch {
      toast("No se pudo copiar");
    }
  });
}
