// public/src/state/quoteTheme.js

const QUOTE_THEME_STORAGE_KEY = "bytetransfer_quote_theme";
const VALID_THEMES = new Set(["dark", "light"]);

let currentQuoteTheme = loadInitialQuoteTheme();

function loadInitialQuoteTheme() {
  try {
    const saved = window.localStorage.getItem(QUOTE_THEME_STORAGE_KEY);
    return VALID_THEMES.has(saved) ? saved : "dark";
  } catch {
    return "dark";
  }
}

export function getQuoteTheme() {
  return VALID_THEMES.has(currentQuoteTheme) ? currentQuoteTheme : "dark";
}

export function setQuoteTheme(theme) {
  currentQuoteTheme = VALID_THEMES.has(theme) ? theme : "dark";

  try {
    window.localStorage.setItem(QUOTE_THEME_STORAGE_KEY, currentQuoteTheme);
  } catch {
    // localStorage puede fallar en modo privado o entornos restringidos.
  }

  return currentQuoteTheme;
}

export function toggleQuoteTheme() {
  return setQuoteTheme(getQuoteTheme() === "dark" ? "light" : "dark");
}

export function withQuoteTheme(payload) {
  if (!payload) return payload;

  return {
    ...payload,
    theme: getQuoteTheme(),
  };
}