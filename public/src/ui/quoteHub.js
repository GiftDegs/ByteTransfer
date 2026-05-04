// public/src/ui/quoteHub.js

import { getMainModules } from "../core/quoteModes.js";
import { startQuoteModule } from "../state/quoteSession.js";
import { getQuoteTheme, toggleQuoteTheme } from "../state/quoteTheme.js";
import { getQuoteThemeClasses } from "./quoteThemeClasses.js";
import {
  getQuoteArrowBoxClass,
  getQuoteIconBoxClass,
  getQuoteSelectionCardClass,
} from "./quoteComponents.js";
import { renderQuoteShell, renderQuoteShellFooter } from "./quoteShell.js";

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

  container.innerHTML = renderQuoteShell({
    eyebrow: "Centro de cotización",
    title: "¿Qué quieres resolver?",
    description:
      "Elige el tipo de consulta y genera una respuesta lista para enviar por WhatsApp.",
    topbar: `
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
    `,
    body: `
      <div class="grid grid-cols-1 gap-3">
        ${modules.map((module) => renderModuleCard(module, themeClasses)).join("")}
      </div>
    `,
    footer: renderQuoteShellFooter({
      logoSize: "h-12 w-12 sm:h-14 sm:w-14",
      paddingTop: "pt-5",
    }),
  });

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
      class="${getQuoteSelectionCardClass(themeClasses, "p-5")}"
    >
      <div class="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#23d4c3]/16 to-transparent opacity-0 transition group-hover:opacity-100"></div>

      <div class="relative flex items-center gap-4">
        <div class="${getQuoteIconBoxClass(themeClasses, "h-12 w-12", "text-xl")}">
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

        <div class="${getQuoteArrowBoxClass(themeClasses, "h-10 w-10")}">
          →
        </div>
      </div>
    </button>
  `;
}
