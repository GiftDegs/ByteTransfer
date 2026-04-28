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
const { readLatestSnapshot } = require("./snapshotStore");

const {
  readQuoteEngineConfig,
  writeQuoteEngineConfig,
  writeAuditLog,
} = require("./snapshotStore");

const quoteStrategyOverrides = {};

function replaceQuoteStrategyOverrides(nextOverrides = {}) {
  for (const key of Object.keys(quoteStrategyOverrides)) {
    delete quoteStrategyOverrides[key];
  }

  for (const [key, value] of Object.entries(nextOverrides || {})) {
    quoteStrategyOverrides[key] = value;
  }
}

async function loadQuoteStrategyOverridesFromStore() {
  try {
    const cfg = await readQuoteEngineConfig();
    replaceQuoteStrategyOverrides(cfg?.overrides || {});

    return {
      ok: true,
      overrides: clonar(quoteStrategyOverrides),
      source_updated_at: cfg?.updated_at || null,
    };
  } catch (e) {
    console.warn("⚠️ No se pudo cargar configuración persistida del motor:", e.message);

    return {
      ok: false,
      error: e.message,
      overrides: clonar(quoteStrategyOverrides),
    };
  }
}

async function persistQuoteStrategyOverridesToStore() {
  return writeQuoteEngineConfig({
    version: 1,
    overrides: clonar(quoteStrategyOverrides),
  });
}

function formatearTasa(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return +n.toFixed(6);
}

function clonar(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

function aplicarOverrideEnStrategy(strategy, override = {}) {
  const result = clonar(strategy);

if (result.provider === "binance") {
  if (override.amountMode) result.amountMode = override.amountMode;

  if (Array.isArray(override.payTypes)) {
    result.payTypes = override.payTypes;
  }

  if (Number.isFinite(Number(override.rows))) {
  result.rows = Number(override.rows);
}

if (["average", "median"].includes(override.aggregation)) {
  result.aggregation = override.aggregation;
}

if (Number.isFinite(Number(override.trimLowest))) {
  result.trimLowest = Math.max(0, Number(override.trimLowest));
}

if (Number.isFinite(Number(override.trimHighest))) {
  result.trimHighest = Math.max(0, Number(override.trimHighest));
}

  if (override.amountMode === "none") {
    delete result.amountUsdt;
    delete result.transAmount;
    result.amountMode = "none";
  }

  if (override.amountMode === "usdt") {
    result.amountMode = "usdt";
    result.amountUsdt = Number(override.amountUsdt);
    delete result.transAmount;
  }

  return result;
}

  if (Array.isArray(result.providers)) {
    result.providers = result.providers.map((p) => {
      if (p.provider !== "binance") return p;

      const next = { ...p };

if (Array.isArray(override.payTypes)) {
  next.payTypes = override.payTypes;
}

if (Number.isFinite(Number(override.rows))) {
  next.rows = Number(override.rows);
}

if (["average", "median"].includes(override.aggregation)) {
  next.aggregation = override.aggregation;
}

if (Number.isFinite(Number(override.trimLowest))) {
  next.trimLowest = Math.max(0, Number(override.trimLowest));
}

if (Number.isFinite(Number(override.trimHighest))) {
  next.trimHighest = Math.max(0, Number(override.trimHighest));
}

if (override.amountMode === "none") {
  delete next.amountUsdt;
  delete next.transAmount;
  next.amountMode = "none";
}

if (override.amountMode === "usdt") {
  next.amountMode = "usdt";
  next.amountUsdt = Number(override.amountUsdt);
  delete next.transAmount;
}

return next;
    });
  }

  return result;
}

function getEffectiveQuoteStrategies() {
  const base = clonar(quoteStrategies);

  for (const [key, override] of Object.entries(quoteStrategyOverrides)) {
    const [code, side] = key.split(".");
    if (!base?.[code]?.[side]) continue;

    base[code][side] = aplicarOverrideEnStrategy(base[code][side], override);
  }

  return base;
}

async function applyQuoteStrategyAmountOverrides(changes = [], meta = {}) {
  const beforeOverrides = clonar(quoteStrategyOverrides);
  const applied = [];

  for (const item of changes) {
    const code = String(item?.code || "").toUpperCase();
    const side = String(item?.side || "").toLowerCase();

    if (!["buy", "sell"].includes(side)) continue;
    if (!quoteStrategies?.[code]?.[side]) continue;

    const key = `${code}.${side}`;

    if (item.amountMode === "none") {
      const prev = quoteStrategyOverrides[key] || {};

      quoteStrategyOverrides[key] = {
        ...prev,
        amountMode: "none",
      };

      delete quoteStrategyOverrides[key].amountUsdt;
      delete quoteStrategyOverrides[key].transAmount;

      applied.push({ code, side, amountMode: "none" });
      continue;
    }

    const amountUsdt = Number(item?.amountUsdt);

    if (!Number.isFinite(amountUsdt) || amountUsdt <= 0) continue;

const prev = quoteStrategyOverrides[key] || {};

quoteStrategyOverrides[key] = {
  ...prev,
  amountMode: "usdt",
  amountUsdt,
};

delete quoteStrategyOverrides[key].transAmount;

    applied.push({ code, side, amountMode: "usdt", amountUsdt });
  }

  const persisted = await persistQuoteStrategyOverridesToStore();

  const audit = await writeAuditLog({
    area: "quote_engine",
    action: "update_amount_overrides",
    entity_key: "quote_engine_config",
    actor: meta.actor || "admin",
    source: meta.source || "admin_panel",
    before_value: beforeOverrides,
    after_value: clonar(quoteStrategyOverrides),
    metadata: {
      applied,
      persisted_storage: persisted?.storage || null,
    },
  });

  return {
    applied,
    overrides: clonar(quoteStrategyOverrides),
    strategies: getEffectiveQuoteStrategies(),
    persisted,
    audit,
  };
}

async function applyQuoteStrategyPaytypeOverrides(changes = [], meta = {}) {
  const beforeOverrides = clonar(quoteStrategyOverrides);
  const applied = [];

  for (const item of changes) {
    const code = String(item?.code || "").toUpperCase();
    const payTypes = Array.isArray(item?.payTypes)
      ? item.payTypes.map(String).filter(Boolean)
      : [];

    if (!quoteStrategies?.[code]) continue;

    for (const side of ["buy", "sell"]) {
      if (!quoteStrategies?.[code]?.[side]) continue;

      const key = `${code}.${side}`;
      const prev = quoteStrategyOverrides[key] || {};

      quoteStrategyOverrides[key] = {
        ...prev,
        payTypes,
      };
    }

    applied.push({
      code,
      payTypes,
    });
  }

  const persisted = await persistQuoteStrategyOverridesToStore();

  const audit = await writeAuditLog({
    area: "quote_engine",
    action: "update_paytype_overrides",
    entity_key: "quote_engine_config",
    actor: meta.actor || "admin",
    source: meta.source || "admin_panel",
    before_value: beforeOverrides,
    after_value: clonar(quoteStrategyOverrides),
    metadata: {
      applied,
      persisted_storage: persisted?.storage || null,
    },
  });

  return {
    applied,
    overrides: clonar(quoteStrategyOverrides),
    strategies: getEffectiveQuoteStrategies(),
    persisted,
    audit,
  };
}

async function applyQuoteStrategyAdvancedOverrides(changes = [], meta = {}) {
  const beforeOverrides = clonar(quoteStrategyOverrides);
  const applied = [];

  for (const item of changes) {
    const code = String(item?.code || "").toUpperCase();
    const side = String(item?.side || "").toLowerCase();

    if (!["buy", "sell"].includes(side)) continue;
    if (!quoteStrategies?.[code]?.[side]) continue;

    const key = `${code}.${side}`;
    const prev = quoteStrategyOverrides[key] || {};

    const next = {
      ...prev,
    };

    const rows = Number(item?.rows);
    const trimLowest = Number(item?.trimLowest);
    const trimHighest = Number(item?.trimHighest);
    const aggregation = String(item?.aggregation || "").toLowerCase();

    if (Number.isFinite(rows) && rows >= 1) {
      next.rows = Math.max(1, Math.min(rows, 100));
    }

    if (["average", "median"].includes(aggregation)) {
      next.aggregation = aggregation;
    }

    if (Number.isFinite(trimLowest) && trimLowest >= 0) {
      next.trimLowest = Math.max(0, Math.min(trimLowest, 10));
    }

    if (Number.isFinite(trimHighest) && trimHighest >= 0) {
      next.trimHighest = Math.max(0, Math.min(trimHighest, 10));
    }

    quoteStrategyOverrides[key] = next;

    applied.push({
      code,
      side,
      rows: next.rows,
      aggregation: next.aggregation,
      trimLowest: next.trimLowest,
      trimHighest: next.trimHighest,
    });
  }

  const persisted = await persistQuoteStrategyOverridesToStore();

  const audit = await writeAuditLog({
    area: "quote_engine",
    action: "update_advanced_overrides",
    entity_key: "quote_engine_config",
    actor: meta.actor || "admin",
    source: meta.source || "admin_panel",
    before_value: beforeOverrides,
    after_value: clonar(quoteStrategyOverrides),
    metadata: {
      applied,
      persisted_storage: persisted?.storage || null,
    },
  });

  return {
    applied,
    overrides: clonar(quoteStrategyOverrides),
    strategies: getEffectiveQuoteStrategies(),
    persisted,
    audit,
  };
}

function getStrategy(currency, side) {
  const code = String(currency || "").toUpperCase();
  const cleanSide = String(side || "").toLowerCase();

  const effectiveStrategies = getEffectiveQuoteStrategies();
  const strategy = effectiveStrategies?.[code]?.[cleanSide];

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

async function callBinanceP2PPaginated({
  fiat,
  tradeType,
  payTypes = [],
  transAmount = null,
  rows = 20,
  page = 1,
}) {
  const targetRows = Math.max(1, Math.min(Number(rows) || 20, 100));
  const startPage = Math.max(1, Number(page) || 1);

  const collected = [];
  const seen = new Set();

  const maxPages = Math.max(1, Math.ceil(targetRows / 20) + 2);

  for (let i = 0; i < maxPages; i++) {
    const currentPage = startPage + i;

    const data = await callBinanceP2P({
      fiat,
      tradeType,
      page: currentPage,
      payTypes,
      transAmount,
    });

    const items = Array.isArray(data?.data) ? data.data : [];

    if (!items.length) break;

    for (const item of items) {
      const adv = item?.adv || {};
      const advertiser = item?.advertiser || {};

      const key = [
        adv.advNo || adv.advNoStr || "",
        advertiser.userNo || advertiser.nickName || advertiser.userName || "",
        adv.price || "",
        adv.minSingleTransAmount || "",
        adv.maxSingleTransAmount || "",
      ].join("|");

      if (seen.has(key)) continue;
      seen.add(key);

      collected.push(item);

      if (collected.length >= targetRows) break;
    }

    if (collected.length >= targetRows) break;
    if (items.length < 20) break;
  }

  return {
    data: collected.slice(0, targetRows),
    pages_fetched: maxPages,
    requested_rows: targetRows,
    returned_rows: collected.length,
  };
}

async function resolveBinanceStrategy(currency, strategy) {
  let transAmountFinal = strategy.transAmount ?? null;
  let probePrice = null;

  const amountMode = strategy.amountMode || "fixed";
  const amountUsdt = Number(strategy.amountUsdt);

  // Si la estrategia trabaja por monto operativo en USDT,
  // primero hacemos una consulta rápida sin monto para estimar equivalencia local.
  if (amountMode === "usdt" && Number.isFinite(amountUsdt) && amountUsdt > 0) {
    const probeData = await callBinanceP2P({
      fiat: currency,
      tradeType: strategy.tradeType,
      page: strategy.page || 1,
      payTypes: strategy.payTypes || [],
      transAmount: null,
    });

    const probeItems = probeData?.data || [];
    const probePrices = [];

    for (const item of probeItems) {
      const adv = item?.adv;
      if (!adv) continue;

      const price = Number(adv.price);
      if (!Number.isFinite(price) || price <= 0) continue;
      if (adv.isAdvBanned) continue;

      probePrices.push(price);
      if (probePrices.length >= 10) break;
    }

    probePrice = aggregatePrices(probePrices, {
      aggregation: strategy.probeAggregation || "average",
      trimLowest: 0,
      trimHighest: 0,
    });

    if (Number.isFinite(Number(probePrice)) && Number(probePrice) > 0) {
      transAmountFinal = Math.round(Number(amountUsdt) * Number(probePrice));
    }
  }

const rows = Math.max(
  1,
  Math.min(Number(strategy.rows) || 20, 100)
);

const data = await callBinanceP2PPaginated({
  fiat: currency,
  tradeType: strategy.tradeType,
  page: strategy.page || 1,
  payTypes: strategy.payTypes || [],
  transAmount: transAmountFinal,
  rows,
});

const items = Array.isArray(data?.data) ? data.data : [];
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
    amountMode,
    amountUsdt: amountMode === "usdt" && Number.isFinite(amountUsdt) ? amountUsdt : null,
    probePrice: probePrice ?? null,
    transAmount: transAmountFinal ?? null,
payTypes: Array.isArray(strategy.payTypes) ? strategy.payTypes : [],
pagesFetched: data.pages_fetched,
returnedRows: data.returned_rows,
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

async function resolveSnapshotStrategy(currency, side) {
  const snap = await readLatestSnapshot();

  const block = snap?.snapshot || snap || {};
  const row = block?.[currency];

  if (!row) {
    throw new Error(`Snapshot sin datos para ${currency}`);
  }

  const field = side === "buy" ? "compra" : "venta";
  const price = Number(row[field]);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Snapshot inválido para ${currency}.${field}`);
  }

  return {
    price: formatearTasa(price),
    provider: "snapshot",
    source: "latest_snapshot",
    stale: true,
    fallback: true,
    fallback_reason: "latest_snapshot",
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

  const strategies = Array.isArray(strategy.providers)
    ? strategy.providers
    : [strategy];

  let lastError = null;

  for (const current of strategies) {
    try {
      let result;

      if (current.provider === "binance") {
        result = await resolveBinanceStrategy(code, current);
      } else if (current.provider === "ptax") {
        result = await resolvePtaxStrategy(cleanSide, context);
      } else if (current.provider === "derived") {        
        result = await resolveDerivedStrategy(current, context);
      } else if (current.provider === "snapshot") {
        result = await resolveSnapshotStrategy(code, cleanSide);
      } else if (current.provider === "snapshot") {
        throw new Error("snapshot provider se resuelve por fallback final");
      } else {
        throw new Error(`Provider no soportado: ${current.provider}`);
      }

      const price = Number(result?.price);

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error(`Precio inválido para ${key}`);
      }

      context[key] = result;
      saveLastGoodQuote(code, cleanSide, result);
      return result;
    } catch (e) {
      lastError = e;
    }
  }

  const fallback = getLastGoodQuote(code, cleanSide, lastError?.message);

  if (fallback) {
    context[key] = fallback;
    return fallback;
  }

  return {
    price: null,
    provider: "unknown",
    source: "unknown",
    stale: true,
    fallback: true,
    fallback_reason: "no_last_good_available",
    error: lastError?.message || "Sin fuentes disponibles",
    captured_at: new Date().toISOString(),
  };
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
  getEffectiveQuoteStrategies,
  applyQuoteStrategyAmountOverrides,
  applyQuoteStrategyPaytypeOverrides,
  applyQuoteStrategyAdvancedOverrides,
    loadQuoteStrategyOverridesFromStore,
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