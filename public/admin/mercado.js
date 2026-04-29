"use strict";

// =====================================================
// MERCADO
// =====================================================
function normalizarTipoCotizacion(tipo) {
  const t = String(tipo || "").toUpperCase();

  if (t === "BUY" || t === "COMPRA") {
    return {
      tradeType: "BUY",
      campo: "compra",
    };
  }

  return {
    tradeType: "SELL",
    campo: "venta",
  };
}

function obtenerPrecioQuoteMotor(quote) {
  const precio = Number(quote?.price);

  if (!Number.isFinite(precio) || precio <= 0) return null;

  return Number(precio.toFixed(2));
}

function construirAuditDesdeQuoteMotor(payload = {}) {
  return {
    raw_count: payload?.raw_count ?? null,
    used_count: payload?.used_count ?? null,
    aggregation: payload?.aggregation ?? null,
    trimLowest: payload?.trimLowest ?? null,
    trimHighest: payload?.trimHighest ?? null,
    transAmount: payload?.transAmount ?? null,
    payTypes: payload?.payTypes ?? [],
    amountMode: payload?.amountMode ?? null,
    amountUsdt: payload?.amountUsdt ?? null,
    probePrice: payload?.probePrice ?? null,
    pagesFetched: payload?.pagesFetched ?? null,
    returnedRows: payload?.returnedRows ?? null,
  };
}

function guardarMetadataCotizacionMotor(fiat, tipo, payload, precio) {
  const code = String(fiat || "").toUpperCase();
  const { tradeType, campo } = normalizarTipoCotizacion(tipo);

  if (!code || !campo) return;

  if (!metadataCotizacionesMotor) {
    metadataCotizacionesMotor = {};
  }

  if (!metadataCotizacionesMotor[code]) {
    metadataCotizacionesMotor[code] = {};
  }

  metadataCotizacionesMotor[code][campo] = {
    fiat: code,
    campo,
    tradeType,
    precio,
    price: precio,
    provider: payload?.provider || null,
    source: payload?.source || null,
    stale: !!payload?.stale,
    fallback: !!payload?.fallback,
    fallback_reason: payload?.fallback_reason || null,
    raw_count: payload?.raw_count ?? null,
    used_count: payload?.used_count ?? null,
    aggregation: payload?.aggregation ?? null,
    trimLowest: payload?.trimLowest ?? null,
    trimHighest: payload?.trimHighest ?? null,
    transAmount: payload?.transAmount ?? null,
    payTypes: payload?.payTypes ?? [],
    amountMode: payload?.amountMode ?? null,
    amountUsdt: payload?.amountUsdt ?? null,
    probePrice: payload?.probePrice ?? null,
    pagesFetched: payload?.pagesFetched ?? null,
    returnedRows: payload?.returnedRows ?? null,
    audit: payload?.audit || construirAuditDesdeQuoteMotor(payload),
    captured_at: payload?.captured_at || new Date().toISOString(),
  };
}

async function obtenerCotizacionesMotorConsolidadas() {
  const res = await fetch("/api/debug/quotes", {
    cache: "no-store",
    headers: {
      "x-admin-key": getAdminKey(),
    },
  });

  if (!res.ok) {
    throw new Error(`No se pudo consultar motor configurable: HTTP ${res.status}`);
  }

  const data = await res.json();
  const results = data?.results || {};
  const resultado = {};

  metadataCotizacionesMotor = {};

  for (const p of paises) {
    const fiat = p.fiat;
    const item = results?.[fiat] || {};

    const compra = obtenerPrecioQuoteMotor(item?.buy);
    const venta = obtenerPrecioQuoteMotor(item?.sell);

    resultado[fiat] = {
      compra,
      venta,
    };

    if (compra != null) {
      guardarMetadataCotizacionMotor(fiat, "BUY", item.buy, compra);
    }

    if (venta != null) {
      guardarMetadataCotizacionMotor(fiat, "SELL", item.sell, venta);
    }
  }

  return {
    datos: resultado,
    raw: data,
  };
}