// public/src/ui/quoteShell.js

import { getQuoteThemeClasses } from "./quoteThemeClasses.js";

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
    <section class="${getQuoteShellSectionClass(themeClasses)}">
      ${renderQuoteShellBackground(themeClasses)}

      <div class="relative flex min-h-0 flex-1 flex-col">
        ${topbar || ""}

        <div class="shrink-0 mb-4 text-center sm:mb-6">
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
  return `
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full ${themeClasses.glowA} blur-3xl"></div>
      <div class="absolute -bottom-28 right-0 h-72 w-72 rounded-full ${themeClasses.glowB} blur-3xl"></div>
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,_transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,_transparent_1px)] bg-[size:38px_38px] ${themeClasses.gridOpacity}"></div>
    </div>
  `;
}

export function renderQuoteShellFooter({
  logoSize = "h-10 w-10 sm:h-12 sm:w-12",
  paddingTop = "pt-4",
} = {}) {
  const themeClasses = getQuoteThemeClasses();

  return `
    <div class="shrink-0 flex flex-col items-center justify-end ${paddingTop}">
      <img
        src="logo.png"
        alt="Logo ByteTransfer"
        class="${logoSize} select-none object-contain drop-shadow-[0_14px_24px_rgba(13,148,136,0.24)]"
      />

      <p class="mt-2 text-[10px] font-black uppercase tracking-[0.28em] ${themeClasses.accentText}">
        ByteTransfer
      </p>
    </div>
  `;
}
