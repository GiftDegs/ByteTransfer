// public/src/core/config.js

import { COUNTRY_LABELS } from "./labels.js";

export const CONFIG = {
  MIN_USD: 1,
  MAX_USD: 1000,
};

export const NUMERO_WHATSAPP = "5491157261053";

export const paisesDisponibles = [
  "ARS",
  "COP",
  "PEN",
  "CLP",
  "MXN",
  "BRL",
  "VES",
].map((codigo) => ({
  codigo,
  nombre: COUNTRY_LABELS[codigo]?.country || codigo,
  emoji: COUNTRY_LABELS[codigo]?.flag || "",
  moneda: COUNTRY_LABELS[codigo]?.short || codigo,
}));