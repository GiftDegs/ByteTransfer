// public/src/ui/quoteShell.js

import { getQuoteThemeClasses } from "./quoteThemeClasses.js";
import { getPublicOperationStatus } from "../state/publicOperation.js";

export function renderQuoteShell({
  eyebrow,
  title,
  description,
  body,
  topbar,
  footer = renderQuoteShellFooter(),
  bodyClass = "",
}) {
  const themeClasses = getQuoteThemeClasses();

  return `
    ${renderQuoteMotionStyles()}
    <section class="${getQuoteShellSectionClass(themeClasses)}">
      ${renderQuoteShellBackground(themeClasses)}

      <div class="relative flex min-h-0 flex-1 flex-col ${getQuoteShellMotionClass()}">
        ${topbar || ""}

        <div data-quote-title-block="1" class="shrink-0 mb-4 text-center sm:mb-6">
          <p class="text-[11px] uppercase tracking-[0.34em] ${themeClasses.accentText}">
            ${eyebrow || ""}
          </p>
          <h2 class="mt-3 text-[clamp(1.75rem,7vw,2.25rem)] font-black leading-tight tracking-tight ${themeClasses.primaryText} sm:text-4xl">
            ${title || ""}
          </h2>
          <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed ${themeClasses.secondaryText} sm:text-base">
            ${description || ""}
          </p>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 ${bodyClass}">
          ${body || ""}
        </div>

        ${footer || ""}
      </div>
    </section>
  `;
}

function renderQuoteMotionStyles() {
  return `
    <style>
      @keyframes quoteScreenIn {
        0% {
          opacity: 0;
          transform: translateY(6px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes quoteCardIn {
        0% {
          opacity: 0;
          transform: translateY(5px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes quoteResultIn {
        0% {
          opacity: 0;
          transform: translateY(8px);
        }
        75% {
          opacity: 1;
          transform: translateY(-1px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes quoteFadeIn {
        0% {
          opacity: 0;
          transform: translateY(4px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes quoteShimmer {
        0% {
          transform: translateX(-120%);
        }
        100% {
          transform: translateX(120%);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        [class*="quoteScreenIn"],
        [class*="quoteCardIn"],
        [class*="quoteResultIn"],
        [class*="quoteFadeIn"],
        [class*="quoteShimmer"] {
          animation: none !important;
          transition: none !important;
          transform: none !important;
        }
      }
    </style>
  `;
}

function getQuoteShellMotionClass() {
  return [
    "motion-safe:animate-[quoteScreenIn_420ms_cubic-bezier(0.22,1,0.36,1)_both]",
    "motion-reduce:animate-none",
  ].join(" ");
}

export function getQuoteShellSectionClass(themeClasses) {
  return [
    "relative flex h-full min-h-0 w-full flex-col",
    "overflow-hidden border-0 px-4 py-4 shadow-none transition-colors",
    "sm:h-auto sm:max-h-[calc(100svh-2rem)] sm:overflow-hidden",
    "sm:rounded-[2rem] sm:border sm:px-6 sm:py-7 sm:shadow-2xl",
    themeClasses.shell,
  ].join(" ");
}

export function renderQuoteShellBackground(themeClasses) {
  const darkLightBeams = themeClasses.isLight
    ? ""
    : `
      <div class="absolute left-[-12%] top-[18%] h-px w-[72%] -rotate-[9deg] bg-[linear-gradient(90deg,transparent,rgba(89,184,232,0.18),transparent)]"></div>
      <div class="absolute right-[-18%] top-[38%] h-px w-[68%] rotate-[7deg] bg-[linear-gradient(90deg,transparent,rgba(40,215,197,0.14),transparent)]"></div>
      <div class="absolute bottom-[19%] left-[8%] h-px w-[58%] rotate-[4deg] bg-[linear-gradient(90deg,transparent,rgba(89,184,232,0.10),transparent)]"></div>
      <div class="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(40,215,197,0.18),transparent)]"></div>
      <div class="absolute inset-x-10 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(89,184,232,0.10),transparent)]"></div>
    `;

  return `
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full ${themeClasses.glowA} blur-3xl"></div>
      <div class="absolute -bottom-28 right-0 h-72 w-72 rounded-full ${themeClasses.glowB} blur-3xl"></div>
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,_transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,_transparent_1px)] bg-[size:38px_38px] ${themeClasses.gridOpacity}"></div>
      ${darkLightBeams}
    </div>
  `;
}

export function renderQuoteTopbar({
  showBack = false,
  showHome = false,
  animateControls = false,
} = {}) {
  const themeClasses = getQuoteThemeClasses();
  const isLight = themeClasses.isLight;

  return `
    <style>
      @keyframes quoteTopbarButtonIn {
        0% {
          opacity: 0;
          transform: translateX(-8px) translateY(-2px) scale(0.86);
          filter: blur(2px);
        }
        70% {
          opacity: 1;
          transform: translateX(1px) translateY(0) scale(1.03);
          filter: blur(0);
        }
        100% {
          opacity: 1;
          transform: translateX(0) translateY(0) scale(1);
          filter: blur(0);
        }
      }
    </style>

    <div data-quote-topbar="1" class="shrink-0 -mx-1 mb-4 grid min-h-[3.5rem] grid-cols-[4.9rem_minmax(0,1fr)_4.9rem] items-center gap-2 rounded-[1.35rem] border px-3 py-2 backdrop-blur-xl sm:sticky sm:top-0 sm:z-20 sm:grid-cols-[7.25rem_minmax(0,1fr)_7.25rem] ${themeClasses.topbar}">
      ${renderQuoteTopbarBrand(themeClasses)}

      ${renderPublicOperationHeaderStatusHost(themeClasses)}

      <div class="flex h-10 min-w-0 items-center justify-end">
        <button
          type="button"
          data-quote-theme-toggle="1"
          data-quote-theme-current="${isLight ? "light" : "dark"}"
          aria-label="${isLight ? "Activar modo oscuro" : "Activar modo claro"}"
          class="inline-flex h-8 items-center gap-2 rounded-full border px-1.5 pr-2.5 transition duration-200 active:scale-[0.98] ${themeClasses.themeSwitch}"
        >
          <span
            class="relative h-6 w-12 rounded-full border shadow-inner ${
              isLight
                ? "border-[#c6d6e4] bg-[linear-gradient(180deg,rgba(214,226,237,0.96),rgba(248,251,253,0.92)_45%,rgba(188,205,219,0.88))]"
                : "border-white/[0.055] bg-[linear-gradient(180deg,rgba(5,10,18,0.74),rgba(18,29,46,0.82)_48%,rgba(43,58,78,0.38))]"
            }"
          >
            <span
              data-quote-theme-thumb="1"
              class="absolute left-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full text-[12px] transition-transform duration-300 ease-out ${
                isLight ? "translate-x-0" : "translate-x-6"
              } ${themeClasses.themeSwitchThumb}"
            >
              <span data-quote-theme-icon="1" class="leading-none ${themeClasses.themeSwitchIcon}">
                ${isLight ? "☀" : "☾"}
              </span>
            </span>
          </span>

          <span
            data-quote-theme-label="1"
            class="hidden min-w-[2.8rem] text-left text-[9px] font-black uppercase tracking-[0.06em] sm:block ${themeClasses.themeSwitchLabel}"
          >
            ${isLight ? "Claro" : "Oscuro"}
          </span>
        </button>
      </div>
    </div>
  `;
}
function renderQuoteTopbarBrand(themeClasses) {
  return `
    <div class="flex h-10 min-w-0 items-center justify-start">
      <div class="grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.035] shadow-sm backdrop-blur-xl">
        <img
          src="logo.png"
          alt="ByteTransfer"
          class="h-5 w-5 select-none object-contain drop-shadow-[0_8px_16px_rgba(13,148,136,0.22)]"
        />
      </div>
    </div>
  `;
}
function renderPublicOperationHeaderStatusHost(themeClasses) {
  return `
    <div data-public-operation-header-host="1" class="flex min-w-0 justify-center px-1">
      ${renderPublicOperationHeaderStatusContent(themeClasses)}
    </div>
  `;
}


function renderPublicOperationHeaderStatusContent(themeClasses) {
  const status = getPublicOperationStatus();
  const tone = getPublicOperationToneClasses(status?.tone || "success", themeClasses);
  const label = getPublicOperationShortLabel(status);
  const detail = String(status?.detail || status?.phrase || "").trim();
  const progress = Number(status?.progress);
  const showProgress =
    Number.isFinite(progress) &&
    (status?.status === "open" || status?.status === "closing_soon");

  queueOperationHeaderFit();

  return `
    <div data-operation-fit-box="1" class="mx-auto flex w-full min-w-0 max-w-full flex-col items-center justify-center rounded-2xl border px-2 py-1.5 text-center backdrop-blur-xl sm:max-w-[18rem] sm:px-3 sm:py-2 ${tone.wrapper}">
      <div
        data-operation-fit-text="1"
        data-fit-max="11.2"
        data-fit-min="3.8"
        data-fit-tracking="0.055em"
        class="block max-w-full whitespace-nowrap text-center font-black uppercase leading-none ${tone.title}"
      >
        ${escapeHtml(label)}
      </div>

      <div
        data-operation-fit-text="1"
        data-fit-max="9.8"
        data-fit-min="3.6"
        data-fit-tracking="0em"
        class="mt-1 block max-w-full whitespace-nowrap text-center font-bold leading-none ${tone.detail}"
        title="${escapeHtml(detail)}"
      >
        ${escapeHtml(detail)}
      </div>

      ${showProgress ? `
        <div class="mt-1.5 h-[2px] w-full max-w-full overflow-hidden rounded-full sm:max-w-[15rem] ${tone.progressTrack}">
          <div
            class="h-full rounded-full transition-all duration-500 ${tone.progressBar}"
            style="width: ${Math.max(5, Math.min(100, Math.round(progress * 100)))}%;"
          ></div>
        </div>
      ` : ""}
    </div>
  `;
}

function getPublicOperationShortLabel(status) {
  if (status?.status === "closing_soon") return "Cerramos Pronto";
  if (status?.status === "opening_soon") return "Abrimos Pronto";
  if (status?.status === "closed_schedule") return "Cerrado";
  if (status?.status === "closed_manual") return "Sin Servicio";
  return "Abierto";
}

function getOperationDetailTextSize(value) {
  const length = String(value || "").length;

  if (length > 44) {
    return "text-[4.7px] sm:text-[7.6px]";
  }

  if (length > 38) {
    return "text-[5.1px] sm:text-[8px]";
  }

  if (length > 32) {
    return "text-[5.6px] sm:text-[8.4px]";
  }

  if (length > 26) {
    return "text-[6.2px] sm:text-[9px]";
  }

  if (length > 20) {
    return "text-[7px] sm:text-[9.6px]";
  }

  return "text-[8px] sm:text-[10.5px]";
}

function getPublicOperationToneClasses(tone, themeClasses) {
  const isLight = Boolean(themeClasses?.isLight);

  if (tone === "danger") {
    return {
      wrapper: isLight ? "border-rose-300/35 bg-rose-50/35" : "border-rose-400/16 bg-rose-500/[0.055]",
      title: isLight ? "text-rose-700" : "text-rose-200",
      detail: isLight ? "text-rose-900/64" : "text-rose-100/66",
      progressTrack: isLight ? "bg-rose-200/55" : "bg-rose-950/30",
      progressBar: "bg-rose-400",
    };
  }

  if (tone === "warning") {
    return {
      wrapper: isLight ? "border-amber-300/35 bg-amber-50/35" : "border-amber-300/16 bg-amber-400/[0.055]",
      title: isLight ? "text-amber-700" : "text-amber-200",
      detail: isLight ? "text-amber-900/64" : "text-amber-100/66",
      progressTrack: isLight ? "bg-amber-200/55" : "bg-amber-950/30",
      progressBar: "bg-amber-300",
    };
  }

  if (tone === "info") {
    return {
      wrapper: isLight ? "border-sky-300/35 bg-sky-50/35" : "border-sky-300/16 bg-sky-400/[0.055]",
      title: isLight ? "text-sky-700" : "text-sky-200",
      detail: isLight ? "text-sky-900/64" : "text-sky-100/66",
      progressTrack: isLight ? "bg-sky-200/55" : "bg-sky-950/30",
      progressBar: "bg-sky-300",
    };
  }

  if (tone === "muted") {
    return {
      wrapper: isLight ? "border-slate-300/40 bg-white/35" : "border-white/8 bg-white/[0.025]",
      title: isLight ? "text-slate-700" : "text-slate-200",
      detail: isLight ? "text-slate-700/64" : "text-slate-300/66",
      progressTrack: isLight ? "bg-slate-200/55" : "bg-slate-900/35",
      progressBar: isLight ? "bg-slate-500" : "bg-slate-300",
    };
  }

  return {
    wrapper: isLight ? "border-emerald-300/35 bg-emerald-50/35" : "border-brandTeal/16 bg-brandTeal/[0.045]",
    title: isLight ? "text-emerald-700" : "text-cyan-100",
    detail: isLight ? "text-emerald-900/64" : "text-cyan-50/66",
    progressTrack: isLight ? "bg-emerald-200/55" : "bg-cyan-950/30",
    progressBar: "bg-brandTeal",
  };
}

let operationHeaderFitFrame = 0;
let operationHeaderFitBound = false;

function queueOperationHeaderFit() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (!operationHeaderFitBound) {
    operationHeaderFitBound = true;
    window.addEventListener("resize", queueOperationHeaderFit, { passive: true });
    window.addEventListener("orientationchange", queueOperationHeaderFit, { passive: true });
  }

  if (operationHeaderFitFrame) {
    window.cancelAnimationFrame(operationHeaderFitFrame);
  }

  operationHeaderFitFrame = window.requestAnimationFrame(() => {
    operationHeaderFitFrame = 0;
    fitOperationHeaderText();
  });
}

function fitOperationHeaderText() {
  document.querySelectorAll("[data-operation-fit-text]").forEach((el) => {
    const box = el.closest("[data-operation-fit-box]");

    if (!box) return;

    const availableWidth = Math.max(12, Math.floor(box.clientWidth - 8));
    const maxSize = Number(el.dataset.fitMax || 10);
    const minSize = Number(el.dataset.fitMin || 4);
    const tracking = el.dataset.fitTracking || "0em";

    el.style.display = "inline-block";
    el.style.maxWidth = "none";
    el.style.whiteSpace = "nowrap";
    el.style.fontSize = `${maxSize}px`;
    el.style.letterSpacing = tracking;
    el.style.transform = "scaleX(1)";
    el.style.transformOrigin = "center center";

    let size = maxSize;

    while (size > minSize && el.scrollWidth > availableWidth) {
      size = Math.max(minSize, size - 0.25);
      el.style.fontSize = `${size}px`;
    }

    if (el.scrollWidth > availableWidth) {
      const scale = Math.max(0.28, availableWidth / el.scrollWidth);
      el.style.transform = `scaleX(${scale})`;
    }
  });
}

export function refreshQuotePublicOperationStatus() {
  const themeClasses = getQuoteThemeClasses();

  document
    .querySelectorAll("[data-public-operation-header-host]")
    .forEach((el) => {
      el.innerHTML = renderPublicOperationHeaderStatusContent(themeClasses);
    });

  queueOperationHeaderFit();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderTopbarIconButton(type, themeClasses, visible = true, animateControls = false) {
  const isHome = type === "home";
  const actionAttr = isHome ? 'data-quote-home="1"' : 'data-quote-back="1"';
  const label = isHome ? "Inicio" : "Volver";

  const stateClass = visible
    ? "pointer-events-auto opacity-100 translate-y-0 scale-100"
    : "pointer-events-none opacity-0 -translate-y-0.5 scale-95";

  const disabledAttrs = visible ? "" : 'disabled aria-hidden="true" tabindex="-1"';
  const animationStyle = visible && animateControls
    ? 'style="animation: quoteTopbarButtonIn 260ms cubic-bezier(0.22, 1, 0.36, 1) both;"'
    : "";

  const iconSvg = isHome
    ? `<svg viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5"><path d="M12 3.2 3.6 10v9.1c0 .8.6 1.4 1.4 1.4h4.5v-6.1c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v6.1H19c.8 0 1.4-.6 1.4-1.4V10L12 3.2Z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5"><path d="M10 5.1 3.6 11.5 10 17.9l1.5-1.5-3.7-3.7h6.1c2.7 0 4.9 2.2 4.9 4.9v.7H21v-.7c0-3.9-3.2-7.1-7.1-7.1H7.8l3.7-3.7L10 5.1Z"/></svg>`;

  return `
    <button
      type="button"
      ${actionAttr}
      ${disabledAttrs}
      ${animationStyle}
      title="${label}"
      aria-label="${label}"
      class="grid h-10 w-10 place-items-center rounded-full border transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.96] ${themeClasses.iconTopbarButton} ${stateClass}"
    >
      ${iconSvg}
    </button>
  `;
}

export function animateQuoteTopbarExit(trigger, onComplete) {
  const navHost =
    trigger?.closest?.("[data-quote-topbar]") ||
    trigger?.closest?.("[data-quote-footer-nav]");

  const buttons = navHost
    ? Array.from(navHost.querySelectorAll("[data-quote-home], [data-quote-back]"))
    : [];

  const visibleButtons = buttons.filter((button) => !button.disabled);

  if (!visibleButtons.length) {
    if (typeof onComplete === "function") onComplete();
    return;
  }

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (typeof onComplete === "function") onComplete();
  };

  visibleButtons.forEach((button, index) => {
    button.disabled = true;
    button.style.transition =
      "opacity 210ms cubic-bezier(0.22, 1, 0.36, 1), transform 210ms cubic-bezier(0.22, 1, 0.36, 1), filter 210ms cubic-bezier(0.22, 1, 0.36, 1)";
    button.style.transitionDelay = `${index * 34}ms`;
    button.style.opacity = "0";
    button.style.transform = "translateX(-8px) translateY(-2px) scale(0.86)";
    button.style.filter = "blur(1.5px)";
    button.style.pointerEvents = "none";
  });

  window.setTimeout(finish, 280);
}

export function animateQuoteThemeSwitch(themeToggle, onComplete) {
  if (!themeToggle) return;

  const currentTheme = themeToggle.dataset.quoteThemeCurrent;
  const isLight = currentTheme === "light";
  const thumb = themeToggle.querySelector("[data-quote-theme-thumb]");
  const icon = themeToggle.querySelector("[data-quote-theme-icon]");
  const label = themeToggle.querySelector("[data-quote-theme-label]");

  themeToggle.disabled = true;
  themeToggle.classList.add("scale-[0.98]");

  if (isLight) {
    thumb?.classList.remove("translate-x-0");
    thumb?.classList.add("translate-x-6");
    if (icon) icon.textContent = "☾";
    if (label) label.textContent = "Oscuro";
  } else {
    thumb?.classList.remove("translate-x-6");
    thumb?.classList.add("translate-x-0");
    if (icon) icon.textContent = "☀";
    if (label) label.textContent = "Claro";
  }

  const overlay = createQuoteThemeTransitionOverlay(isLight);
  document.body.appendChild(overlay);

  window.requestAnimationFrame(() => {
    overlay.style.opacity = "1";
  });

  window.setTimeout(() => {
    const completeThemeChange = () => {
      if (typeof onComplete === "function") onComplete();
    };

    const fadeOverlayOut = () => {
      window.requestAnimationFrame(() => {
        overlay.style.opacity = "0";
      });

      window.setTimeout(() => {
        overlay.remove();
      }, 360);
    };

    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        completeThemeChange();
      });

      transition.finished.finally(fadeOverlayOut);
      return;
    }

    completeThemeChange();
    window.setTimeout(fadeOverlayOut, 80);
  }, 210);
}

function createQuoteThemeTransitionOverlay(isLight) {
  const overlay = document.createElement("div");

  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "9999";
  overlay.style.pointerEvents = "none";
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity 320ms cubic-bezier(0.22, 1, 0.36, 1)";
  overlay.style.backdropFilter = "blur(1.2px)";
  overlay.style.webkitBackdropFilter = "blur(1.2px)";

  overlay.style.background = isLight
    ? [
        "radial-gradient(circle at 50% 12%, rgba(89,184,232,0.18), transparent 38%)",
        "linear-gradient(180deg, rgba(10,18,32,0.10), rgba(8,17,29,0.46))",
      ].join(", ")
    : [
        "radial-gradient(circle at 50% 8%, rgba(255,255,255,0.34), transparent 34%)",
        "linear-gradient(180deg, rgba(236,248,255,0.38), rgba(214,238,250,0.20))",
      ].join(", ");

  return overlay;
}

export function renderQuoteShellFooter({
  logoSize = "h-10 w-10 sm:h-12 sm:w-12",
  paddingTop = "pt-4",
  showHome = false,
  showBack = false,
  animateControls = false,
} = {}) {
  const themeClasses = getQuoteThemeClasses();

  return `
    <div data-quote-footer-nav="1" class="shrink-0 grid grid-cols-[4rem_minmax(0,1fr)_4rem] items-end gap-3 ${paddingTop}">
      <div class="flex justify-start">
        ${renderTopbarIconButton("home", themeClasses, showHome, animateControls)}
      </div>

      <div class="flex min-w-0 flex-col items-center justify-end">
        <img
          src="logo.png"
          alt="Logo ByteTransfer"
          class="${logoSize} select-none object-contain drop-shadow-[0_14px_24px_rgba(13,148,136,0.24)]"
        />

        <p class="mt-2 text-[10px] font-black uppercase tracking-[0.28em] ${themeClasses.accentText}">
          ByteTransfer
        </p>
      </div>

      <div class="flex justify-end">
        ${renderTopbarIconButton("back", themeClasses, showBack, animateControls)}
      </div>
    </div>
  `;
}

