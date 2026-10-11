export function esc(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function toast(message: string): void {
  let node = document.querySelector<HTMLDivElement>(".toast");
  if (!node) {
    node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add("show");
  window.setTimeout(() => node?.classList.remove("show"), 1800);
}

export function setLoading(btn: HTMLButtonElement, loading: boolean): void {
  if (loading) {
    btn.dataset.label = btn.textContent ?? "";
    btn.disabled = true;
    btn.textContent = "Procesando…";
  } else {
    btn.disabled = false;
    if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }
}

export function showModal({ name, groupNumber, topic }: { name: string; groupNumber: number; topic: string }): void {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="Grupo asignado">
      <p class="hint" style="margin:0">${esc(name)} fue asignado a</p>
      <div class="group-number">${groupNumber}</div>
      <p class="modal-topic">${esc(topic)}</p>
      <button class="btn btn-primary" type="button">Entendido</button>
    </div>`;
  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector<HTMLButtonElement>("button")!.addEventListener("click", close);
  document.body.appendChild(overlay);
}
