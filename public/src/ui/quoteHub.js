// public/src/ui/quoteHub.js

import { getMainModules } from "../core/quoteModes.js";
import { startQuoteModule } from "../state/quoteSession.js";

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

  container.innerHTML = `
    <section class="relative w-full overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 px-4 py-5 text-white shadow-2xl sm:px-6 sm:py-7">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brandBlue/30 blur-3xl"></div>
        <div class="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-brandTeal/10 blur-3xl"></div>
        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,_transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,_transparent_1px)] bg-[size:38px_38px] opacity-20"></div>
      </div>

      <div class="relative">
        <div class="mb-6 text-center">
          <p class="text-[11px] uppercase tracking-[0.34em] text-brandTeal">
            Centro de cotización
          </p>
          <h2 class="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
            ¿Qué quieres resolver?
          </h2>
          <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
            Elige el tipo de consulta y genera una respuesta lista para enviar por WhatsApp.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3">
          ${modules.map(renderModuleCard).join("")}
        </div>
      </div>
    </section>
  `;

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

function renderModuleCard(module) {
  const meta = MODULE_META[module.id] || {};
  const icon = MODULE_ICONS[module.id] || "→";

  return `
    <button
      type="button"
      data-quote-module="${module.id}"
      class="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-left shadow-xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-brandTeal/50 hover:bg-white/[0.10]"
    >
      <div class="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-brandBlue/10 to-transparent opacity-0 transition group-hover:opacity-100"></div>

      <div class="relative flex items-center gap-4">
        <div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-xl font-black text-brandTeal shadow-lg">
          ${icon}
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-brandTeal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brandTeal">
              ${meta.eyebrow || "CONSULTA"}
            </span>
          </div>

          <h3 class="mt-2 text-lg font-black tracking-tight text-white">
            ${module.title}
          </h3>

          <p class="mt-1 text-sm leading-relaxed text-slate-300">
            ${meta.helper || module.description}
          </p>
        </div>

        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-lg text-white transition group-hover:bg-brandTeal group-hover:text-slate-950">
          →
        </div>
      </div>
    </button>
  `;
}