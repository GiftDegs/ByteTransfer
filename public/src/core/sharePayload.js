// public/src/core/sharePayload.js

import { getCountryLabel, getCurrencyShortLabel, getRouteLabel } from "./labels.js";
import { formatearResultadoRaw, formatearTasa } from "./utils.js";

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
    footerLeftLabel: "Referencia vigente",
    footerLeftValue: updatedAt,
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
    footerLeftLabel: "Tasa vigente",
    footerLeftValue: updatedAt,
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
    footerLeftLabel: "Tasa vigente",
    footerLeftValue: result.fecha || "",
    footerRightLabel: "Cotizado",
    footerRightValue: formatShareCurrentTimestamp(),
    rows: [],
  };

  if (result.type === "send_amount") {
    return {
      ...base,
      primaryLabel: "Recibe",
      primaryValue: formatearResultadoRaw(result.recibe?.amount),
      primaryUnit: result.recibe?.currencyLabel,
      primaryRaw: true,
      primaryRole: "destination",
      rows: [
        buildFlowSideRow("origin", result.envia),
        { label: "Tasa aplicada", value: formatShareRateForDisplay(result.tasaVisible), unit: null, raw: true },
        ...buildVenezuelaEquivalentRows(result.recibe, result),
      ],
    };
  }

  if (result.type === "receive_amount") {
    return {
      ...base,
      primaryLabel: "Debes enviar",
      primaryValue: formatearResultadoRaw(result.debeEnviar?.amount),
      primaryUnit: result.debeEnviar?.currencyLabel,
      primaryRaw: true,
      primaryRole: "origin",
      rows: [
        buildFlowSideRow("destination", result.recibe),
        { label: "Tasa aplicada", value: formatShareRateForDisplay(result.tasaVisible), unit: null, raw: true },
        ...buildVenezuelaEquivalentRows(result.recibe, result),
      ],
    };
  }

  if (result.type === "receive_bcv_usd") {
    return {
      ...base,
      primaryLabel: "Debes enviar",
      primaryValue: formatearResultadoRaw(result.debeEnviar?.amount),
      primaryUnit: result.debeEnviar?.currencyLabel,
      primaryRaw: true,
      primaryRole: "origin",
      rows: [
        buildFlowSideRow("destination", {
          amount: result.vesObjetivo,
          currencyCode: "VES",
          currencyLabel: "bolívares",
        }),
        buildSplitMetricRow("Deseas recibir", formatearResultadoRaw(result.usdDeseados), "dólares", { raw: true }),
        buildReferenceMetricRow(result),
        { label: "Tasa aplicada", value: formatShareRateForDisplay(result.tasaVisible), unit: null, raw: true },
      ],
    };
  }

  return null;
}

function buildFlowSideRow(role, item) {
  return {
    type: "flow_side",
    role,
    side: buildFlowSide(role, item),
  };
}

function buildFlowSide(role, item) {
  const currencyCode = item?.currencyCode || "";
  const country = getCountryLabel(currencyCode);
  const actionLabel = role === "origin" ? "Envías" : "Recibes";

  return {
    role,
    country,
    actionLabel,
    label: actionLabel,
    value: formatearResultadoRaw(item?.amount),
    unit: item?.currencyLabel || getCurrencyShortLabel(currencyCode),
  };
}
function buildSplitMetricRow(label, value, unit, options = {}) {
  return {
    type: "split_metric",
    label,
    value,
    unit,
    raw: Boolean(options.raw),
    variant: options.variant || "default",
    computed: options.computed || null,
    sourceAmount: options.sourceAmount ?? null,
  };
}

function buildReferenceMetricRow(result) {
  const referenceInfo = getBcvReferenceInfo(result);

  return buildSplitMetricRow(
    "Referencia",
    referenceInfo.value,
    referenceInfo.detail,
    {
      raw: true,
      variant: "reference",
    }
  );
}

function getBcvReferenceInfo(result = {}) {
  const rawName = String(result.bcvReference || "Dólar BCV");
  const isCustom = Boolean(result.bcvReferenceIsCustom) || /personal/i.test(rawName);
  const isEuro = /euro|eur/i.test(rawName);
  const rate = formatCompactShareNumber(result.bcvRate);

  if (isCustom) {
    return {
      label: "tasa personalizada",
      value: "Personalizada",
      detail: buildReferenceRateDetail("USD", rate),
    };
  }

  if (isEuro) {
    return {
      label: "tasa euro BCV",
      value: rawName || "Euro BCV",
      detail: buildReferenceRateDetail("EUR", rate),
    };
  }

  return {
    label: "tasa dólar BCV",
    value: rawName || "Dólar BCV",
    detail: buildReferenceRateDetail("USD", rate),
  };
}

function buildReferenceRateDetail(code, rate) {
  if (!rate || rate === "—") return "";
  return `1 ${code} = ${rate} bolívares`;
}
function formatCompactShareNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(n);
}

function formatShareCurrentTimestamp(date = new Date()) {
  const value = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Caracas",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${value.replace(",", " ·")} VZLA`;
}

function buildVenezuelaEquivalentRows(amountObj, result = {}) {
  if (amountObj?.currencyCode !== "VES") return [];

  const referenceInfo = getBcvReferenceInfo(result);

  return [
    buildSplitMetricRow(
      `Equivalente a ${referenceInfo.label}`,
      amountObj.usdEquivalent ?? null,
      "dólares",
      {
        computed: "ves_to_usd",
        sourceAmount: amountObj.amount,
      }
    ),
  ];
}

export function formatShareRateForDisplay(value) {
  const formatted = formatearTasa(value);
  return formatted && formatted !== "—" ? formatted : String(value || "—");
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
    if (rowOrValue.raw) {
      const value = String(rowOrValue.value || "—");
      return rowOrValue.unit ? `${value} ${rowOrValue.unit}` : value;
    }

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
