// public/src/ui/quoteScreens.js

import {
  QUOTE_MODULES,
  REMITTANCE_MODES,
  BCV_REFERENCE_TYPES,
  getReferenceOptions,
  getRemittanceModeOptions,
  getBcvReferenceOptions,
} from "../core/quoteModes.js";

import { toggleQuoteTheme, withQuoteTheme } from "../state/quoteTheme.js";
import { getQuoteThemeClasses } from "./quoteThemeClasses.js";
import {
  getQuoteActionButtonClass,
  getQuoteIconBoxClass,
  getQuoteSelectionCardClass,
} from "./quoteComponents.js";
import { renderQuoteShell } from "./quoteShell.js";

import { paisesDisponibles } from "../core/config.js";
import {
  formatearResultadoRaw,
  formatearTasa,
  limpiarResultadoRaw,
  normalizarTasaOperativa,
  redondearPorMoneda,
} from "../core/utils.js";
import { calcularCruce, obtenerTasaVisible } from "../core/fx.js";
import { obtenerBCV, obtenerTasa } from "../services/rates.js";
import {
  getCountryLabel,
  getCurrencyShortLabel,
  getFlagLabel,
  getRouteLabel,
} from "../core/labels.js";
import {
  getQuoteSession,
  setQuoteSession,
  startQuoteModule,
  resetQuoteSession,
} from "../state/quoteSession.js";
import { renderQuoteHub } from "./quoteHub.js";

import {
  buildReferenceSharePayload,
  buildRateSharePayload,
  buildRemittanceSharePayload,
} from "../core/sharePayload.js";
import { sharePremiumPayload } from "./sharing.js";

export function renderQuoteScreen(container) {
  if (!container) return;

  const session = getQuoteSession();

  if (!session.module || session.step === "home") {
    renderQuoteHub(container, () => renderQuoteScreen(container));
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

  renderComingSoon(container, session);
}

// =====================================================
// SHELL
// =====================================================

function renderScreenShell({ eyebrow, title, description, body }) {
  const themeClasses = getQuoteThemeClasses();

  return renderQuoteShell({
    eyebrow,
    title,
    description,
    body,
    topbar: `
      <div class="shrink-0 -mx-1 mb-4 flex items-center justify-between gap-2 rounded-2xl border p-1 backdrop-blur-xl sm:sticky sm:top-0 sm:z-20 ${themeClasses.topbar}">
        <button
          type="button"
          data-quote-back="1"
          class="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${themeClasses.topbarButton}"
        >
          ← Volver
        </button>

        <div class="flex items-center gap-2">
          <button
            type="button"
            data-quote-theme-toggle="1"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${themeClasses.themeButton}"
          >
            ${themeClasses.isLight ? "Modo oscuro" : "Modo claro"}
          </button>

          <button
            type="button"
            data-quote-home="1"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${themeClasses.topbarButton}"
          >
            Inicio
          </button>
        </div>
      </div>
    `,
  });
}

function bindCommonNavigation(container) {

  container
    .querySelector("[data-quote-theme-toggle]")
    ?.addEventListener("click", () => {
      toggleQuoteTheme();
      renderQuoteScreen(container);
    });

  container
    .querySelector("[data-quote-home]")
    ?.addEventListener("click", () => {
      resetQuoteSession();
      renderQuoteScreen(container);
    });

  container
    .querySelector("[data-quote-back]")
    ?.addEventListener("click", () => {
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

        if (session.step === "bcv_reference") {
          setQuoteSession({
            remittanceMode: null,
            bcvReferenceType: null,
            customBcvRate: null,
            step: "remittance_mode",
          });
          renderQuoteScreen(container);
          return;
        }

        if (session.step === "custom_bcv_rate") {
          setQuoteSession({
            bcvReferenceType: null,
            customBcvRate: null,
            step: "bcv_reference",
          });
          renderQuoteScreen(container);
          return;
        }

        if (session.step === "amount") {
          if (session.remittanceMode === REMITTANCE_MODES.RECEIVE_BCV_USD) {
            setQuoteSession({
              amount: null,
              step: "bcv_reference",
            });
            renderQuoteScreen(container);
            return;
          }

          setQuoteSession({
            remittanceMode: null,
            amount: null,
            step: "remittance_mode",
          });
          renderQuoteScreen(container);
          return;
        }

        if (session.step === "result") {
          setQuoteSession({
            amount: null,
            result: null,
            step: "amount",
          });
          renderQuoteScreen(container);
          return;
        }
      }

      resetQuoteSession();
      renderQuoteScreen(container);
    });
}

// =====================================================
// COMMON COUNTRY SELECTION
// =====================================================

function renderCountrySelectionScreen(
  container,
  { eyebrow, title, description, countries, onSelect },
) {
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
  const themeClasses = getQuoteThemeClasses();
  const code = country.codigo;
  const flag = getFlagLabel(code);
  const countryName = getCountryLabel(code);
  const currency = getCurrencyShortLabel(code);

  return `
    <button
      type="button"
      data-country-code="${code}"
      class="${getQuoteSelectionCardClass(themeClasses, "p-4")}"
    >
      <div class="flex items-center gap-3">
        <div class="${getQuoteIconBoxClass(themeClasses, "h-11 w-11", "text-xl")}">
          ${flag}
        </div>

        <div class="min-w-0 flex-1">
          <div class="text-base font-black ${themeClasses.primaryText}">
            ${countryName}
          </div>
          <div class="mt-0.5 text-xs ${themeClasses.secondaryText}">
            ${currency}
          </div>
        </div>

        <div class="grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-lg transition ${themeClasses.arrowBox}">
          →
        </div>
      </div>
    </button>
  `;
}

// =====================================================
// REFERENCES
// =====================================================

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
    description:
      "Selecciona la referencia que necesitas responderle al cliente.",
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
  const themeClasses = getQuoteThemeClasses();

  return `
    <button
      type="button"
      data-reference-type="${option.id}"
      class="${getQuoteSelectionCardClass(themeClasses, "p-5")}"
    >
      <div class="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#23d4c3]/12 to-transparent opacity-0 transition group-hover:opacity-100"></div>

      <div class="relative flex items-center justify-between gap-4">
        <div class="min-w-0 flex-1">
          <span class="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${themeClasses.badge}">
            BCV
          </span>

          <h3 class="mt-3 text-xl font-black tracking-tight ${themeClasses.cardTitle}">
            ${option.title}
          </h3>

          <p class="mt-2 text-sm leading-relaxed ${themeClasses.cardDescription}">
            ${option.description}
          </p>
        </div>

        <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-black transition ${themeClasses.arrowBox}">
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
  const themeClasses = getQuoteThemeClasses();

  container.innerHTML = renderScreenShell({
    eyebrow: "Referencia BCV",
    title: "Consultando referencia",
    description: "Leyendo la referencia guardada desde el sistema.",
    body: `
      <div class="rounded-3xl border ${themeClasses.panel} p-6 text-center">
        <div class="mx-auto h-10 w-10 rounded-full border border-[#22d8cb]/30 border-t-[#22d8cb] animate-spin"></div>
        <p class="mt-4 text-sm ${themeClasses.secondaryText}">Cargando ${title}...</p>
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

    const formattedDate =
      fecha && !Number.isNaN(fecha.getTime())
        ? fecha.toLocaleString("es-AR")
        : "Fecha no disponible";

    container.innerHTML = renderScreenShell({
      eyebrow: "Referencia BCV",
      title,
      description: "Referencia actual disponible para responder al cliente.",
      body: `
        <div class="rounded-[2rem] border ${themeClasses.resultPanel} p-6 text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] ${themeClasses.valueLabel}">
            Valor actual
          </p>

          <div class="mt-4 text-5xl font-black tracking-tight ${themeClasses.valueNumber}">
            ${formattedValue}
          </div>

          <p class="mt-2 text-base ${themeClasses.valueUnit}">
            bolívares
          </p>

          <div class="mt-6 rounded-2xl border ${themeClasses.metaBox} px-4 py-3 text-sm">
            Actualizado: ${formattedDate}
          </div>

          <button
            type="button"
            data-reference-whatsapp="1"
            class="${getQuoteActionButtonClass(themeClasses, "primary", "mt-5")}"
          >
            Enviar por WhatsApp
          </button>
        </div>
      `,
    });

    bindCommonNavigation(container);

    container
      .querySelector("[data-reference-whatsapp]")
      ?.addEventListener("click", async () => {
        const payload = buildReferenceSharePayload({
          referenceTitle: title,
          value,
          updatedAt: formattedDate,
        });

        await sharePremiumPayload(withQuoteTheme(payload));
      });
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

  bindCommonNavigation(container);
}

// =====================================================
// RATE
// =====================================================

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

  renderComingSoon(container, session);
}

async function renderRateResultScreen(container, session) {
  const routeLabel = getRouteLabel(session.origen, session.destino);
  const themeClasses = getQuoteThemeClasses();

  container.innerHTML = renderScreenShell({
    eyebrow: "Tasa de cambio",
    title: routeLabel,
    description: "Consultando la tasa guardada para este cruce.",
    body: `
      <div class="rounded-3xl border ${themeClasses.panel} p-6 text-center">
        <div class="mx-auto h-10 w-10 rounded-full border border-[#22d8cb]/30 border-t-[#22d8cb] animate-spin"></div>
        <p class="mt-4 text-sm ${themeClasses.secondaryText}">Cargando tasa...</p>
      </div>
    `,
  });

  bindCommonNavigation(container);

  try {
    const data = await obtenerTasa(session.origen, session.destino);
    const tasaInterna = Number(data?.tasa);
    const tasaVisible = obtenerTasaVisible(
      session.origen,
      session.destino,
      tasaInterna,
    );
    const fecha = data?.fecha ? new Date(data.fecha) : null;

    if (!Number.isFinite(tasaVisible) || tasaVisible <= 0) {
      renderRateError(container, routeLabel);
      return;
    }

    const tasaFmt = formatearTasa(tasaVisible);
    const formattedDate =
      fecha && !Number.isNaN(fecha.getTime())
        ? fecha.toLocaleString("es-AR")
        : "Fecha no disponible";

    container.innerHTML = renderScreenShell({
      eyebrow: "Tasa de cambio",
      title: routeLabel,
      description: "Tasa comercial lista para responder al cliente.",
      body: `
        <div class="rounded-[2rem] border ${themeClasses.resultPanel} p-6 text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] ${themeClasses.valueLabel}">
            Tasa actual
          </p>

          <div class="mt-4 text-6xl font-black tracking-tight ${themeClasses.valueNumber}">
            ${tasaFmt}
          </div>

          <p class="mx-auto mt-5 max-w-sm text-sm leading-relaxed ${themeClasses.secondaryText}">
            Tasa sujeta a cambio sin previo aviso.
          </p>

          <div class="mt-6 rounded-2xl border ${themeClasses.metaBox} px-4 py-3 text-sm">
            Actualizado: ${formattedDate}
          </div>

          <button
            type="button"
            data-rate-whatsapp="1"
            class="${getQuoteActionButtonClass(themeClasses, "primary", "mt-5")}"
          >
            Enviar por WhatsApp
          </button>
        </div>
      `,
    });

    bindCommonNavigation(container);

    container
      .querySelector("[data-rate-whatsapp]")
      ?.addEventListener("click", async () => {
        const payload = buildRateSharePayload({
          origen: session.origen,
          destino: session.destino,
          tasa: tasaFmt,
          updatedAt: formattedDate,
        });

        await sharePremiumPayload(withQuoteTheme(payload));
      });
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

// =====================================================
// REMITTANCE
// =====================================================

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
          bcvReferenceType: null,
          customBcvRate: null,
          amount: null,
          result: null,
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
          bcvReferenceType: null,
          customBcvRate: null,
          amount: null,
          result: null,
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

  if (session.step === "bcv_reference") {
    renderBcvReferenceSelectionScreen(container, session);
    return;
  }

  if (session.step === "custom_bcv_rate") {
    renderCustomBcvRateScreen(container, session);
    return;
  }

  if (session.step === "amount") {
    renderRemittanceAmountScreen(container, session);
    return;
  }

  if (session.step === "result") {
    renderRemittanceResultScreen(container, session);
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
  const themeClasses = getQuoteThemeClasses();

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
      <div class="mb-4 rounded-3xl border ${themeClasses.softPanel} p-4 text-sm">
        <div class="text-[11px] font-bold uppercase tracking-[0.22em] text-brandTeal">
          Ruta seleccionada
        </div>
        <div class="mt-2 text-lg font-black ${themeClasses.primaryText}">
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
      const remittanceMode = btn.dataset.remittanceMode;
      const nextStep =
        remittanceMode === REMITTANCE_MODES.RECEIVE_BCV_USD
          ? "bcv_reference"
          : "amount";

      setQuoteSession({
        remittanceMode,
        bcvReferenceType: null,
        customBcvRate: null,
        amount: null,
        result: null,
        step: nextStep,
      });

      renderQuoteScreen(container);
    });
  });
}

function renderRemittanceModeOption(option) {
  const themeClasses = getQuoteThemeClasses();

  return `
    <button
      type="button"
      data-remittance-mode="${option.id}"
      class="${getQuoteSelectionCardClass(themeClasses, "p-5")}"
    >
      <div class="relative flex items-center justify-between gap-4">
        <div class="min-w-0 flex-1">
          <span class="rounded-full bg-[#21d9c6]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#12cfc0]">
            Cotización
          </span>

          <h3 class="mt-3 text-lg font-black tracking-tight ${themeClasses.primaryText}">
            ${option.title}
          </h3>

          <p class="mt-1 text-sm leading-relaxed ${themeClasses.secondaryText}">
            ${option.description}
          </p>
        </div>

        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg transition ${themeClasses.arrowBox}">
          →
        </div>
      </div>
    </button>
  `;
}

function renderBcvReferenceSelectionScreen(container, session) {
  const routeLabel = getRouteLabel(session.origen, session.destino);
  const options = getBcvReferenceOptions();

  container.innerHTML = renderScreenShell({
    eyebrow: "Cotización al BCV",
    title: "¿Qué referencia BCV vas a usar?",
    description: "Selecciona la referencia para convertir dólares a bolívares.",
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
        ${options.map(renderBcvReferenceOption).join("")}
      </div>
    `,
  });

  bindCommonNavigation(container);

  container.querySelectorAll("[data-bcv-reference]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const bcvReferenceType = btn.dataset.bcvReference;
      const nextStep =
        bcvReferenceType === BCV_REFERENCE_TYPES.CUSTOM
          ? "custom_bcv_rate"
          : "amount";

      setQuoteSession({
        bcvReferenceType,
        customBcvRate: null,
        amount: null,
        result: null,
        step: nextStep,
      });

      renderQuoteScreen(container);
    });
  });
}

function renderBcvReferenceOption(option) {
  const themeClasses = getQuoteThemeClasses();

  return `
    <button
      type="button"
      data-bcv-reference="${option.id}"
      class="${getQuoteSelectionCardClass(themeClasses, "p-5")}"
    >
      <div class="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#23d4c3]/12 to-transparent opacity-0 transition group-hover:opacity-100"></div>

      <div class="relative flex items-center justify-between gap-4">
        <div class="min-w-0 flex-1">
          <span class="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${themeClasses.badge}">
            BCV
          </span>

          <h3 class="mt-3 text-xl font-black tracking-tight ${themeClasses.cardTitle}">
            ${option.title}
          </h3>

          <p class="mt-2 text-sm leading-relaxed ${themeClasses.cardDescription}">
            ${option.description}
          </p>
        </div>

        <div class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-black transition ${themeClasses.arrowBox}">
          →
        </div>
      </div>
    </button>
  `;
}

function renderCustomBcvRateScreen(container, session) {
  const routeLabel = getRouteLabel(session.origen, session.destino);
  const themeClasses = getQuoteThemeClasses();

  container.innerHTML = renderScreenShell({
    eyebrow: "Precio personalizado",
    title: "Ingresa la referencia BCV",
    description: "Usa una referencia manual para esta cotización.",
    body: `
      <div class="mb-4 rounded-3xl border ${themeClasses.softPanel} p-4 text-sm">
        <div class="text-[11px] font-bold uppercase tracking-[0.22em] text-brandTeal">
          Ruta seleccionada
        </div>
        <div class="mt-2 text-lg font-black ${themeClasses.primaryText}">
          ${routeLabel}
        </div>
      </div>

      <div class="rounded-[2rem] border ${themeClasses.cardPanel} p-5 shadow-xl">
        <label for="customBcvRateInput" class="block text-sm font-bold ${themeClasses.labelText}">
          Precio BCV personalizado
        </label>

        <div class="mt-3 flex items-center gap-3 rounded-3xl border ${themeClasses.inputShell} px-4 py-3">
          <input
            id="customBcvRateInput"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="Ej: 487.12"
            class="min-w-0 flex-1 bg-transparent text-2xl font-black ${themeClasses.primaryText} outline-none placeholder:text-slate-500"
          />
          <span class="shrink-0 rounded-2xl px-3 py-2 text-xs font-bold ${themeClasses.chip}">
            bolívares
          </span>
        </div>

        <p id="customBcvRateHelp" class="mt-3 text-xs leading-relaxed ${themeClasses.mutedText}">
          Ingresa cuántos bolívares equivale 1 dólar para esta cotización.
        </p>

        <button
          type="button"
          data-custom-bcv-next="1"
          class="${getQuoteActionButtonClass(themeClasses, "continue", "mt-5")}"
          disabled
        >
          Continuar
        </button>
      </div>
    `,
  });

  bindCommonNavigation(container);

  const input = container.querySelector("#customBcvRateInput");
  const btn = container.querySelector("[data-custom-bcv-next]");
  const help = container.querySelector("#customBcvRateHelp");

  input?.addEventListener("input", () => {
    const clean = normalizeAmountInput(input.value);
    if (input.value !== clean) input.value = clean;

    const value = parseAmountInput(clean);
    const valid = Number.isFinite(value) && value > 0;

    if (btn) btn.disabled = !valid;

    if (help) {
      help.textContent = valid
        ? "Referencia válida. Continuaremos con el monto en dólares."
        : "Ingresa una referencia válida en bolívares.";
    }
  });

  const continueWithCustomBcvRate = () => {
    if (btn?.disabled) return;

    const value = parseAmountInput(input?.value || "");
    if (!Number.isFinite(value) || value <= 0) return;

    setQuoteSession({
      customBcvRate: value,
      amount: null,
      result: null,
      step: "amount",
    });

    renderQuoteScreen(container);
  };

  input?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    continueWithCustomBcvRate();
  });

  btn?.addEventListener("click", continueWithCustomBcvRate);

  setTimeout(() => input?.focus(), 80);
}

function renderRemittanceAmountScreen(container, session) {
  const origenCurrency = getCurrencyShortLabel(session.origen);
  const destinoCurrency = getCurrencyShortLabel(session.destino);
  const routeLabel = getRouteLabel(session.origen, session.destino);
  const themeClasses = getQuoteThemeClasses();

  const amountConfig = getAmountScreenConfig(session, {
    origenCurrency,
    destinoCurrency,
  });

  container.innerHTML = renderScreenShell({
    eyebrow: "Cotizar remesa",
    title: amountConfig.title,
    description: amountConfig.description,
    body: `
      <div class="mb-4 rounded-3xl border ${themeClasses.softPanel} p-4 text-sm">
        <div class="text-[11px] font-bold uppercase tracking-[0.22em] text-brandTeal">
          Ruta seleccionada
        </div>
        <div class="mt-2 text-lg font-black ${themeClasses.primaryText}">
          ${routeLabel}
        </div>
      </div>

      ${amountConfig.extraHtml || ""}

      <div class="rounded-[2rem] border ${themeClasses.cardPanel} p-5 shadow-xl">
        <label for="quoteAmountInput" class="block text-sm font-bold ${themeClasses.labelText}">
          ${amountConfig.label}
        </label>

        <div class="mt-3 flex items-center gap-3 rounded-3xl border ${themeClasses.inputShell} px-4 py-3">
          <input
            id="quoteAmountInput"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="Ingresa el monto"
            class="min-w-0 flex-1 bg-transparent text-2xl font-black ${themeClasses.primaryText} outline-none placeholder:text-slate-500"
          />
          <span class="shrink-0 rounded-2xl px-3 py-2 text-xs font-bold ${themeClasses.chip}">
            ${amountConfig.unit}
          </span>
        </div>

        <p id="quoteAmountHelp" class="mt-3 text-xs leading-relaxed ${themeClasses.mutedText}">
          ${amountConfig.help}
        </p>

        <button
          type="button"
          data-remittance-next="1"
          class="${getQuoteActionButtonClass(themeClasses, "continue", "mt-5")}"
          disabled
        >
          Continuar
        </button>
      </div>
    `,
  });

  bindCommonNavigation(container);

  const input = container.querySelector("#quoteAmountInput");
  const btn = container.querySelector("[data-remittance-next]");
  const help = container.querySelector("#quoteAmountHelp");

  input?.addEventListener("input", () => {
    const clean = normalizeAmountInput(input.value);
    if (input.value !== clean) input.value = clean;

    const amount = parseAmountInput(clean);
    const valid = Number.isFinite(amount) && amount > 0;

    if (btn) btn.disabled = !valid;

    if (help) {
      help.textContent = valid ? amountConfig.validHelp : amountConfig.help;
    }
  });

  const continueWithRemittanceAmount = () => {
    if (btn?.disabled) return;

    const amount = parseAmountInput(input?.value || "");
    if (!Number.isFinite(amount) || amount <= 0) return;

    setQuoteSession({
      amount,
      result: null,
      step: "result",
    });

    renderQuoteScreen(container);
  };

  input?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    continueWithRemittanceAmount();
  });

  btn?.addEventListener("click", continueWithRemittanceAmount);

  setTimeout(() => input?.focus(), 80);
}

function getAmountScreenConfig(session, { origenCurrency, destinoCurrency }) {
  if (session.remittanceMode === REMITTANCE_MODES.SEND_AMOUNT) {
    return {
        title: `¿Cuántos ${origenCurrency} quiere enviar el cliente?`,
        description: `Calcularemos cuántos ${destinoCurrency} recibe.`,
        label: `Monto a enviar en ${origenCurrency}`,
        unit: origenCurrency,
        help: `Ingresa el monto que el cliente tiene disponible para enviar.`,
        validHelp: `Listo. Calcularemos cuántos ${destinoCurrency} recibe el cliente.`,
        extraHtml: "",
        };
  }

    const themeClasses = getQuoteThemeClasses();

  if (session.remittanceMode === REMITTANCE_MODES.RECEIVE_AMOUNT) {
    return {
  title: `¿Cuántos ${destinoCurrency} quiere recibir el cliente?`,
  description: `Calcularemos cuántos ${origenCurrency} debe enviar.`,
  label: `Monto a recibir en ${destinoCurrency}`,
  unit: destinoCurrency,
  help: `Ingresa el monto que el cliente quiere que llegue en destino.`,
  validHelp: `Listo. Calcularemos cuántos ${origenCurrency} debe enviar el cliente.`,
  extraHtml: "",
};
  }

  if (session.remittanceMode === REMITTANCE_MODES.RECEIVE_BCV_USD) {
    const refLabel = getBcvReferenceLabel(session.bcvReferenceType);

    return {
  title: "¿Cuántos dólares quiere recibir el cliente?",
  description:
    "Calcularemos el equivalente en bolívares y cuánto debe enviar.",
  label: "Monto en dólares",
  unit: "dólares",
  help: `Referencia seleccionada: ${refLabel}. Ingresa el monto en dólares que el cliente quiere recibir.`,
  validHelp:
    "Listo. Calcularemos el equivalente en bolívares y cuánto debe enviar.",
  extraHtml: `
    <div class="mb-4 rounded-3xl border ${themeClasses.highlightedResultLine} p-4 text-sm">
        <div class="text-[11px] font-bold uppercase tracking-[0.22em] ${themeClasses.sectionEyebrow}">
        Referencia BCV
        </div>
        <div class="mt-2 text-lg font-black ${themeClasses.valueNumber}">
        ${refLabel}
        </div>
    </div>
   `,
    };
  }

  return {
    title: "Ingresa el monto",
    description: "Completa el monto para continuar.",
    label: "Monto",
    unit: "",
    help: "Ingresa un monto válido.",
    validHelp: "Monto válido.",
    extraHtml: "",
  };
}

// =====================================================
// REMITTANCE RESULT
// =====================================================

async function renderRemittanceResultScreen(container, session) {
  const routeLabel = getRouteLabel(session.origen, session.destino);
  const origenCurrency = getCurrencyShortLabel(session.origen);
  const destinoCurrency = getCurrencyShortLabel(session.destino);

  container.innerHTML = renderScreenShell({
    eyebrow: "Cotización",
    title: "Calculando resultado",
    description: "Estamos preparando la cotización con la tasa guardada.",
    body: `
      <div class="rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-center shadow-xl">
        <div class="mx-auto h-10 w-10 rounded-full border border-brandTeal/30 border-t-brandTeal animate-spin"></div>
        <p class="mt-4 text-sm text-slate-300">Calculando cotización...</p>
      </div>
    `,
  });

  bindCommonNavigation(container);

  try {
    const data = await obtenerTasa(session.origen, session.destino);
    const tasaInterna = Number(data?.tasa);
    const tasaVisible = obtenerTasaVisible(
      session.origen,
      session.destino,
      tasaInterna,
    );

    if (!Number.isFinite(tasaVisible) || tasaVisible <= 0) {
      renderRemittanceResultError(
        container,
        routeLabel,
        "No hay una tasa válida para este cruce.",
      );
      return;
    }

    const tasaOperativa = normalizarTasaOperativa(tasaVisible);

    if (!Number.isFinite(tasaOperativa.value) || tasaOperativa.value <= 0) {
      renderRemittanceResultError(
        container,
        routeLabel,
        "No hay una tasa operativa válida para este cruce.",
      );
      return;
    }

    const fecha = data?.fecha ? new Date(data.fecha) : null;
    const formattedDate =
      fecha && !Number.isNaN(fecha.getTime())
        ? fecha.toLocaleString("es-AR")
        : "Fecha no disponible";

    const amount = Number(session.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      renderRemittanceResultError(
        container,
        routeLabel,
        "El monto ingresado no es válido.",
      );
      return;
    }

    let result = null;

    if (session.remittanceMode === REMITTANCE_MODES.SEND_AMOUNT) {
      const recibeRaw = calcularCruce(
        session.origen,
        session.destino,
        "enviar",
        amount,
        tasaOperativa.value,
      );
      const recibe = limpiarResultadoRaw(recibeRaw);

      result = {
        type: "send_amount",
        routeLabel,
        tasaVisible: tasaOperativa.value,
        fecha: formattedDate,
        envia: {
          amount,
          currencyCode: session.origen,
          currencyLabel: origenCurrency,
        },
        recibe: {
          amount: recibe,
          currencyCode: session.destino,
          currencyLabel: destinoCurrency,
        },
      };
    }

    if (session.remittanceMode === REMITTANCE_MODES.RECEIVE_AMOUNT) {
      const debeEnviarRaw = calcularCruce(
        session.origen,
        session.destino,
        "llegar",
        amount,
        tasaOperativa.value,
      );
      const debeEnviar = limpiarResultadoRaw(debeEnviarRaw);

      result = {
        type: "receive_amount",
        routeLabel,
        tasaVisible: tasaOperativa.value,
        fecha: formattedDate,
        recibe: {
          amount,
          currencyCode: session.destino,
          currencyLabel: destinoCurrency,
        },
        debeEnviar: {
          amount: debeEnviar,
          currencyCode: session.origen,
          currencyLabel: origenCurrency,
        },
      };
    }

    if (session.remittanceMode === REMITTANCE_MODES.RECEIVE_BCV_USD) {
      const bcv = await obtenerBCV();
      const bcvRate = getSelectedBcvRate(session, bcv);

      if (!Number.isFinite(bcvRate) || bcvRate <= 0) {
        renderRemittanceResultError(
          container,
          routeLabel,
          "No hay una referencia BCV válida para esta cotización.",
        );
        return;
      }

      const vesObjetivo = amount * bcvRate;
      const debeEnviarRaw = calcularCruce(
        session.origen,
        "VES",
        "llegar",
        vesObjetivo,
        tasaOperativa.value,
      );
      const debeEnviar = limpiarResultadoRaw(debeEnviarRaw);

      result = {
        type: "receive_bcv_usd",
        routeLabel,
        tasaVisible: tasaOperativa.value,
        fecha: formattedDate,
        bcvReference: getBcvReferenceLabel(session.bcvReferenceType),
        bcvRate,
        usdDeseados: amount,
        vesObjetivo,
        debeEnviar: {
          amount: debeEnviar,
          currencyCode: session.origen,
          currencyLabel: origenCurrency,
        },
      };
    }

    if (!result) {
      renderRemittanceResultError(
        container,
        routeLabel,
        "No se pudo determinar el tipo de cotización.",
      );
      return;
    }

    setQuoteSession({ result });
    renderRemittanceResultView(container, result);
  } catch (err) {
    console.error("[quoteScreens] renderRemittanceResultScreen:", err);
    renderRemittanceResultError(
      container,
      routeLabel,
      `Ocurrió un error calculando la cotización: ${err?.message || "error desconocido"}`,
    );
  }
}

function renderRemittanceResultView(container, result) {
  container.innerHTML = renderScreenShell({
    eyebrow: "Cotización lista",
    title: "Resultado para el gestor",
    description: "Revisa la cotización antes de enviarla al cliente.",
    body: renderRemittanceResultBody(result),
  });

  bindCommonNavigation(container);
  hydrateVenezuelaUsdEquivalent(container);

  container
  .querySelector("[data-remittance-whatsapp]")
  ?.addEventListener("click", async () => {
    const shareResult = await enrichRemittanceResultForShare(result);
    const payload = buildRemittanceSharePayload(shareResult);
    await sharePremiumPayload(withQuoteTheme(payload));
  });

  container
    .querySelector("[data-result-back-to-amount]")
    ?.addEventListener("click", () => {
      setQuoteSession({
        amount: null,
        result: null,
        step: "amount",
      });

      renderQuoteScreen(container);
    });
}

function renderRemittanceResultBody(result) {
  const themeClasses = getQuoteThemeClasses();

  if (result.type === "send_amount") {
    const equivalente = renderVenezuelaUsdEquivalent(result.recibe);

    return `
      <div class="rounded-[2rem] border border-brandTeal/20 bg-gradient-to-b from-white/[0.10] to-white/[0.04] p-6 text-center shadow-2xl">
        <div class="text-[11px] font-bold uppercase tracking-[0.22em] text-brandTeal">
          ${result.routeLabel}
        </div>

        <div class="mt-6 grid grid-cols-1 gap-3 text-left">
          ${renderResultLine("El cliente envía", result.envia.amount, result.envia.currencyLabel)}
          ${renderResultLine("El cliente recibe", result.recibe.amount, result.recibe.currencyLabel, true)}
          ${equivalente}
        </div>

        ${renderResultMeta(result)}
        ${renderResultActions()}
      </div>
    `;
  }

  if (result.type === "receive_amount") {
    const equivalente = renderVenezuelaUsdEquivalent(result.recibe);

    return `
      <div class="rounded-[2rem] border border-brandTeal/20 bg-gradient-to-b from-white/[0.10] to-white/[0.04] p-6 text-center shadow-2xl">
        <div class="text-[11px] font-bold uppercase tracking-[0.22em] text-brandTeal">
          ${result.routeLabel}
        </div>

        <div class="mt-6 grid grid-cols-1 gap-3 text-left">
          ${renderResultLine("El cliente quiere recibir", result.recibe.amount, result.recibe.currencyLabel)}
          ${renderResultLine("Debe enviar", result.debeEnviar.amount, result.debeEnviar.currencyLabel, true)}
          ${equivalente}
        </div>

        ${renderResultMeta(result)}
        ${renderResultActions()}
      </div>
    `;
  }

  if (result.type === "receive_bcv_usd") {
    return `
      <div class="rounded-[2rem] border border-brandTeal/20 bg-gradient-to-b from-white/[0.10] to-white/[0.04] p-6 text-center shadow-2xl">
        <div class="text-[11px] font-bold uppercase tracking-[0.22em] text-brandTeal">
          ${result.routeLabel}
        </div>

        <div class="mt-6 grid grid-cols-1 gap-3 text-left">
          ${renderResultLine("El cliente quiere recibir", result.usdDeseados, "dólares")}
          ${renderResultLine("Equivalente en Venezuela", result.vesObjetivo, "bolívares")}
          ${renderResultLine("Debe enviar", result.debeEnviar.amount, result.debeEnviar.currencyLabel, true)}
        </div>

        <div class="mt-4 rounded-2xl border ${themeClasses.metaBox} px-4 py-3 text-sm ${themeClasses.metaText}">
  Referencia usada:
  <span class="font-bold ${themeClasses.valueNumber}">
    ${result.bcvReference}
  </span>
  · ${formatNumber(result.bcvRate)} bolívares
</div>

        ${renderResultMeta(result)}
        ${renderResultActions()}
      </div>
    `;
  }

  return `
    <div class="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-center text-sm text-red-100">
      No se pudo mostrar el resultado.
    </div>
  `;
}

function renderResultLine(label, amount, currencyLabel, highlight = false) {
  const themeClasses = getQuoteThemeClasses();

  return `
    <div class="rounded-3xl border ${
      highlight
        ? themeClasses.highlightedResultLine
        : themeClasses.resultLine
    } p-4">
      <div class="text-xs font-bold uppercase tracking-[0.18em] ${
        highlight
          ? themeClasses.sectionEyebrow
          : themeClasses.valueLabel
      }">
        ${label}
      </div>

      <div class="mt-2 text-2xl font-black ${themeClasses.valueNumber}">
        ${formatearResultadoRaw(amount)}
      </div>

      <div class="mt-1 text-sm ${themeClasses.valueUnit}">
        ${currencyLabel}
      </div>
    </div>
  `;
}

function renderResultMeta(result) {
  const themeClasses = getQuoteThemeClasses();

  return `
    <div class="mt-4 grid grid-cols-1 gap-2 text-sm ${themeClasses.metaText}">
      <div class="rounded-2xl border ${themeClasses.metaBox} px-4 py-3">
        Tasa aplicada:
        <span class="font-bold ${themeClasses.valueNumber}">
          ${formatearTasa(result.tasaVisible)}
        </span>
      </div>

      <div class="rounded-2xl border ${themeClasses.metaBox} px-4 py-3">
        Actualizado: ${result.fecha}
      </div>
    </div>
  `;
}

function renderResultActions() {
  const themeClasses = getQuoteThemeClasses();

  return `
    <button
      type="button"
      data-remittance-whatsapp="1"
      class="${getQuoteActionButtonClass(themeClasses, "primary", "mt-5")}"
    >
      Enviar por WhatsApp
    </button>

    <button
      type="button"
      data-result-back-to-amount="1"
      class="${getQuoteActionButtonClass(themeClasses, "secondary", "mt-3")}"
    >
      Editar monto
    </button>
  `;
}

function renderVenezuelaUsdEquivalent(amountObj) {
  if (amountObj?.currencyCode !== "VES") return "";

  const amount = Number(amountObj.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "";

  const themeClasses = getQuoteThemeClasses();

  return `
    <div class="rounded-3xl border ${themeClasses.resultLine} p-4">
      <div class="text-xs font-bold uppercase tracking-[0.18em] ${themeClasses.valueLabel}">
        Equivalente referencial
      </div>

      <div class="mt-2 text-2xl font-black ${themeClasses.valueNumber}" data-ves-usd-equivalent="${amount}">
        Calculando...
      </div>

      <div class="mt-1 text-sm ${themeClasses.valueUnit}">
        dólares según BCV
      </div>
    </div>
  `;
}

async function getUsdEquivalentFromVesAmount(vesAmount) {
  if (!Number.isFinite(vesAmount) || vesAmount <= 0) return null;

  const bcv = await obtenerBCV();
  const usd = Number(bcv?.usd);

  if (!Number.isFinite(usd) || usd <= 0) return null;

  return vesAmount / usd;
}

async function enrichRemittanceResultForShare(result) {
  if (!result?.recibe || result.recibe.currencyCode !== "VES") {
    return result;
  }

  const vesAmount = Number(result.recibe.amount);

  try {
    const usdEquivalent = await getUsdEquivalentFromVesAmount(vesAmount);

    if (!Number.isFinite(usdEquivalent) || usdEquivalent <= 0) {
      return result;
    }

    return {
      ...result,
      recibe: {
        ...result.recibe,
        usdEquivalent,
      },
    };
  } catch (err) {
    console.error("[quoteScreens] enrichRemittanceResultForShare:", err);
    return result;
  }
}

async function hydrateVenezuelaUsdEquivalent(container) {
  const el = container.querySelector("[data-ves-usd-equivalent]");
  if (!el) return;

  const vesAmount = Number(el.dataset.vesUsdEquivalent);
  if (!Number.isFinite(vesAmount) || vesAmount <= 0) {
    el.textContent = "—";
    return;
  }

  try {
    const usdEquivalent = await getUsdEquivalentFromVesAmount(vesAmount);

    if (!Number.isFinite(usdEquivalent) || usdEquivalent <= 0) {
      el.textContent = "—";
      return;
    }

    el.textContent = formatNumber(usdEquivalent, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (err) {
    console.error("[quoteScreens] hydrateVenezuelaUsdEquivalent:", err);
    el.textContent = "—";
  }
}

function renderRemittanceResultError(container, routeLabel, message) {
  container.innerHTML = renderScreenShell({
    eyebrow: "Cotización",
    title: routeLabel,
    description: "No se pudo completar la cotización.",
    body: `
      <div class="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-center text-sm text-red-100">
        ${message}
      </div>
    `,
  });

  bindCommonNavigation(container);
}

// =====================================================
// HELPERS
// =====================================================

function getBcvReferenceLabel(type) {
  if (type === BCV_REFERENCE_TYPES.USD) return "Dólar BCV";
  if (type === BCV_REFERENCE_TYPES.EUR) return "Euro BCV";
  if (type === BCV_REFERENCE_TYPES.CUSTOM) return "Precio personalizado";
  return "Referencia no seleccionada";
}

function getSelectedBcvRate(session, bcv) {
  if (session.bcvReferenceType === BCV_REFERENCE_TYPES.USD)
    return Number(bcv?.usd);
  if (session.bcvReferenceType === BCV_REFERENCE_TYPES.EUR)
    return Number(bcv?.eur);
  if (session.bcvReferenceType === BCV_REFERENCE_TYPES.CUSTOM)
    return Number(session.customBcvRate);
  return null;
}

function normalizeAmountInput(value) {
  const raw = String(value || "")
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "");
  const parts = raw.split(".");

  if (parts.length <= 1) return raw;

  return `${parts[0]}.${parts.slice(1).join("")}`;
}

function parseAmountInput(value) {
  const n = Number.parseFloat(String(value || "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function roundDisplayAmount(value, currencyCode) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;

  if (currencyCode === "VES") return Math.round(n);

  return Math.round(n);
}

function roundSendAmount(value, currencyCode) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;

  return redondearPorMoneda(Math.round(n), currencyCode);
}

function formatNumber(value, options = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(n);
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
