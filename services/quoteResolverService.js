const lastGoodQuotes = new Map();

function buildQuoteKey(currency, side) {
  return `${String(currency || "").toUpperCase()}.${String(side || "").toLowerCase()}`;
}

function saveLastGoodQuote(currency, side, result) {
  const price = Number(result?.price);

  if (!Number.isFinite(price) || price <= 0) return;

  const key = buildQuoteKey(currency, side);

  lastGoodQuotes.set(key, {
    ...result,
    saved_at: new Date().toISOString(),
  });
}

function getLastGoodQuote(currency, side, errorMessage = null) {
  const key = buildQuoteKey(currency, side);
  const cached = lastGoodQuotes.get(key);

  if (!cached) return null;

  return {
    ...cached,
    stale: true,
    fallback: true,
    fallback_reason: "last_good_memory",
    error: errorMessage || null,
    captured_at: new Date().toISOString(),
  };
}

const { quoteStrategies } = require("../config/quoteStrategies");
const { callBinanceP2P } = require("./binanceService");
const { getDynamicBrlPrice } = require("./brlService");

function formatearTasa(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return +n.toFixed(6);
}

function getStrategy(currency, side) {
  const code = String(currency || "").toUpperCase();
  const cleanSide = String(side || "").toLowerCase();

  const strategy = quoteStrategies?.[code]?.[cleanSide];

  if (!strategy) {
    throw new Error(`No existe estrategia para ${code}.${cleanSide}`);
  }

  return strategy;
}

function aggregatePrices(prices, strategy = {}) {
  const aggregation = strategy.aggregation || "average";
  const trimLowest = Math.max(0, Number(strategy.trimLowest) || 0);
  const trimHighest = Math.max(0, Number(strategy.trimHighest) || 0);

  let nums = prices
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  if (!nums.length) return null;

  if (trimLowest || trimHighest) {
    nums = nums.slice(trimLowest, nums.length - trimHighest);
  }

  if (!nums.length) return null;

  if (aggregation === "median") {
    const mid = Math.floor(nums.length / 2);

    if (nums.length % 2 === 0) {
      return formatearTasa((nums[mid - 1] + nums[mid]) / 2);
    }

    return formatearTasa(nums[mid]);
  }

  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return formatearTasa(avg);
}

async function resolveBinanceStrategy(currency, strategy) {
  const data = await callBinanceP2P({
    fiat: currency,
    tradeType: strategy.tradeType,
    page: strategy.page || 1,
    payTypes: strategy.payTypes || [],
    transAmount: strategy.transAmount,
  });

  const rows = Number(strategy.rows) || 20;
  const items = data?.data || [];
  const prices = [];

  for (const item of items) {
    const adv = item?.adv;
    if (!adv) continue;

    const price = Number(adv.price);
    if (!Number.isFinite(price) || price <= 0) continue;

    if (adv.isAdvBanned) continue;

    prices.push(price);
    if (prices.length >= rows) break;
  }

  return {
    price: aggregatePrices(prices, strategy),
    provider: "binance",
    source: "binance_p2p",
    raw_count: prices.length,
    used_count: Math.max(
  0,
  prices.length -
    (Math.max(0, Number(strategy.trimLowest) || 0) +
      Math.max(0, Number(strategy.trimHighest) || 0))
    ),
    aggregation: strategy.aggregation || "average",
    trimLowest: Math.max(0, Number(strategy.trimLowest) || 0),
    trimHighest: Math.max(0, Number(strategy.trimHighest) || 0),
    transAmount: strategy.transAmount ?? null,
    payTypes: Array.isArray(strategy.payTypes) ? strategy.payTypes : [],
    stale: false,
    fallback: false,
    captured_at: new Date().toISOString(),
  };
}

async function resolvePtaxStrategy(side, context = {}) {
  if (!context.__ptax_brl) {
    context.__ptax_brl = await getDynamicBrlPrice();
  }

  const brl = context.__ptax_brl;
  const price = side === "buy" ? brl.buy : brl.sell;

  return {
    price: formatearTasa(price),
    provider: "ptax",
    source: brl.source || "ptax",
    stale: !!brl.stale,
    fallback: !!brl.fallback,
    fallback_reason: brl.fallback_reason || null,
    captured_at: new Date().toISOString(),
  };
}

async function resolveDerivedStrategy(strategy, context) {
  const [fromCurrency, fromSide] = String(strategy.from || "").split(".");
  if (!fromCurrency || !fromSide) {
    throw new Error(`Estrategia derived inválida: from=${strategy.from}`);
  }

  const baseKey = `${fromCurrency.toUpperCase()}.${fromSide.toLowerCase()}`;

  let baseResult = context?.[baseKey];

  if (!baseResult) {
    baseResult = await resolveQuote(fromCurrency, fromSide, context);
  }

  const basePrice = Number(baseResult?.price);
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return {
      price: null,
      provider: "derived",
      source: "derived",
      stale: true,
      fallback: true,
      error: `Base inválida para ${strategy.from}`,
      captured_at: new Date().toISOString(),
    };
  }

  let result = basePrice;

  if (strategy.operation === "multiply") {
    result = basePrice * Number(strategy.factor);
  } else if (strategy.operation === "divide") {
    result = basePrice / Number(strategy.factor);
  } else if (strategy.operation === "add") {
    result = basePrice + Number(strategy.amount);
  } else if (strategy.operation === "subtract") {
    result = basePrice - Number(strategy.amount);
  } else {
    throw new Error(`Operación derived no soportada: ${strategy.operation}`);
  }

  return {
    price: formatearTasa(result),
    provider: "derived",
    source: `derived:${strategy.from}`,
    base_price: formatearTasa(basePrice),
    operation: strategy.operation,
    factor: strategy.factor ?? null,
    amount: strategy.amount ?? null,
    stale: !!baseResult.stale,
    fallback: !!baseResult.fallback,
    captured_at: new Date().toISOString(),
  };
}

async function resolveQuote(currency, side, context = {}) {
  const code = String(currency || "").toUpperCase();
  const cleanSide = String(side || "").toLowerCase();
  const key = `${code}.${cleanSide}`;

  if (context[key]) return context[key];

  const strategy = getStrategy(code, cleanSide);

  try {
    let result;

    if (strategy.provider === "binance") {
      result = await resolveBinanceStrategy(code, strategy);
    } else if (strategy.provider === "ptax") {
      result = await resolvePtaxStrategy(cleanSide, context);
    } else if (strategy.provider === "derived") {
      result = await resolveDerivedStrategy(strategy, context);
    } else {
      throw new Error(`Provider no soportado: ${strategy.provider}`);
    }

    const price = Number(result?.price);

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Precio inválido para ${key}`);
    }

    context[key] = result;
    saveLastGoodQuote(code, cleanSide, result);

    return result;
  } catch (e) {
    const fallback = getLastGoodQuote(code, cleanSide, e.message);

    if (fallback) {
      context[key] = fallback;
      return fallback;
    }

    return {
      price: null,
      provider: strategy.provider || "unknown",
      source: strategy.provider || "unknown",
      stale: true,
      fallback: true,
      fallback_reason: "no_last_good_available",
      error: e.message,
      captured_at: new Date().toISOString(),
    };
  }
}

async function resolveCurrencyQuotes(currency) {
  const context = {};
  const code = String(currency || "").toUpperCase();

  const buy = await resolveQuote(code, "buy", context);
  const sell = await resolveQuote(code, "sell", context);

  const audit = buildCurrencyAudit({
    currency: code,
    buy,
    sell,
  });

  return {
    currency: code,
    buy,
    sell,
    audit,
    captured_at: new Date().toISOString(),
  };
}

module.exports = {
  resolveQuote,
  resolveCurrencyQuotes,
};

function calcularSpreadPct(buyPrice, sellPrice) {
  const buy = Number(buyPrice);
  const sell = Number(sellPrice);

  if (!Number.isFinite(buy) || !Number.isFinite(sell) || buy <= 0 || sell <= 0) {
    return null;
  }

  return formatearTasa(((buy - sell) / buy) * 100);
}

function getQuoteConfidence(quote) {
  if (!quote) return "low";
  if (quote.fallback || quote.stale) return "low";

  if (quote.provider === "binance") {
    const raw = Number(quote.raw_count) || 0;
    const used = Number(quote.used_count) || 0;

    if (raw >= 15 && used >= 12) return "high";
    if (raw >= 8 && used >= 6) return "medium";
    return "low";
  }

  if (quote.provider === "ptax") {
    return "high";
  }

  if (quote.provider === "derived") {
    return quote.fallback || quote.stale ? "low" : "medium";
  }

  return "medium";
}

function buildCurrencyAudit({ currency, buy, sell }) {
  const spread_pct = calcularSpreadPct(buy?.price, sell?.price);

  const buyConfidence = getQuoteConfidence(buy);
  const sellConfidence = getQuoteConfidence(sell);

  let confidence = "high";

  if (buyConfidence === "low" || sellConfidence === "low") {
    confidence = "low";
  } else if (buyConfidence === "medium" || sellConfidence === "medium") {
    confidence = "medium";
  }

  const warnings = [];

  if (buy?.fallback) warnings.push(`${currency}.buy usa fallback`);
  if (sell?.fallback) warnings.push(`${currency}.sell usa fallback`);
  if (buy?.stale) warnings.push(`${currency}.buy está stale`);
  if (sell?.stale) warnings.push(`${currency}.sell está stale`);

  if (spread_pct != null && Math.abs(spread_pct) > 3) {
    warnings.push(`${currency} spread alto: ${spread_pct}%`);
  }

  return {
    confidence,
    buy_confidence: buyConfidence,
    sell_confidence: sellConfidence,
    spread_pct,
    warnings,
  };
}