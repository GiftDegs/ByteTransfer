// public/src/ui/quoteScreens.js

import {
  QUOTE_MODULES,
  getReferenceOptions,
  getRemittanceModeOptions,
} from "../core/quoteModes.js";

import { paisesDisponibles } from "../core/config.js";
import { formatearTasa } from "../core/utils.js";
import { obtenerTasa } from "../services/rates.js";
import { getCountryLabel, getCurrencyShortLabel, getFlagLabel, getRouteLabel } from "../core/labels.js";
import { getQuoteSession, setQuoteSession, startQuoteModule, resetQuoteSession } from "../state/quoteSession.js";
import { obtenerBCV } from "../services/rates.js";
import { renderQuoteHub } from "./quoteHub.js";

export function renderQuoteScreen(container) {
  if (!container) return;

  const session = getQuoteSession();

  if (!session.module || session.step === "home") {
    renderQuoteHub(container, () => {
        renderQuoteScreen(container);
    });
    return;
    }

  if (session.module === QUOTE_MODULES.REFERENCES) {
  renderReferencesScreen(container, session);
  return;
}

if (session.module === QUOTE_MODULES.RATE) {
  renderRateScreen(container, session);
  return;
}

if (session.module === QUOTE_MODULES.REMITTANCE) {
  renderRemittanceScreen(container, session);
  return;
}

function renderRemittanceScreen(container, session) {
  if (session.step === "origin") {
    renderCountrySelectionScreen(container, {
      eyebrow: "Cotizar remesa",
      title: "¿Desde dónde envía el cliente?",
      description: "Selecciona el país de origen de la operación.",
      countries: paisesDisponibles,
      onSelect: (code) => {
        setQuoteSession({
          origen: code,
          destino: null,
          remittanceMode: null,
          step: "destination",
        });
        renderQuoteScreen(container);
      },
    });
    return;
  }

  if (session.step === "destination") {
    const origenLabel = getCountryLabel(session.origen);

    renderCountrySelectionScreen(container, {
      eyebrow: "Cotizar remesa",
      title: "¿Dónde recibe el cliente?",
      description: `Origen seleccionado: ${origenLabel}.`,
      countries: paisesDisponibles.filter((p) => p.codigo !== session.origen),
      onSelect: (code) => {
        setQuoteSession({
          destino: code,
          remittanceMode: null,
          step: "remittance_mode",
        });
        renderQuoteScreen(container);
      },
    });
    return;
  }

  if (session.step === "remittance_mode") {
    renderRemittanceModeScreen(container, session);
    return;
  }

  renderComingSoon(container, session);
}

function renderRemittanceModeScreen(container, session) {
  const origenLabel = getCountryLabel(session.origen);
  const destinoLabel = getCountryLabel(session.destino);
  const origenCurrency = getCurrencyShortLabel(session.origen);
  const destinoCurrency = getCurrencyShortLabel(session.destino);
  const routeLabel = getRouteLabel(session.origen, session.destino);

  const options = getRemittanceModeOptions({
    origenLabel,
    destinoLabel,
    origenCurrency,
    destinoCurrency,
    destino: session.destino,
  });

  container.innerHTML = renderScreenShell({
    eyebrow: "Cotizar remesa",
    title: routeLabel,
    description: "¿Qué quieres cotizar para esta operación?",
    body: `
      <div class="mb-4 rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300">
        <div class="text-[11px] font-bold uppercase tracking-[0.22em] text-brandTeal">
          Ruta seleccionada
        </div>
        <div class="mt-2 text-lg font-black text-white">
          ${routeLabel}
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3">
        ${options.map(renderRemittanceModeOption).join("")}
      </div>
    `,
  });

  bindCommonNavigation(container);

  container.querySelectorAll("[data-remittance-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setQuoteSession({
        remittanceMode: btn.dataset.remittanceMode,
        step: "amount",
      });

      renderQuoteScreen(container);
    });
  });
}

function renderRemittanceModeOption(option) {
  return `
    <button
      type="button"
      data-remittance-mode="${option.id}"
      class="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-left shadow-xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-brandTeal/50 hover:bg-white/[0.10]"
    >
      <div class="relative flex items-center justify-between gap-4">
        <div>
          <span class="rounded-full bg-brandTeal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brandTeal">
            Cotización
          </span>

          <h3 class="mt-3 text-lg font-black tracking-tight text-white">
            ${option.title}
          </h3>

          <p class="mt-1 text-sm leading-relaxed text-slate-300">
            ${option.description}
          </p>
        </div>

        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-lg text-white transition group-hover:bg-brandTeal group-hover:text-slate-950">
          →
        </div>
      </div>
    </button>
  `;
}

renderComingSoon(container, session);

function renderRateScreen(container, session) {
  if (session.step === "origin") {
    renderCountrySelectionScreen(container, {
      eyebrow: "Consultar tasa",
      title: "¿Desde dónde cotizas?",
      description: "Selecciona el país de origen de la tasa solicitada.",
      countries: paisesDisponibles,
      onSelect: (code) => {
        setQuoteSession({
          origen: code,
          destino: null,
          step: "destination",
        });
        renderQuoteScreen(container);
      },
    });
    return;
  }

  if (session.step === "destination") {
    const origenLabel = getCountryLabel(session.origen);

    renderCountrySelectionScreen(container, {
      eyebrow: "Consultar tasa",
      title: "¿Hacia dónde cotizas?",
      description: `Origen seleccionado: ${origenLabel}.`,
      countries: paisesDisponibles.filter((p) => p.codigo !== session.origen),
      onSelect: (code) => {
        setQuoteSession({
          destino: code,
          step: "rate_result",
        });
        renderQuoteScreen(container);
      },
    });
    return;
  }

  if (session.step === "rate_result") {
    renderRateResultScreen(container, session);
    return;
  }

}

function renderCountrySelectionScreen(container, { eyebrow, title, description, countries, onSelect }) {
  container.innerHTML = renderScreenShell({
    eyebrow,
    title,
    description,
    body: `
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${countries.map(renderCountryOption).join("")}
      </div>
    `,
  });

  bindCommonNavigation(container);

  container.querySelectorAll("[data-country-code]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.dataset.countryCode;
      if (typeof onSelect === "function") onSelect(code);
    });
  });
}

function renderCountryOption(country) {
  const code = country.codigo;
  const flag = getFlagLabel(code);
  const countryName = getCountryLabel(code);
  const currency = getCurrencyShortLabel(code);

  return `
    <button
      type="button"
      data-country-code="${code}"
      class="group w-full rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left shadow-xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-brandTeal/50 hover:bg-white/[0.10]"
    >
      <div class="flex items-center gap-3">
        <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">
          ${flag}
        </div>

        <div class="min-w-0 flex-1">
          <div class="text-base font-black text-white">
            ${countryName}
          </div>
          <div class="mt-0.5 text-xs text-slate-400">
            ${currency}
          </div>
        </div>

        <div class="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/10 text-white transition group-hover:bg-brandTeal group-hover:text-slate-950">
          →
        </div>
      </div>
    </button>
  `;
}

async function renderRateResultScreen(container, session) {
  const routeLabel = getRouteLabel(session.origen, session.destino);

  container.innerHTML = renderScreenShell({
    eyebrow: "Tasa de cambio",
    title: routeLabel,
    description: "Consultando la tasa guardada para este cruce.",
    body: `
      <div class="rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-center shadow-xl">
        <div class="mx-auto h-10 w-10 rounded-full border border-brandTeal/30 border-t-brandTeal animate-spin"></div>
        <p class="mt-4 text-sm text-slate-300">Cargando tasa...</p>
      </div>
    `,
  });

  bindCommonNavigation(container);

  try {
    const data = await obtenerTasa(session.origen, session.destino);
    const tasa = Number(data?.tasa);
    const fecha = data?.fecha ? new Date(data.fecha) : null;

    if (!Number.isFinite(tasa) || tasa <= 0) {
      renderRateError(container, routeLabel);
      return;
    }

    const tasaFmt = formatearTasa(tasa);
    const formattedDate = fecha && !Number.isNaN(fecha.getTime())
      ? fecha.toLocaleString("es-AR")
      : "Fecha no disponible";

    container.innerHTML = renderScreenShell({
      eyebrow: "Tasa de cambio",
      title: routeLabel,
      description: "Tasa comercial lista para responder al cliente.",
      body: `
        <div class="rounded-[2rem] border border-brandTeal/20 bg-gradient-to-b from-white/[0.10] to-white/[0.04] p-6 text-center shadow-2xl">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
            Tasa actual
          </p>

          <div class="mt-4 text-6xl font-black tracking-tight text-white">
            ${tasaFmt}
          </div>

          <p class="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-slate-300">
            Tasa sujeta a cambio sin previo aviso.
          </p>

          <div class="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
            Actualizado: ${formattedDate}
          </div>

          <button
            type="button"
            data-rate-whatsapp="1"
            class="mt-5 w-full rounded-2xl bg-brandTeal px-5 py-4 text-sm font-black text-slate-950 shadow-xl transition hover:brightness-110"
          >
            Enviar por WhatsApp
          </button>

          <p class="mt-3 text-xs text-slate-500">
            La imagen premium se conectará en el siguiente bloque.
          </p>
        </div>
      `,
    });

    bindCommonNavigation(container);
  } catch (err) {
    console.error("[quoteScreens] renderRateResultScreen:", err);
    renderRateError(container, routeLabel);
  }
}

function renderRateError(container, routeLabel) {
  container.innerHTML = renderScreenShell({
    eyebrow: "Tasa de cambio",
    title: routeLabel,
    description: "No se pudo cargar la tasa de este cruce.",
    body: `
      <div class="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-center text-sm text-red-100">
        No hay una tasa válida disponible para este cruce.
      </div>
    `,
  });

  bindCommonNavigation(container);
}

renderComingSoon(container, session);
}

function renderScreenShell({ eyebrow, title, description, body }) {
  return `
    <section class="relative w-full max-h-[calc(100svh-2rem)] overflow-y-auto overflow-x-hidden rounded-[2rem] border border-slate-800 bg-slate-950 px-4 py-5 text-white shadow-2xl sm:px-6 sm:py-7">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brandBlue/25 blur-3xl"></div>
        <div class="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-brandTeal/10 blur-3xl"></div>
        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,_transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,_transparent_1px)] bg-[size:38px_38px] opacity-20"></div>
      </div>

      <div class="relative">
        <div class="sticky top-0 z-20 -mx-1 mb-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/85 p-1 backdrop-blur-xl">
          <button
            type="button"
            data-quote-back="1"
            class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/15"
          >
            ← Volver
          </button>

          <button
            type="button"
            data-quote-home="1"
            class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/15"
          >
            Inicio
          </button>
        </div>

        <div class="mb-6 text-center">
          <p class="text-[11px] uppercase tracking-[0.34em] text-brandTeal">
            ${eyebrow}
          </p>
          <h2 class="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
            ${title}
          </h2>
          <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
            ${description}
          </p>
        </div>

        ${body}
      </div>
    </section>
  `;
}

function renderReferencesScreen(container, session) {
  if (session.step === "reference_result") {
    renderReferenceResultScreen(container, session);
    return;
  }

  if (session.step !== "reference_type") {
    renderComingSoon(container, session);
    return;
  }

  const options = getReferenceOptions();

  container.innerHTML = renderScreenShell({
    eyebrow: "Referencias",
    title: "¿Qué referencia quieres consultar?",
    description: "Selecciona la referencia que necesitas responderle al cliente.",
    body: `
      <div class="grid grid-cols-1 gap-3">
        ${options.map(renderReferenceOption).join("")}
      </div>
    `,
  });

  bindCommonNavigation(container);

  container.querySelectorAll("[data-reference-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setQuoteSession({
        referenceType: btn.dataset.referenceType,
        step: "reference_result",
      });

      renderQuoteScreen(container);
    });
  });
}

function renderReferenceOption(option) {
  return `
    <button
      type="button"
      data-reference-type="${option.id}"
      class="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-left shadow-xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-brandTeal/50 hover:bg-white/[0.10]"
    >
      <div class="relative flex items-center justify-between gap-4">
        <div>
          <span class="rounded-full bg-brandTeal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brandTeal">
            BCV
          </span>

          <h3 class="mt-3 text-xl font-black tracking-tight text-white">
            ${option.title}
          </h3>

          <p class="mt-1 text-sm leading-relaxed text-slate-300">
            ${option.description}
          </p>
        </div>

        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-lg text-white transition group-hover:bg-brandTeal group-hover:text-slate-950">
          →
        </div>
      </div>
    </button>
  `;
}

async function renderReferenceResultScreen(container, session) {
  const isUsd = session.referenceType === "bcv_usd";
  const title = isUsd ? "Dólar BCV" : "Euro BCV";
  const field = isUsd ? "usd" : "eur";

  container.innerHTML = renderScreenShell({
    eyebrow: "Referencia BCV",
    title: "Consultando referencia",
    description: "Leyendo la referencia guardada desde el sistema.",
    body: `
      <div class="rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-center shadow-xl">
        <div class="mx-auto h-10 w-10 rounded-full border border-brandTeal/30 border-t-brandTeal animate-spin"></div>
        <p class="mt-4 text-sm text-slate-300">Cargando ${title}...</p>
      </div>
    `,
  });

  bindCommonNavigation(container);

  try {
    const bcv = await obtenerBCV();
    const value = Number(bcv?.[field]);
    const fecha = bcv?.fecha ? new Date(bcv.fecha) : null;

    if (!Number.isFinite(value) || value <= 0) {
      renderReferenceError(container, title);
      return;
    }

    const formattedValue = new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);

    const formattedDate = fecha && !Number.isNaN(fecha.getTime())
      ? fecha.toLocaleString("es-AR")
      : "Fecha no disponible";

    container.innerHTML = renderScreenShell({
      eyebrow: "Referencia BCV",
      title,
      description: "Referencia actual disponible para responder al cliente.",
      body: `
        <div class="rounded-[2rem] border border-brandTeal/20 bg-gradient-to-b from-white/[0.10] to-white/[0.04] p-6 text-center shadow-2xl">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
            Valor actual
          </p>

          <div class="mt-4 text-5xl font-black tracking-tight text-white">
            ${formattedValue}
          </div>

          <p class="mt-2 text-base text-slate-300">
            bolívares
          </p>

          <div class="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
            Actualizado: ${formattedDate}
          </div>

          <button
            type="button"
            data-reference-whatsapp="1"
            class="mt-5 w-full rounded-2xl bg-brandTeal px-5 py-4 text-sm font-black text-slate-950 shadow-xl transition hover:brightness-110"
          >
            Enviar por WhatsApp
          </button>

          <p class="mt-3 text-xs text-slate-500">
            La imagen premium se conectará en el siguiente bloque.
          </p>
        </div>
      `,
    });

    bindCommonNavigation(container);
  } catch (err) {
    console.error("[quoteScreens] renderReferenceResultScreen:", err);
    renderReferenceError(container, title);
  }
}

function renderReferenceError(container, title) {
  container.innerHTML = renderScreenShell({
    eyebrow: "Referencia BCV",
    title,
    description: "No se pudo cargar esta referencia.",
    body: `
      <div class="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-center text-sm text-red-100">
        No hay una referencia válida disponible en este momento.
      </div>
    `,
  });

  bindCommonNavigation(container);
}

function renderComingSoon(container, session) {
  container.innerHTML = renderScreenShell({
    eyebrow: "En construcción",
    title: "Módulo preparado",
    description: `Pantalla pendiente para: ${session.module || "sin módulo"} / ${session.step || "sin paso"}.`,
    body: `
      <div class="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-center text-sm text-slate-300">
        Esta sección será conectada en el siguiente bloque.
      </div>
    `,
  });

  bindCommonNavigation(container);
}

function bindCommonNavigation(container) {
  container.querySelector("[data-quote-home]")?.addEventListener("click", () => {
    resetQuoteSession();
    renderQuoteScreen(container);
  });

  container.querySelector("[data-quote-back]")?.addEventListener("click", () => {
    const session = getQuoteSession();

    if (session.step === "reference_type") {
      resetQuoteSession();
      renderQuoteScreen(container);
      return;
    }

    if (session.module === QUOTE_MODULES.REFERENCES) {
  startQuoteModule(QUOTE_MODULES.REFERENCES);
  renderQuoteScreen(container);
  return;
}

if (session.module === QUOTE_MODULES.RATE) {
  if (session.step === "destination") {
    startQuoteModule(QUOTE_MODULES.RATE);
    renderQuoteScreen(container);
    return;
  }

  if (session.step === "rate_result") {
    setQuoteSession({
      destino: null,
      step: "destination",
    });
    renderQuoteScreen(container);
    return;
  }
}

if (session.module === QUOTE_MODULES.REMITTANCE) {
  if (session.step === "destination") {
    startQuoteModule(QUOTE_MODULES.REMITTANCE);
    renderQuoteScreen(container);
    return;
  }

  if (session.step === "remittance_mode") {
    setQuoteSession({
      destino: null,
      remittanceMode: null,
      step: "destination",
    });
    renderQuoteScreen(container);
    return;
  }

  if (session.step === "amount") {
    setQuoteSession({
      remittanceMode: null,
      step: "remittance_mode",
    });
    renderQuoteScreen(container);
    return;
  }
}

resetQuoteSession();
renderQuoteScreen(container);
  });
}