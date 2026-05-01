// public/src/ui/quoteScreens.js

import { QUOTE_MODULES, getReferenceOptions } from "../core/quoteModes.js";
import { getQuoteSession, setQuoteSession, startQuoteModule, resetQuoteSession } from "../state/quoteSession.js";
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

  renderComingSoon(container, session);
}

function renderScreenShell({ eyebrow, title, description, body }) {
  return `
    <section class="relative w-full overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 px-4 py-5 text-white shadow-2xl sm:px-6 sm:py-7">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brandBlue/25 blur-3xl"></div>
        <div class="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-brandTeal/10 blur-3xl"></div>
        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,_transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,_transparent_1px)] bg-[size:38px_38px] opacity-20"></div>
      </div>

      <div class="relative">
        <div class="mb-5 flex items-center justify-between gap-3">
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

    resetQuoteSession();
    renderQuoteScreen(container);
  });
}