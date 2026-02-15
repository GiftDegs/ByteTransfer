// sharing.js (flujo directo)
// - Móvil: comparte IMAGEN (share nativo)
// - PC: descarga IMAGEN
// Sin menú, sin compartir texto

function buildImageFilename(getLastCalc) {
  const last = getLastCalc?.();

  const o = last?.origen?.codigo || "XX";
  const d = last?.destino?.codigo || "XX";
  const mode = last?.mode || "calc";

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");

  return `ByteTransfer_${o}-${d}_${mode}_${yyyy}-${mm}-${dd}_${hh}-${mi}.png`;
}

function toastLite(DOM, msg) {
  const el = DOM?.toastMensaje;
  if (!el) {
    alert(msg);
    return;
  }
  el.textContent = msg;
  el.classList.remove("hidden");
  el.style.opacity = "1";
  el.style.transform = "scale(1)";
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "scale(0.95)";
    setTimeout(() => el.classList.add("hidden"), 250);
  }, 2200);
}

// Detecta "móvil real" (no solo que exista navigator.share)
// Porque en Windows también existe share y te abre ese panel.
function isLikelyMobileDevice() {
  const ua = (navigator.userAgent || "").toLowerCase();
  const isUA = /android|iphone|ipad|ipod|iemobile|windows phone|mobile/.test(ua);
  const hasTouch = "maxTouchPoints" in navigator && navigator.maxTouchPoints > 0;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) <= 820; // umbral razonable
  // Móvil si userAgent dice móvil O (touch + pantalla chica)
  return isUA || (hasTouch && smallScreen);
}

// === html2canvas loader ===
function ensureHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) return resolve(window.html2canvas);

    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
    s.async = true;
    s.onload = () => resolve(window.html2canvas);
    s.onerror = () => reject(new Error("No se pudo cargar html2canvas"));
    document.head.appendChild(s);
  });
}

function waitNextFrame() {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

// Captura EXACTAMENTE el resultado real visible (resTextContainer)
// y lo convierte a Blob PNG.
async function captureResultBlobFromDOM(DOM) {
  const target =
    DOM?.resTextContainer ||
    document.getElementById("resTextContainer") ||
    document.getElementById("resText");

  if (!target) throw new Error("No se encontró #resTextContainer para capturar.");

  const html2canvas = await ensureHtml2Canvas();

  // Esperar a que carguen fuentes (evita cambios raros de medidas en la captura)
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch (_) {}

  // Wrapper oculto
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-99999px";
  wrapper.style.top = "0";
  wrapper.style.zIndex = "-1";
  wrapper.style.pointerEvents = "none";

  // === Export IG cuadrado ===
  const size = 1080;
  const pad = 54; // margen ~1–2 cm en 1080x1080

  // Stage (lienzo cuadrado)
  const stage = document.createElement("div");
  stage.style.width = `${size}px`;
  stage.style.height = `${size}px`;
  stage.style.position = "relative";
  stage.style.display = "flex";
  stage.style.alignItems = "center";
  stage.style.justifyContent = "center";
  stage.style.padding = `${pad}px`;
  stage.style.boxSizing = "border-box";
  stage.style.overflow = "hidden";

  // Copiamos EXACTO lo que se ve en pantalla (tu tarjeta real)
  const clone = target.cloneNode(true);

  // Quitar botones/menús del clon
  clone
    .querySelectorAll("button, #btnCompartir, #shareMenu, .share-menu, .btn-share")
    .forEach((el) => el.remove());

  // Evitar que html2canvas se maree con transforms previos
  clone.querySelectorAll("*").forEach((el) => {
    if (el.style) el.style.transform = "none";
  });

  // Meter el clone dentro de un contenedor escalable
  const scaler = document.createElement("div");
  scaler.style.transformOrigin = "center center";
  scaler.style.display = "block";
  scaler.appendChild(clone);

  stage.appendChild(scaler);
  wrapper.appendChild(stage);
  document.body.appendChild(wrapper);

  // Esperar layout
  await waitNextFrame();
  await waitNextFrame();

  // Calculamos escala para que "llene" el cuadrado (dejando pad)
  const availableW = size - pad * 2;
  const availableH = size - pad * 2;

  const cRect = scaler.getBoundingClientRect();
  const scaleX = availableW / (cRect.width || 1);
  const scaleY = availableH / (cRect.height || 1);

  // Queremos que el contenido LLENE el cuadrado dejando un margen elegante (pad),
  // sin quedar “mini”. Preferimos estar a 1–2% de tocar los bordes.
  let scale = Math.min(scaleX, scaleY) * 0.99;

  // Límites razonables (por si el DOM cambia raro)
  scale = Math.min(4.0, Math.max(0.85, scale));

  scaler.style.transform = `scale(${scale})`;

  // Un frame más después del scale
  await waitNextFrame();

  const canvas = await html2canvas(stage, {
    backgroundColor: null,
    useCORS: true,
    scale: 2, // 2160x2160 final (queda nítido)
    logging: false,
  });

  wrapper.remove();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
  if (!blob) throw new Error("No se pudo generar PNG.");

  return blob;
}

async function downloadBlob(blob, filename = "bytetransfer.png") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

export function initSharing(DOM, getLastCalc /*, getOpsState */) {
  // Ocultamos el menú y opciones si existen (ya no se usan)
  if (DOM.menuCompartir) DOM.menuCompartir.classList.add("hidden");
  if (DOM.opcionTexto) DOM.opcionTexto.classList.add("hidden");
  if (DOM.opcionImagen) DOM.opcionImagen.classList.add("hidden");

  // Mostramos SIEMPRE el botón compartir (si existe)
  if (DOM.btnCompartir) DOM.btnCompartir.classList.remove("hidden");
  if (!DOM.btnCompartir) return;

  DOM.btnCompartir.addEventListener("click", async () => {
    try {
      const last = getLastCalc?.();
      if (!last) {
        toastLite(DOM, "⚠️ Primero realiza un cálculo.");
        return;
      }

      const blob = await captureResultBlobFromDOM(DOM);
      const file = new File([blob], "bytetransfer.png", { type: "image/png" });

      // MÓVIL: compartir imagen nativa
      if (
        isLikelyMobileDevice() &&
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        navigator.share
      ) {
        await navigator.share({ files: [file], title: "ByteTransfer" });
        return;
      }

      // PC (o móvil sin soporte): descargar
      const filename = buildImageFilename(getLastCalc);
      await downloadBlob(blob, filename);
      toastLite(DOM, "📷 Imagen descargada.");
    } catch (e) {
      console.error(e);
      toastLite(DOM, "No se pudo generar la imagen.");
    }
  });
}
