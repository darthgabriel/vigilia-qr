import QRCode from "qrcode";
import { toast } from "./dom";
import type { Ctx } from "./ctx";

function scanUrl(): string {
  return `${location.origin}${location.pathname}#/v`;
}

function escUrl(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
}

export function renderQr(view: HTMLElement, ctx: Ctx): void {
  const { topics } = ctx.state;

  if (topics.length === 0) {
    view.innerHTML = `
      <h1>QR</h1>
      <div class="empty">
        <p>No hay motivos de oración.</p>
        <p>Agrégalos desde el panel de administración.</p>
      </div>`;
    return;
  }

  const url = scanUrl();

  view.innerHTML = `
    <h1>QR</h1>
    <div class="card">
      <p class="hint" style="margin-top:0">Comparte este QR. Quien lo escanea se registra con su nombre y queda en su grupo.</p>
      <div class="loading" id="qr-loading">Generando QR…</div>
      <img class="qr-img" id="qr-img" alt="Código QR de Formador de Grupos - RD" hidden />
      <p class="qr-url" id="qr-url" hidden>${escUrl(url)}</p>
      <p class="error" id="qr-error" hidden></p>
      <div class="row" id="qr-actions" hidden>
        <button class="btn btn-primary" id="qr-download">Descargar PNG</button>
        <button class="btn btn-outline" id="qr-copy">Copiar link</button>
      </div>
    </div>
    <p class="hint">Si cambias los grupos o los motivos, el QR sigue sirviendo: siempre abre el registro actual.</p>
  `;

  const loading = view.querySelector<HTMLElement>("#qr-loading")!;
  const img = view.querySelector<HTMLImageElement>("#qr-img")!;
  const urlNode = view.querySelector<HTMLElement>("#qr-url")!;
  const actions = view.querySelector<HTMLElement>("#qr-actions")!;
  const errorNode = view.querySelector<HTMLElement>("#qr-error")!;

  QRCode.toDataURL(url, { width: 1024, margin: 1, errorCorrectionLevel: "M" })
    .then((dataUrl) => {
      img.src = dataUrl;
      img.hidden = false;
      urlNode.hidden = false;
      actions.hidden = false;
      loading.hidden = true;

      view.querySelector<HTMLButtonElement>("#qr-download")!.addEventListener("click", () => {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "formador-de-grupos-rd.png";
        a.click();
      });

      view.querySelector<HTMLButtonElement>("#qr-copy")!.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast("Link copiado");
        } catch {
          toast("No se pudo copiar");
        }
      });
    })
    .catch(() => {
      loading.hidden = true;
      errorNode.textContent = "No se pudo generar el QR.";
      errorNode.hidden = false;
    });
}
