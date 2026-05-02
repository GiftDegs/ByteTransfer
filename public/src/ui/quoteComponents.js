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
