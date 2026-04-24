"use strict";

// =====================================================
// BINANCE / MERCADO
// =====================================================
async function fetchPrecio(fiat, tipo) {
  if (fiat === "BRL") {
    try {
      const res = await fetch("/api/brl-price", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const j = await res.json();
      if (tipo === "BUY" && Number.isFinite(Number(j.buy))) return Number(j.buy.toFixed(2));
      if (tipo === "SELL" && Number.isFinite(Number(j.sell))) return Number(j.sell.toFixed(2));
    } catch (e) {
      console.error("❌ BRL dinámico:", e.message || e);
    }

    return tipo === "BUY" ? 5.5 : 5;
  }

  const USDT_LIMITE_VES = 150;
  const precios = [];

  try {
    if (tipo === "SELL" && fiat === "VES") {
      const precioCompra = await fetchPrecio(fiat, "BUY");
      if (!precioCompra) return null;
      return Number((precioCompra * 0.9975).toFixed(2));
    }

    const res = await fetch("/api/binance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fiat, tradeType: tipo, rows: 100 }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const comerciales = j.data || [];

    for (const item of comerciales) {
      const adv = item?.adv;
      if (!adv) continue;

      const precio = parseFloat(adv.price);
      const minVES = parseFloat(adv.minSingleTransAmount) || Infinity;
      const permitido = !adv.isAdvBanned;

      if (!precio || !permitido) continue;

      if (fiat === "VES" && tipo === "SELL") {
        const usdtNecesario = minVES / precio;
        if (usdtNecesario > USDT_LIMITE_VES) continue;
      }

      precios.push(precio);
      if (precios.length === 20) break;
    }

    if (!precios.length) return null;

    const promedio = precios.reduce((a, b) => a + b, 0) / precios.length;
    return Number(promedio.toFixed(2));
  } catch (e) {
    console.error("❌ fetchPrecio:", fiat, tipo, e.message || e);
    return null;
  }
}