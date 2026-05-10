// public/src/ui/quoteComponents.js

const quoteMotionBase =
  "motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none";

const quotePressableMotion =
  "motion-safe:active:scale-[0.985] motion-safe:active:brightness-95 motion-reduce:active:scale-100";

  function canUseQuoteHaptics() {
  if (typeof window === "undefined") return false;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  if (reduceMotion) return false;

  return typeof navigator !== "undefined"
    && typeof navigator.vibrate === "function";
}

export function triggerQuoteHaptic(type = "tap") {
  if (!canUseQuoteHaptics()) return;

  if (type === "soft") {
    navigator.vibrate?.(16);
    return;
  }

  if (type === "success") {
    navigator.vibrate?.([18, 45, 20]);
    return;
  }

  navigator.vibrate?.(18);
}

export function getQuoteMotionClass(kind = "soft") {
  if (kind === "screen") {
    return "motion-safe:animate-[quoteScreenIn_420ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none";
  }

  if (kind === "card") {
    return "motion-safe:animate-[quoteCardIn_360ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none";
  }

  if (kind === "result") {
    return "motion-safe:animate-[quoteResultIn_520ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none";
  }

  if (kind === "fade") {
    return "motion-safe:animate-[quoteFadeIn_280ms_ease-out_both] motion-reduce:animate-none";
  }

  return quoteMotionBase;
}

export function getQuoteStaggerStyle(index = 0, stepMs = 55, maxMs = 330) {
  const delay = Math.min(Math.max(index, 0) * stepMs, maxMs);
  return `style="animation-delay:${delay}ms"`;
}

export function getQuoteSelectionCardClass(themeClasses, padding = "p-5") {
  return [
    "group relative w-full overflow-hidden rounded-3xl border",
    padding,
    "text-left backdrop-blur-xl",
    quoteMotionBase,
    quotePressableMotion,
    "hover:-translate-y-0.5 hover:shadow-2xl",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
    themeClasses.card,
    themeClasses.cardHover,
  ].join(" ");
}

export function getQuoteIconBoxClass(themeClasses, size = "h-12 w-12", textSize = "text-xl") {
  return [
    "grid",
    size,
    "shrink-0 place-items-center rounded-2xl border",
    textSize,
    "font-black",
    quoteMotionBase,
    "group-hover:scale-[1.035] group-active:scale-[0.98]",
    themeClasses.iconBox,
  ].join(" ");
}


export function getQuoteActionButtonClass(themeClasses, variant = "primary", extra = "") {
  const base = [
    "relative w-full overflow-hidden rounded-2xl px-5 py-4 text-sm font-black",
    quoteMotionBase,
    quotePressableMotion,
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28),transparent_58%)] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
  ].join(" ");

  if (variant === "secondary") {
    return [
      base,
      "border hover:-translate-y-0.5 active:translate-y-0",
      themeClasses.secondaryButton,
      extra,
    ].filter(Boolean).join(" ");
  }

  if (variant === "continue") {
    return [
      base,
      "bg-brandTeal text-slate-950 shadow-xl hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100",
      extra,
    ].filter(Boolean).join(" ");
  }

  return [
    base,
    "hover:-translate-y-0.5 active:translate-y-0",
    themeClasses.gemButton,
    extra,
  ].filter(Boolean).join(" ");
}


export function getQuoteArrowBoxClass(themeClasses, size = "h-10 w-10", weight = "") {
  return [
    "grid",
    size,
    "shrink-0 place-items-center rounded-2xl text-lg",
    quoteMotionBase,
    "group-hover:translate-x-0.5 group-hover:scale-[1.035] group-active:scale-[0.98]",
    weight,
    themeClasses.arrowBox,
  ].filter(Boolean).join(" ");
}

export function getQuoteBadgeClass(themeClasses, extra = "") {
  return [
    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
    quoteMotionBase,
    themeClasses.badge,
    extra,
  ].filter(Boolean).join(" ");
}

export function getQuoteChipClass(themeClasses, extra = "") {
  return [
    "shrink-0 rounded-2xl px-3 py-2 text-xs font-bold",
    quoteMotionBase,
    themeClasses.chip,
    extra,
  ].filter(Boolean).join(" ");
}


export function renderQuoteLoadingPanel(themeClasses, message = "Cargando...") {
  return `
    <div class="relative overflow-hidden rounded-3xl border ${themeClasses.panel} p-6 text-center ${getQuoteMotionClass("fade")}">
      <div class="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.10),transparent)] motion-safe:animate-[quoteShimmer_1.7s_ease-in-out_infinite] motion-reduce:hidden"></div>
      <div class="mx-auto h-10 w-10 rounded-full border border-[#22d8cb]/25 border-t-[#22d8cb] animate-spin motion-reduce:animate-none"></div>
      <p class="mt-4 text-sm ${themeClasses.secondaryText}">${message}</p>
    </div>
  `;
}


export function renderQuoteErrorPanel(message) {
  return `
    <div class="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-center text-sm text-red-100 ${getQuoteMotionClass("fade")}">
      ${message}
    </div>
  `;
}

export function renderQuoteInfoPanel(themeClasses, message) {
  return `
    <div class="rounded-3xl border ${themeClasses.panel} p-5 text-center text-sm ${themeClasses.secondaryText} ${getQuoteMotionClass("fade")}">
      ${message}
    </div>
  `;
}
