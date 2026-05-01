// public/src/ui/quoteHub.js

import { getMainModules } from "../core/quoteModes.js";
import { startQuoteModule } from "../state/quoteSession.js";

export function renderQuoteHub(container) {
  if (!container) return;

  const modules = getMainModules();

  container.innerHTML = `
    <section class="w-full">
      <div class="mb-5 text-center">
        <p class="text-xs uppercase tracking-[0.28em] text-slate-400">
          Centro de cotización
        </p>
        <h2 class="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
          ¿Qué quieres resolver?
        </h2>
        <p class="mt-2 text-sm sm:text-base text-slate-400">
          Elige el tipo de consulta y genera una respuesta lista para WhatsApp.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-3">
        ${modules.map(renderModuleCard).join("")}
      </div>
    </section>
  `;

  container.querySelectorAll("[data-quote-module]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const moduleId = btn.dataset.quoteModule;
      startQuoteModule(moduleId);
    });
  });
}

function renderModuleCard(module) {
  return `
    <button
      type="button"
      data-quote-module="${module.id}"
      class="group w-full rounded-3xl border border-white/10 bg-white/[0.07] p-5 text-left shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-brandTeal/40 hover:bg-white/[0.10]"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-white">
            ${module.title}
          </h3>
          <p class="mt-1 text-sm leading-relaxed text-slate-400">
            ${module.description}
          </p>
          <div class="mt-4 inline-flex items-center rounded-full bg-brandBlue/15 px-3 py-1 text-xs font-semibold text-brandTeal">
            ${module.action}
          </div>
        </div>

        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white transition group-hover:bg-brandTeal/20 group-hover:text-brandTeal">
          →
        </div>
      </div>
    </button>
  `;
}