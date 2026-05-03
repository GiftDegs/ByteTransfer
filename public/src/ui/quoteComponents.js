// public/src/ui/quoteComponents.js

export function getQuoteSelectionCardClass(themeClasses, padding = "p-5") {
  return [
    "group relative w-full overflow-hidden rounded-3xl border",
    padding,
    "text-left backdrop-blur-xl transition hover:-translate-y-0.5",
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
    themeClasses.iconBox,
  ].join(" ");
}


export function getQuoteActionButtonClass(themeClasses, variant = "primary", extra = "") {
  const base = "w-full rounded-2xl px-5 py-4 text-sm font-black transition";

  if (variant === "secondary") {
    return [
      base,
      "border",
      themeClasses.secondaryButton,
      extra,
    ].filter(Boolean).join(" ");
  }

  if (variant === "continue") {
    return [
      base,
      "bg-brandTeal text-slate-950 shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40",
      extra,
    ].filter(Boolean).join(" ");
  }

  return [
    base,
    themeClasses.gemButton,
    extra,
  ].filter(Boolean).join(" ");
}


export function getQuoteArrowBoxClass(themeClasses, size = "h-10 w-10", weight = "") {
  return [
    "grid",
    size,
    "shrink-0 place-items-center rounded-2xl text-lg transition",
    weight,
    themeClasses.arrowBox,
  ].filter(Boolean).join(" ");
}

export function getQuoteBadgeClass(themeClasses, extra = "") {
  return [
    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
    themeClasses.badge,
    extra,
  ].filter(Boolean).join(" ");
}

export function getQuoteChipClass(themeClasses, extra = "") {
  return [
    "shrink-0 rounded-2xl px-3 py-2 text-xs font-bold",
    themeClasses.chip,
    extra,
  ].filter(Boolean).join(" ");
}


export function renderQuoteLoadingPanel(themeClasses, message = "Cargando...") {
  return `
    <div class="rounded-3xl border ${themeClasses.panel} p-6 text-center">
      <div class="mx-auto h-10 w-10 rounded-full border border-[#22d8cb]/30 border-t-[#22d8cb] animate-spin"></div>
      <p class="mt-4 text-sm ${themeClasses.secondaryText}">${message}</p>
    </div>
  `;
}
