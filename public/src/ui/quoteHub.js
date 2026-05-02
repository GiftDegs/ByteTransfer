// public/src/ui/quoteHub.js

import { getMainModules } from "../core/quoteModes.js";
import { startQuoteModule } from "../state/quoteSession.js";
import { getQuoteTheme, toggleQuoteTheme } from "../state/quoteTheme.js";
import { getQuoteThemeClasses } from "./quoteThemeClasses.js";

const MODULE_ICONS = {
  references: "◆",
  rate: "↔",
  remittance: "→",
};

const MODULE_META = {
  references: {
    eyebrow: "BCV",
    helper: "Para responder consultas rápidas de dólar o euro BCV.",
  },
  rate: {
    eyebrow: "TASA",
    helper: "Para compartir una tasa comercial entre dos países.",
  },
  remittance: {
    eyebrow: "COTIZACIÓN",
    helper: "Para calcular cuánto envía o cuánto recibe el cliente.",
  },
};

export function renderQuoteHub(container, onModuleSelected = null) {
  if (!container) return;

  const modules = getMainModules();
  const theme = getQuoteTheme();
  const themeClasses = getQuoteThemeClasses();
  const isLight = theme === "light";

  container.innerHTML = `
<section class="relative flex h-full w-full flex-col overflow-hidden border-0 px-4 py-4 shadow-none transition-colors sm:h-auto sm:max-h-[calc(100svh-2rem)] sm:overflow-y-auto sm:rounded-[2rem] sm:border sm:px-6 sm:py-7 sm:shadow-2xl ${themeClasses.shell}">      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full ${themeClasses.glowA} blur-3xl"></div>
        <div class="absolute -bottom-28 right-0 h-72 w-72 rounded-full ${themeClasses.glowB} blur-3xl"></div>
        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,_transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,_transparent_1px)] bg-[size:38px_38px] ${themeClasses.gridOpacity}"></div>
      </div>

      <div class="relative flex min-h-0 flex-1 flex-col">
        <div class="mb-5 flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 backdrop-blur-xl ${themeClasses.topbar}">
          <span class="rounded-md bg-[linear-gradient(135deg,#22d3c5,#2f8cff)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.26em] text-white shadow-sm">
            Centro de cotización
          </span>

          <button
            type="button"
            data-quote-theme-toggle="1"
            class="rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition ${themeClasses.themeButton}"
          >
            ${isLight ? "Modo oscuro" : "Modo claro"}
          </button>
        </div>

        <div class="mb-7 text-center">
          <p class="text-[11px] uppercase tracking-[0.34em] ${themeClasses.accentText}">
            Centro de cotización
          </p>

          <h2 class="mt-3 text-3xl font-black leading-tight tracking-tight ${themeClasses.primaryText} sm:text-4xl">
            ¿Qué quieres resolver?
          </h2>

          <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed ${themeClasses.secondaryText} sm:text-base">
            Elige el tipo de consulta y genera una respuesta lista para enviar por WhatsApp.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3">
          ${modules.map((module) => renderModuleCard(module, themeClasses)).join("")}
        </div>

                <div class="mt-auto flex flex-col items-center justify-end pt-5">
          <img
            src="logo.png"
            alt="Logo ByteTransfer"
            class="h-12 w-12 select-none object-contain drop-shadow-[0_14px_24px_rgba(13,148,136,0.24)] sm:h-14 sm:w-14"
          />

          <p class="mt-2 text-[10px] font-black uppercase tracking-[0.28em] ${themeClasses.accentText}">
            ByteTransfer
          </p>
        </div>

      </div>
    </section>
  `;

  container
    .querySelector("[data-quote-theme-toggle]")
    ?.addEventListener("click", () => {
      toggleQuoteTheme();
      renderQuoteHub(container, onModuleSelected);
    });

  container.querySelectorAll("[data-quote-module]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const moduleId = btn.dataset.quoteModule;
      startQuoteModule(moduleId);

      if (typeof onModuleSelected === "function") {
        onModuleSelected(moduleId);
      }
    });
  });
}

function renderModuleCard(module, themeClasses) {
  const meta = MODULE_META[module.id] || {};
  const icon = MODULE_ICONS[module.id] || "→";

  return `
    <button
      type="button"
      data-quote-module="${module.id}"
      class="group relative w-full overflow-hidden rounded-3xl border p-5 text-left backdrop-blur-xl transition hover:-translate-y-0.5 ${themeClasses.card} ${themeClasses.cardHover}"
    >
      <div class="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#23d4c3]/16 to-transparent opacity-0 transition group-hover:opacity-100"></div>

      <div class="relative flex items-center gap-4">
        <div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-xl font-black ${themeClasses.iconBox}">
          ${icon}
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-[#21d9c6]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#12cfc0]">
              ${meta.eyebrow || "CONSULTA"}
            </span>
          </div>

          <h3 class="mt-2 text-lg font-black tracking-tight ${themeClasses.primaryText}">
            ${module.title}
          </h3>

          <p class="mt-1 text-sm leading-relaxed ${themeClasses.secondaryText}">
            ${meta.helper || module.description}
          </p>
        </div>

        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg transition ${themeClasses.arrowBox}">
          →
        </div>
      </div>
    </button>
  `;
}
