const {
  readLatestSnapshotFromDb,
  readLocalSnapshot,
  isDbAvailable,
} = require("./snapshotStore");

const axios = require("axios");

let lastGoodBrl = null;

function formatPtaxDateBR(d = new Date()) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function subDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

async function getBcbUsdBrlPtaxByDate(date = new Date()) {
  const dataStr = formatPtaxDateBR(date);

  const url =
    `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/` +
    `CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?` +
    `@moeda='USD'&@dataCotacao='${dataStr}'&$top=1&$format=json`;

  const { data } = await axios.get(url, {
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const row = data?.value?.[0] || null;
  const buy = Number(row?.cotacaoCompra);
  const sell = Number(row?.cotacaoVenda);

  if (!Number.isFinite(buy) || !Number.isFinite(sell)) {
    return null;
  }

  return {
    source: "ptax",
    buy,
    sell,
    ptax_date: dataStr,
    captured_at: new Date().toISOString(),
    stale: false,
    fallback: false,
  };
}

async function getLatestValidPtax({ maxLookbackDays = 7 } = {}) {
  for (let i = 0; i <= maxLookbackDays; i++) {
    try {
      const result = await getBcbUsdBrlPtaxByDate(subDays(new Date(), i));
      if (result) {
        result.stale = i > 0;
        result.fallback_reason = i > 0 ? "last_valid_business_day" : null;
        lastGoodBrl = result;
        return result;
      }
    } catch (_) {
      // probar día anterior
    }
  }

  return null;
}

async function getBrlFromSnapshotFallback() {
  try {
    const snap = isDbAvailable()
      ? await readLatestSnapshotFromDb()
      : readLocalSnapshot();

    const compra = Number(snap?.BRL?.compra);
    const venta = Number(snap?.BRL?.venta);

    if (!Number.isFinite(compra) || compra <= 0) return null;
    if (!Number.isFinite(venta) || venta <= 0) return null;

    return {
      source: "snapshot_fallback",
      buy: compra,
      sell: venta,
      stale: true,
      fallback: true,
      fallback_reason: "latest_snapshot",
      captured_at: new Date().toISOString(),
    };
  } catch (e) {
    return null;
  }
}

async function getDynamicBrlPrice() {
  try {
    const ptax = await getLatestValidPtax({ maxLookbackDays: 7 });
    if (ptax) return ptax;
  } catch (e) {
    console.warn("⚠️ BRL PTAX falló:", e.message);
  }

  if (lastGoodBrl) {
    return {
      ...lastGoodBrl,
      stale: true,
      fallback: true,
      fallback_reason: "last_good_memory",
      captured_at: new Date().toISOString(),
    };
  }

  const snapshotFallback = await getBrlFromSnapshotFallback();
  if (snapshotFallback) {
    return snapshotFallback;
  }

  return {
    source: "emergency_fallback",
    buy: 5.15,
    sell: 5.15,
    stale: true,
    fallback: true,
    fallback_reason: "hardcoded_emergency",
    captured_at: new Date().toISOString(),
  };
}

module.exports = {
  getDynamicBrlPrice,
  getLatestValidPtax,
  getBcbUsdBrlPtaxByDate,
  getBrlFromSnapshotFallback,
};