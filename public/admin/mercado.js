"use strict";

// =====================================================
// MERCADO
// =====================================================
function normalizarTipoCotizacion(tipo) {
  const t = String(tipo || "").toUpperCase();

  if (t === "BUY") {
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
    provider: payload?.provider || null,
    source: payload?.source || null,
    stale: !!payload?.stale,
    fallback: !!payload?.fallback,
    fallback_reason: payload?.fallback_reason || null,
    audit: payload?.audit || null,
    captured_at: new Date().toISOString(),
  };
}

async function fetchPrecio(fiat, tipo) {
  try {
    const { tradeType } = normalizarTipoCotizacion(tipo);

    const res = await fetch("/api/binance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        fiat,
        tradeType,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const j = await res.json();

    const precio =
      Number(j?.price) ||
      Number(j?.quote?.price) ||
      Number(j?.data?.[0]?.adv?.price);

    if (!Number.isFinite(precio) || precio <= 0) {
      console.warn("⚠️ Precio inválido desde /api/binance:", fiat, tipo, j);
      return null;
    }

    guardarMetadataCotizacionMotor(fiat, tradeType, j, precio);

    console.log(
      `✅ Motor único | ${String(fiat).toUpperCase()} ${tradeType} | ${precio} | ${j?.audit?.aggregation || "?"} | ${j?.audit?.used_count || "?"}/${j?.audit?.raw_count || "?"} anuncios | métodos: ${(j?.audit?.payTypes || []).join(", ") || "sin filtro"}`
    );

    return Number(precio.toFixed(2));
  } catch (e) {
    console.error("❌ fetchPrecio:", fiat, tipo, e.message || e);
    return null;
  }
}