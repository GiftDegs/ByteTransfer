// public/src/core/sharePayload.js

import { getCountryLabel, getCurrencyShortLabel, getRouteLabel } from "./labels.js";

export const SHARE_PAYLOAD_TYPES = {
  REFERENCE: "reference",
  RATE: "rate",
  REMITTANCE: "remittance",
};

export function buildReferenceSharePayload({ referenceTitle, value, updatedAt }) {
  return {
    type: SHARE_PAYLOAD_TYPES.REFERENCE,
    brand: "ByteTransfer",
    title: "Referencia BCV",
    subtitle: referenceTitle,
    primaryLabel: referenceTitle,
    primaryValue: value,
    primaryUnit: "bolívares",
    disclaimer: null,
    updatedAt,
    rows: [],
  };
}

export function buildRateSharePayload({ origen, destino, tasa, updatedAt }) {
  return {
    type: SHARE_PAYLOAD_TYPES.RATE,
    brand: "ByteTransfer",
    title: "Tasa de cambio",
    subtitle: getRouteLabel(origen, destino),
    primaryLabel: getRouteLabel(origen, destino),
    primaryValue: tasa,
    primaryUnit: null,
    disclaimer: "Tasa sujeta a cambio sin previo aviso",
    updatedAt,
    rows: [],
  };
}

export function buildRemittanceSharePayload(result) {
  if (!result || !result.type) {
    return null;
  }

  const base = {
    type: SHARE_PAYLOAD_TYPES.REMITTANCE,
    brand: "ByteTransfer",
    title: "Cotización",
    subtitle: result.routeLabel || "",
    disclaimer: null,
    updatedAt: result.fecha || "",
    rows: [],
  };

  if (result.type === "send_amount") {
    return {
      ...base,
      primaryLabel: "Recibe",
      primaryValue: result.recibe?.amount,
      primaryUnit: result.recibe?.currencyLabel,
      rows: [
        {
          label: "Envías",
          value: result.envia?.amount,
          unit: result.envia?.currencyLabel,
        },
        {
          label: "Tasa aplicada",
          value: result.tasaVisible,
          unit: null,
        },
        ...buildVenezuelaEquivalentRows(result.recibe),
      ],
    };
  }

  if (result.type === "receive_amount") {
    return {
      ...base,
      primaryLabel: "Debes enviar",
      primaryValue: result.debeEnviar?.amount,
      primaryUnit: result.debeEnviar?.currencyLabel,
      rows: [
        {
          label: "Deseas recibir",
          value: result.recibe?.amount,
          unit: result.recibe?.currencyLabel,
        },
        {
          label: "Tasa aplicada",
          value: result.tasaVisible,
          unit: null,
        },
        ...buildVenezuelaEquivalentRows(result.recibe),
      ],
    };
  }

  if (result.type === "receive_bcv_usd") {
    return {
      ...base,
      primaryLabel: "Debes enviar",
      primaryValue: result.debeEnviar?.amount,
      primaryUnit: result.debeEnviar?.currencyLabel,
      rows: [
        {
          label: "Deseas recibir",
          value: result.usdDeseados,
          unit: "dólares",
        },
        {
          label: "Equivalente en Venezuela",
          value: result.vesObjetivo,
          unit: "bolívares",
        },
        {
          label: "Referencia",
          value: result.bcvReference,
          unit: null,
          raw: true,
        },
        {
          label: "Tasa aplicada",
          value: result.tasaVisible,
          unit: null,
        },
      ],
    };
  }

  return null;
}

function buildVenezuelaEquivalentRows(amountObj) {
  if (amountObj?.currencyCode !== "VES") return [];

  return [
    {
      label: "Equivalente referencial",
      value: amountObj.usdEquivalent ?? null,
      unit: "dólares según BCV",
      computed: "ves_to_usd",
      sourceAmount: amountObj.amount,
    },
  ];
}

export function formatShareNumber(value, options = {}) {
  if (value === null || value === undefined || value === "") return "—";

  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(n);
}

export function formatShareValue(rowOrValue, unit = null) {
  if (rowOrValue && typeof rowOrValue === "object") {
    if (rowOrValue.raw) return String(rowOrValue.value || "—");

    const value = formatShareNumber(rowOrValue.value);
    return rowOrValue.unit ? `${value} ${rowOrValue.unit}` : value;
  }

  const value = formatShareNumber(rowOrValue);
  return unit ? `${value} ${unit}` : value;
}

export function getShareFilename(payload) {
  const safeType = payload?.type || "cotizacion";
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");

  return `ByteTransfer_${safeType}_${yyyy}-${mm}-${dd}_${hh}-${mi}.png`;
}
