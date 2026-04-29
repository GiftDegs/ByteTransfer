const axios = require("axios");

// ---- BINANCE con cache simple ----
const binanceCache = new Map();
const BINANCE_TTL_MS = 45 * 1000;

async function callBinanceP2P({ fiat, tradeType, page = 1, payTypes = [], transAmount }) {
  const key = `${fiat}|${tradeType}|${page}|${(payTypes || []).join(",")}|${transAmount || ""}`;
  const now = Date.now();
  const cached = binanceCache.get(key);

  if (cached && now - cached.t < BINANCE_TTL_MS) {
    return cached.data;
  }

  try {
    const { data } = await axios.post(
      "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
      {
        page,
        rows: 20,
        payTypes,
        asset: "USDT",
        tradeType,
        fiat,
        transAmount,
        order: null,
        orderColumn: "price",
      },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );

    binanceCache.set(key, { t: now, data });
    return data;
  } catch (error) {
    console.error("❌ Binance:", error?.message);

    if (cached) return cached.data;

    throw new Error("Fallo conexión Binance");
  }
}

async function fetchPrecio(fiat, tipo, opts = {}) {
  try {
    const { resolveQuote } = require("./quoteResolverService");

    const side = String(tipo || "").toUpperCase() === "BUY" ? "buy" : "sell";
    const result = await resolveQuote(fiat, side);

    const price = Number(result?.price);
    if (!Number.isFinite(price) || price <= 0) return null;

    return Number(price.toFixed(6));
  } catch (e) {
    console.error("❌ fetchPrecio resolver:", fiat, tipo, e.message || e);
    return null;
  }
}

module.exports = {
  callBinanceP2P,
  fetchPrecio,
};