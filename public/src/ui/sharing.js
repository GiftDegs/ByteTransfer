// sharing.js (sin imports para no romper el flujo por rutas/export inexistentes)

function isMobileShareAvailable() {
  return typeof navigator !== "undefined" && !!navigator.share;
}

function nombreMonedaBasica(codigo) {
  const map = {
    ARS: "Pesos argentinos",
    COP: "Pesos colombianos",
    VES: "Bolívares",
    CLP: "Pesos chilenos",
    PEN: "Soles",
    MXN: "Pesos mexicanos",
    BRL: "Reales",
    USD: "Dólares",
    EUR: "Euros",
  };
  return map[codigo] || codigo;
}

export function initSharing(DOM, getLastCalc) {
  const canShare = isMobileShareAvailable();

  // Regla:
  // - Móvil (hay share sheet): mostramos botón imagen (share icon) y menú
  // - PC (no hay share sheet): ocultamos share icon y mostramos WhatsApp
  if (DOM.btnCompartir) DOM.btnCompartir.classList.toggle("hidden", !canShare);
  if (DOM.btnWhats) DOM.btnWhats.classList.toggle("hidden", canShare);

  const menu = DOM.menuCompartir;

  // --- Menu toggle (solo si existe el botón de compartir) ---
  if (DOM.btnCompartir && menu) {
    DOM.btnCompartir.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && e.target !== DOM.btnCompartir) {
        menu.classList.add("hidden");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") menu.classList.add("hidden");
    });
  }

  function buildText() {
    const last = getLastCalc?.();
    if (!last) return "ByteTransfer";

    // Tu lastCalc real (en steps.js) tiene: { origen, destino, montoIngresado, montoCalculado, tasa, fecha, mode }
    const oCode = last.origen?.codigo || "";
    const dCode = last.destino?.codigo || "";
    const oName = nombreMonedaBasica(oCode);
    const dName = nombreMonedaBasica(dCode);

    const nf0 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
    const nf2 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

    const montoIn = Number.isFinite(last.montoIngresado) ? nf2.format(last.montoIngresado) : last.montoIngresado;
    const montoOut = Number.isFinite(last.montoCalculado) ? nf0.format(last.montoCalculado) : last.montoCalculado;

    const tasa = last.tasa ?? "";
    const fecha = last.fecha ?? "";

    // Texto simple para cliente
    return `ByteTransfer
Envío: ${montoIn} ${oName}
Recibe: ${montoOut} ${dName}
Tasa: ${tasa} (${fecha})`;
  }

  async function shareText() {
    try {
      await navigator.share({ text: buildText() });
    } catch (_) {
      // cancelado / no disponible
    }
  }

  // Share (móvil)
  if (DOM.opcionTexto) {
    DOM.opcionTexto.addEventListener("click", async () => {
      if (menu) menu.classList.add("hidden");
      await shareText();
    });
  }

  // WhatsApp (PC)
  if (DOM.btnWhats) {
    DOM.btnWhats.addEventListener("click", () => {
      const url = `https://wa.me/?text=${encodeURIComponent(buildText())}`;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }
}
