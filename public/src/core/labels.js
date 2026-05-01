// public/src/core/labels.js

export const COUNTRY_LABELS = {
  ARS: {
    country: "Argentina",
    currencySingular: "peso argentino",
    currencyPlural: "pesos argentinos",
    short: "pesos argentinos",
    flag: "🇦🇷",
  },
  COP: {
    country: "Colombia",
    currencySingular: "peso colombiano",
    currencyPlural: "pesos colombianos",
    short: "pesos colombianos",
    flag: "🇨🇴",
  },
  PEN: {
    country: "Perú",
    currencySingular: "sol",
    currencyPlural: "soles",
    short: "soles",
    flag: "🇵🇪",
  },
  CLP: {
    country: "Chile",
    currencySingular: "peso chileno",
    currencyPlural: "pesos chilenos",
    short: "pesos chilenos",
    flag: "🇨🇱",
  },
  MXN: {
    country: "México",
    currencySingular: "peso mexicano",
    currencyPlural: "pesos mexicanos",
    short: "pesos mexicanos",
    flag: "🇲🇽",
  },
  BRL: {
    country: "Brasil",
    currencySingular: "real",
    currencyPlural: "reales",
    short: "reales",
    flag: "🇧🇷",
  },
  VES: {
    country: "Venezuela",
    currencySingular: "bolívar",
    currencyPlural: "bolívares",
    short: "bolívares",
    flag: "🇻🇪",
  },
  USD: {
    country: "Estados Unidos",
    currencySingular: "dólar",
    currencyPlural: "dólares",
    short: "dólares",
    flag: "🇺🇸",
  },
  EUR: {
    country: "Europa",
    currencySingular: "euro",
    currencyPlural: "euros",
    short: "euros",
    flag: "🇪🇺",
  },
};

export function getCountryLabel(code) {
  return COUNTRY_LABELS?.[code]?.country || code;
}

export function getCurrencyLabel(code, amount = 2) {
  const item = COUNTRY_LABELS?.[code];
  if (!item) return code;

  const n = Number(amount);
  return Math.abs(n) === 1 ? item.currencySingular : item.currencyPlural;
}

export function getCurrencyShortLabel(code) {
  return COUNTRY_LABELS?.[code]?.short || code;
}

export function getFlagLabel(code) {
  return COUNTRY_LABELS?.[code]?.flag || "";
}

export function getRouteLabel(origen, destino) {
  return `${getCountryLabel(origen)} → ${getCountryLabel(destino)}`;
}