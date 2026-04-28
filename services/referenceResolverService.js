const { referenceStrategies } = require("../config/quoteStrategies");
const { getBcvRates } = require("./bcvService");
const { getDynamicBrlPrice } = require("./brlService");

function formatear(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return +n.toFixed(6);
}

function getReferenceStrategy(code) {
  const key = String(code || "").toUpperCase();
  const strategy = referenceStrategies[key];

  if (!strategy) {
    throw new Error(`Referencia no configurada: ${key}`);
  }

  return strategy;
}

async function resolveReference(code) {
  const strategy = getReferenceStrategy(code);

  if (strategy.provider === "bcv") {
    const data = await getBcvRates();
    const field = String(strategy.currency || "USD").toLowerCase();

    const price = formatear(data[field]);

    return {
      code: String(code).toUpperCase(),
      price,
      provider: "bcv",
      source: data.fuente || "bcv",
      stale: !!data.stale,
      fallback: !!data.fallback,
      fallback_reason: data.fallback_reason || null,
      captured_at: data.captured_at,
    };
  }

  if (strategy.provider === "ptax") {
    const data = await getDynamicBrlPrice();

    return {
      code: String(code).toUpperCase(),
      price: formatear(data.buy),
      provider: "ptax",
      source: data.source || "ptax",
      stale: !!data.stale,
      fallback: !!data.fallback,
      fallback_reason: data.fallback_reason || null,
      captured_at: data.captured_at,
    };
  }

  throw new Error(`Provider referencia no soportado: ${strategy.provider}`);
}

module.exports = {
  resolveReference,
};