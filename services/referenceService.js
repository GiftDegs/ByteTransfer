const { getBcvRates } = require("./bcvService");
const { binanceAvgPriceTop20 } = require("./binanceService");

function formatearTasa(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return +n.toFixed(6);
}

async function getUsdtVesRefs() {
  const buy = await binanceAvgPriceTop20("VES", "BUY");
  const sell = buy ? Number((buy * 0.9975).toFixed(6)) : null;
  const mid = buy && sell ? Number(((buy + sell) / 2).toFixed(6)) : (buy ?? sell ?? null);

  return {
    buy: buy ? formatearTasa(buy) : null,
    sell: sell ? formatearTasa(sell) : null,
    mid: mid ? formatearTasa(mid) : null,
    source: "binance_p2p",
    captured_at: new Date().toISOString(),
    fallback: false,
    stale: false,
  };
}

async function getReferencias() {
  const errores = [];

  let bcv = null;
  let usdt_ves = null;

  try {
    bcv = await getBcvRates();
  } catch (e) {
    errores.push(`bcv: ${e.message}`);
    bcv = {
      usd: null,
      eur: null,
      fuente: "bcv_failed",
      captured_at: new Date().toISOString(),
      stale: true,
      fallback: true,
      error: e.message,
    };
  }

  try {
    usdt_ves = await getUsdtVesRefs();
  } catch (e) {
    errores.push(`usdt_ves: ${e.message}`);
    usdt_ves = {
      buy: null,
      sell: null,
      mid: null,
      source: "binance_p2p",
      captured_at: new Date().toISOString(),
      stale: true,
      fallback: true,
      error: e.message,
    };
  }

  return {
    bcv,
    usdt_ves,
    actualizado_en: new Date().toISOString(),
    ok: errores.length === 0,
    errores,
  };
}

module.exports = {
  getReferencias,
  getUsdtVesRefs,
};