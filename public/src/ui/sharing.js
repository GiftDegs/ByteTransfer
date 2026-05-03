import { generatePremiumShareBlob } from "./shareCanvas.js";
import { getShareFilename } from "../core/sharePayload.js";

let premiumShareInProgress = false;

// sharing.js
// Flujo vigente: genera imagen premium con canvas interno y usa share nativo si el navegador lo permite.

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

async function capturePremiumShareBlob(payload) {
  return generatePremiumShareBlob(payload);
}

export async function sharePremiumPayload(payload, DOM = null) {
  if (premiumShareInProgress) {
    toastLite(DOM, "El cuadro de compartir sigue abierto. Espera unos segundos e int\u00e9ntalo de nuevo.");
    return { ok: false, reason: "share_in_progress" };
  }

  premiumShareInProgress = true;

  try {
    const blob = await capturePremiumShareBlob(payload);
    const filename = getShareFilename(payload);
    const file = new File([blob], filename, { type: "image/png" });

    if (
      navigator.canShare &&
      navigator.canShare({ files: [file] }) &&
      navigator.share
    ) {
      await navigator.share({
        files: [file],
        title: "ByteTransfer",
      });

      return { ok: true, method: "native_share" };
    }

    toastLite(DOM, "Este dispositivo no permite compartir im\u00e1genes directamente.");
    return { ok: false, reason: "native_share_unavailable" };
  } catch (err) {
    if (err?.name === "AbortError") {
      return { ok: false, reason: "share_cancelled" };
    }

    if (err?.name === "InvalidStateError") {
      toastLite(DOM, "El cuadro de compartir todav\u00eda est\u00e1 abierto. Espera unos segundos e int\u00e9ntalo de nuevo.");
      return { ok: false, reason: "share_in_progress" };
    }

    console.error("[sharing] sharePremiumPayload:", err);
    toastLite(DOM, "No se pudo generar la imagen premium.");
    return { ok: false, reason: err?.message || "unknown_error" };
  } finally {
    premiumShareInProgress = false;
  }
}
