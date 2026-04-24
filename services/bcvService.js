const axios = require("axios");

let lastGoodBcv = null;

function formatearTasa(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return +n.toFixed(6);
}

function normalizarNumero(str) {
  if (str == null) return null;
  const s = String(str).trim();
  const sinMiles = s.replace(/\.(?=\d{3}(\D|$))/g, "");
  const puntoDecimal = sinMiles.replace(",", ".");
  const n = Number(puntoDecimal);
  return Number.isFinite(n) ? n : null;
}

function pickNumber(html, patterns) {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) {
      const n = normalizarNumero(m[1]);
      if (n != null && n < 10) continue;
      if (n != null) return formatearTasa(n);
    }
  }
  return null;
}

function parseMercantil(html) {
  const h = String(html);
  const anchor = h.match(/Tipo de Cambio de Referencia BCV[\s\S]{0,5000}/i);
  const block = anchor ? anchor[0] : null;
  if (!block) return null;

  const tbodyMatch = block.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return null;

  const tbody = tbodyMatch[1];
  const firstRowMatch = tbody.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
  if (!firstRowMatch) return null;

  const firstRow = firstRowMatch[1];
  const tdMatches = [...firstRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()
  );

  if (tdMatches.length < 2) return null;

  const usdNum = normalizarNumero(tdMatches[0]);
  const eurNum = normalizarNumero(tdMatches[1]);

  if (!Number.isFinite(usdNum) || !Number.isFinite(eurNum)) return null;

  const usd = formatearTasa(usdNum);
  const eur = formatearTasa(eurNum);

  if (usd < 50 || eur < 50) return null;

  return {
    usd,
    eur,
    fecha: null,
    fuente: "mercantil",
  };
}

async function getFromMercantil() {
  const { data } = await axios.get(
    "https://www.mercantilbanco.com/informacion/tasas%2C-tarifas-y-comisiones/tasa-mesa-de-cambio",
    {
      timeout: 15000,
      headers: { "User-Agent": "Mozilla/5.0" },
    }
  );

  return parseMercantil(String(data));
}

function parseBancoExterior(html) {
  const h = String(html);

  const usd = pickNumber(h, [
    /USD\/EUR[\s\S]{0,350}?\$\s*([0-9]+[.,][0-9]{2,10})/i,
  ]);

  const eur = pickNumber(h, [
    /USD\/EUR[\s\S]{0,350}?€\s*([0-9]+[.,][0-9]{2,10})/i,
  ]);

  const fechaMatch =
    h.match(/Fecha\s*valor:\s*[\s\S]{0,60}?(\d{2}\/\d{2}\/\d{4})/i) ||
    h.match(/(\d{2}\/\d{2}\/\d{4})/);

  const fecha = fechaMatch ? fechaMatch[1] : null;

  if (!usd && !eur) return null;

  return {
    usd,
    eur,
    fecha,
    fuente: "bancoexterior",
  };
}

async function getFromBancoExterior() {
  const { data } = await axios.get("https://www.bancoexterior.com/tasas-bcv/", {
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  return parseBancoExterior(String(data));
}

function normalizarBcvResult(raw, extra = {}) {
  if (!raw?.usd || !raw?.eur) return null;

  return {
    usd: formatearTasa(raw.usd),
    eur: formatearTasa(raw.eur),
    fecha: raw.fecha || null,
    fuente: raw.fuente || "unknown",
    captured_at: new Date().toISOString(),
    stale: false,
    fallback: false,
    ...extra,
  };
}

async function getBcvRates() {
  const errores = [];

  try {
    const m = await getFromMercantil();
    const ok = normalizarBcvResult(m);
    if (ok) {
      lastGoodBcv = ok;
      return ok;
    }
  } catch (e) {
    errores.push(`mercantil: ${e.message}`);
  }

  try {
    const be = await getFromBancoExterior();
    const ok = normalizarBcvResult(be);
    if (ok) {
      lastGoodBcv = ok;
      return ok;
    }
  } catch (e) {
    errores.push(`bancoexterior: ${e.message}`);
  }

  if (lastGoodBcv) {
    return {
      ...lastGoodBcv,
      captured_at: new Date().toISOString(),
      stale: true,
      fallback: true,
      fallback_reason: "last_good_memory",
      errors: errores,
    };
  }

  return {
    usd: null,
    eur: null,
    fecha: null,
    fuente: "bcv_failed",
    captured_at: new Date().toISOString(),
    stale: true,
    fallback: true,
    fallback_reason: "no_provider_available",
    errors: errores,
  };
}

module.exports = {
  getBcvRates,
  getFromMercantil,
  getFromBancoExterior,
};