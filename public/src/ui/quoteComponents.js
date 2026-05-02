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
