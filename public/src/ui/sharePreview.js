// public/src/ui/sharePreview.js

import {
  buildReferenceSharePayload,
  buildRateSharePayload,
  buildRemittanceSharePayload,
} from "../core/sharePayload.js";

import { mountShareCard } from "./shareCard.js";
import { sharePremiumPayload } from "./sharing.js";

export function enableSharePreviewTools() {
  window.setSharePreviewTheme = (theme = "dark") => {
    window.__sharePreviewTheme = theme === "light" ? "light" : "dark";
    return window.__sharePreviewTheme;
  };

  window.previewShareCard = (type = "rate") => {
    const payload = getDemoPayload(type);
    payload.theme = window.__sharePreviewTheme || "dark";

    const card = mountShareCard(payload);
    showPreviewOverlay(card);

    return payload;
  };

  window.testSharePremiumImage = async (type = "rate") => {
    const payload = getDemoPayload(type);
    payload.theme = window.__sharePreviewTheme || "dark";

    return sharePremiumPayload(payload);
  };
}

function getDemoPayload(type) {
  if (type === "reference") {
    return buildReferenceSharePayload({
      referenceTitle: "Dólar BCV",
      value: 487.12,
      updatedAt: "30/04/2026 · 14:32",
    });
  }

  if (type === "remittance_send") {
    return buildRemittanceSharePayload({
      type: "send_amount",
      routeLabel: "Argentina → Venezuela",
      tasaVisible: 6.16,
      fecha: "30/04/2026 · 14:32",
      envia: {
        amount: 10000,
        currencyCode: "ARS",
        currencyLabel: "pesos argentinos",
      },
        recibe: {
        amount: 61600,
        currencyCode: "VES",
        currencyLabel: "bolívares",
        usdEquivalent: 126.46,
        },
    });
  }

  if (type === "remittance_receive") {
    return buildRemittanceSharePayload({
      type: "receive_amount",
      routeLabel: "Colombia → Venezuela",
      tasaVisible: 0.36,
      fecha: "30/04/2026 · 14:32",
      recibe: {
        amount: 9000,
        currencyCode: "VES",
        currencyLabel: "bolívares",
        usdEquivalent: 18.48,
        },
      debeEnviar: {
        amount: 25000,
        currencyCode: "COP",
        currencyLabel: "pesos colombianos",
      },
    });
  }

  if (type === "remittance_bcv") {
    return buildRemittanceSharePayload({
      type: "receive_bcv_usd",
      routeLabel: "Argentina → Venezuela",
      tasaVisible: 6.16,
      fecha: "30/04/2026 · 14:32",
      bcvReference: "Dólar BCV",
      bcvRate: 487.12,
      usdDeseados: 50,
      vesObjetivo: 24356,
      debeEnviar: {
        amount: 3955,
        currencyCode: "ARS",
        currencyLabel: "pesos argentinos",
      },
    });
  }

  return buildRateSharePayload({
    origen: "ARS",
    destino: "VES",
    tasa: 6.16,
    updatedAt: "30/04/2026 · 14:32",
  });
}

function showPreviewOverlay(card) {
  if (!card) return;

  let overlay = document.getElementById("sharePreviewOverlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "sharePreviewOverlay";
    overlay.className = [
      "fixed",
      "inset-0",
      "z-[9999]",
      "flex",
      "items-center",
      "justify-center",
      "bg-black/80",
      "p-4",
      "backdrop-blur-xl",
    ].join(" ");

    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="relative flex max-h-[96vh] w-full max-w-[720px] flex-col items-center gap-4">
      <div class="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white shadow-2xl">
        <div>
          <div class="text-sm font-black">Preview de imagen premium</div>
          <div class="text-xs text-slate-400">Esto es solo una vista previa local.</div>
        </div>

        <button
          type="button"
          id="sharePreviewClose"
          class="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
        >
          Cerrar
        </button>
      </div>

      <div id="sharePreviewMount" class="max-h-[86vh] overflow-auto rounded-3xl bg-slate-900 p-3 shadow-2xl"></div>
    </div>
  `;

  const mount = overlay.querySelector("#sharePreviewMount");
const clone = card.cloneNode(true);

const scale = 0.5;
const originalSize = 1080;
const previewSize = originalSize * scale;

const frame = document.createElement("div");
frame.style.width = `${previewSize}px`;
frame.style.height = `${previewSize}px`;
frame.style.overflow = "hidden";
frame.style.borderRadius = "24px";
frame.style.position = "relative";
frame.style.background = "#020617";

clone.style.width = `${originalSize}px`;
clone.style.height = `${originalSize}px`;
clone.style.transform = `scale(${scale})`;
clone.style.transformOrigin = "top left";
clone.style.position = "absolute";
clone.style.left = "0";
clone.style.top = "0";

frame.appendChild(clone);
mount.appendChild(frame);

  overlay.querySelector("#sharePreviewClose")?.addEventListener("click", () => {
    overlay.remove();
  });
}