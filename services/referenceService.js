const { getBcvRates } = require("./bcvService");
const { resolveCurrencyQuotes } = require("./quoteResolverService");

function formatearTasa(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return +n.toFixed(6);
}

async function getUsdtVesRefs() {
  const quotes = await resolveCurrencyQuotes("VES");

  const buy = Number(quotes?.buy?.price);
  const sell = Number(quotes?.sell?.price);

  if (!Number.isFinite(buy) || buy <= 0) {
    throw new Error("VES compra inválida desde motor configurable");
  }

  if (!Number.isFinite(sell) || sell <= 0) {
    throw new Error("VES venta inválida desde motor configurable");
  }

  const mid = (buy + sell) / 2;

  return {
    buy: formatearTasa(buy),
    sell: formatearTasa(sell),
    mid: formatearTasa(mid),
    source: "quote_engine",
    provider: "motor",
    captured_at: new Date().toISOString(),
    fallback: !!quotes?.buy?.fallback || !!quotes?.sell?.fallback,
    stale: !!quotes?.buy?.stale || !!quotes?.sell?.stale,
    buy_source: quotes?.buy?.source || null,
    sell_source: quotes?.sell?.source || null,
    buy_provider: quotes?.buy?.provider || null,
    sell_provider: quotes?.sell?.provider || null,
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
      source: "quote_engine",
      provider: "motor",
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