const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Config Gist (persistencia) ----------
const GIST_ID = process.env.GIST_ID;
const GIST_FILENAME = process.env.GIST_FILENAME || "snapshot.json";
const GH_TOKEN = process.env.GH_TOKEN;
const USE_GIST = !!(GIST_ID && GH_TOKEN);

// Auth opcional para guardar (solo si seteas ADMIN_KEY)
const ADMIN_KEY = process.env.ADMIN_KEY || null;

// ---------- Middlewares ----------
app.use(express.json({ limit: "1mb" }));
app.use("/admin", express.static(path.join(__dirname, "public/admin")));
app.use(express.static(path.join(__dirname, "public")));

// ---------- Utils ----------
function formatearTasa(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n >= 10) return +n.toFixed(1);
  if (n >= 1) return +n.toFixed(2);
  if (n >= 0.01) return +n.toFixed(3);
  if (n >= 0.001) return +n.toFixed(4);
  if (n >= 0.00099) return +n.toFixed(5);
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

// ---------- Snapshot helpers ----------
function readLocalSnapshot() {
  const ruta = path.join(__dirname, "public", "snapshot.json");
  if (!fs.existsSync(ruta)) return {};
  const data = fs.readFileSync(ruta, "utf8");
  return JSON.parse(data);
}

function writeLocalSnapshot(obj) {
  const fecha = new Date().toISOString().slice(0, 10);
  const snapshotActualPath = path.join(__dirname, "public", "snapshot.json");
  const dirSnapshots = path.join(__dirname, "public", "snapshots");
  const snapshotHistPath = path.join(dirSnapshots, `${fecha}.json`);
  if (!fs.existsSync(dirSnapshots)) fs.mkdirSync(dirSnapshots, { recursive: true });

  fs.writeFileSync(snapshotActualPath, JSON.stringify(obj, null, 2));
  if (!fs.existsSync(snapshotHistPath)) {
    fs.writeFileSync(snapshotHistPath, JSON.stringify(obj, null, 2));
  }
}

// ---------- Gist helpers ----------
async function readGistSnapshot() {
  const { data } = await axios.get(`https://api.github.com/gists/${GIST_ID}`, {
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "ByteTransfer",
    },
    timeout: 15000,
  });

  const file = data?.files?.[GIST_FILENAME];
  if (!file || !file.content) return {};
  return JSON.parse(file.content);
}

async function writeGistSnapshot(obj) {
  await axios.patch(
    `https://api.github.com/gists/${GIST_ID}`,
    { files: { [GIST_FILENAME]: { content: JSON.stringify(obj, null, 2) } } },
    {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "ByteTransfer",
      },
      timeout: 15000,
    }
  );
}

// -------------------------
// Referencias BCV multi-fuente (USD/EUR)
// -------------------------
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
  const tdMatches = [...firstRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m =>
    m[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()
  );

  if (tdMatches.length < 2) return null;

  const usdNum = normalizarNumero(tdMatches[0]);
  const eurNum = normalizarNumero(tdMatches[1]);
  if (!Number.isFinite(usdNum) || !Number.isFinite(eurNum)) return null;

  const usd = formatearTasa(usdNum);
  const eur = formatearTasa(eurNum);
  if (usd < 50 || eur < 50) return null;

  return { usd, eur, fecha: null, fuente: "mercantil" };
}

async function getFromMercantil() {
  const { data } = await axios.get(
    "https://www.mercantilbanco.com/informacion/tasas%2C-tarifas-y-comisiones/tasa-mesa-de-cambio",
    { timeout: 15000, headers: { "User-Agent": "Mozilla/5.0" } }
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

  return { usd, eur, fecha, fuente: "bancoexterior" };
}

async function getFromBancoExterior() {
  const { data } = await axios.get("https://www.bancoexterior.com/tasas-bcv/", {
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return parseBancoExterior(String(data));
}

async function getBcvRates() {
  try {
    const m = await getFromMercantil();
    if (m?.usd && m?.eur) return { ...m, fuente: "mercantil" };

    // fallback si mercantil cambió
    const be = await getFromBancoExterior();
    if (be?.usd && be?.eur) return { ...be, fuente: "bancoexterior" };

    return { usd: null, eur: null, fecha: null, fuente: "bcv_parse_failed" };
  } catch (e) {
    console.log("❌ BCV falló:", e.message);
    return { usd: null, eur: null, fecha: null, fuente: "bcv_failed" };
  }
}

async function binanceAvgPriceTop20(fiat, tradeType) {
  const { data } = await axios.post(
    "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
    {
      page: 1,
      rows: 20,
      payTypes: [],
      asset: "USDT",
      tradeType,
      fiat,
      order: null,
      orderColumn: "price",
    },
    { headers: { "Content-Type": "application/json" }, timeout: 15000 }
  );

  const items = data?.data || [];
  const prices = [];
  for (const it of items) {
    const price = Number(it?.adv?.price);
    if (!Number.isFinite(price)) continue;
    prices.push(price);
  }
  if (!prices.length) return null;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  return Number(avg.toFixed(6));
}

async function getUsdtVesRefs() {
  const buy = await binanceAvgPriceTop20("VES", "BUY");
  const sell = buy ? Number((buy * 0.9975).toFixed(6)) : null;
  const mid = buy && sell ? Number(((buy + sell) / 2).toFixed(6)) : (buy ?? sell ?? null);

  return {
    buy: buy ? formatearTasa(buy) : null,
    sell: sell ? formatearTasa(sell) : null,
    mid: mid ? formatearTasa(mid) : null,
  };
}

// ---------- Rutas ----------
app.get("/healthz", (req, res) => res.send("ok"));

app.get("/api/snapshot", async (req, res) => {
  res.set("Cache-Control", "no-store");

  // 1) Intentar Gist
  if (USE_GIST) {
    try {
      const snap = await readGistSnapshot();
      return res.json(snap || {});
    } catch (e) {
      console.error("❌ Gist snapshot falló, usando local:", e.message);
      // 2) Fallback local
      try {
        const local = readLocalSnapshot();
        return res.json(local || {});
      } catch (e2) {
        console.error("❌ Local snapshot también falló:", e2.message);
        return res.status(500).json({ error: "Error leyendo snapshot" });
      }
    }
  }

  // 3) Si no hay Gist, usar local
  try {
    const local = readLocalSnapshot();
    return res.json(local || {});
  } catch (e) {
    console.error("❌ Leyendo snapshot local:", e.message);
    return res.status(500).json({ error: "Error leyendo snapshot" });
  }
});

app.get("/api/admin/verify", (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ ok: false, error: "ADMIN_KEY no configurada en el servidor" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: "Clave inválida" });
  }

  return res.json({ ok: true });
});

app.post("/api/guardar-snapshot", async (req, res) => {
  // 🔐 Requiere ADMIN_KEY
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada en el servidor" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado: clave admin inválida" });
  }

  // 1) Leer snapshot anterior (para merge de cruces)
  let snapshotAnterior = {};
  try {
    if (USE_GIST) snapshotAnterior = await readGistSnapshot();
    else snapshotAnterior = readLocalSnapshot();
  } catch (e) {
    console.warn("⚠️ Snapshot previo corrupto / no disponible, regenerando:", e.message);
    snapshotAnterior = {};
  }

  // 2) Formatear cruces nuevos
  const crucesNuevos = req.body?.cruces || {};
  const crucesNuevosFormateados = {};
  for (const k of Object.keys(crucesNuevos)) {
    const n = Number(crucesNuevos[k]);
    if (!Number.isFinite(n)) continue;
    crucesNuevosFormateados[k] = formatearTasa(n);
  }

  // 3) Merge cruces
  const crucesCompletos = { ...(snapshotAnterior.cruces || {}), ...crucesNuevosFormateados };

  // 4) Datos finales
  const datosFinales = {
    ...snapshotAnterior,
    ...req.body,
    cruces: crucesCompletos,
    guardado_en: new Date().toISOString(),
  };

  // 5) Guardar (Gist preferido; si falla, local)
  try {
    if (USE_GIST) {
      await writeGistSnapshot(datosFinales);
      return res.json({ status: "ok", storage: "gist" });
    }

    writeLocalSnapshot(datosFinales);
    return res.json({ status: "ok", storage: "local" });
  } catch (err) {
    console.error("❌ Guardar en gist falló:", err.message);

    // Fallback local si gist falla
    try {
      writeLocalSnapshot(datosFinales);
      return res.json({ status: "ok", storage: "local_fallback" });
    } catch (e2) {
      console.error("❌ Fallback local también falló:", e2.message);
      return res.status(500).json({ error: "Error al guardar snapshot" });
    }
  }
});

// ---------- Referencias (BCV + USDT/VES) ----------
app.get("/api/referencias", async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    const bcv = await getBcvRates();
    const usdt_ves = await getUsdtVesRefs();

    return res.json({
      bcv,
      usdt_ves,
      actualizado_en: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ /api/referencias:", e.message);
    return res.status(500).json({ error: "No se pudieron obtener referencias" });
  }
});

// ---- BINANCE con cache simple (TTL 45s) ----
const binanceCache = new Map();
const BINANCE_TTL_MS = 45 * 1000;

app.post("/api/binance", async (req, res) => {
  const { fiat, tradeType, page = 1, payTypes = [], transAmount } = req.body || {};
  if (!fiat || !tradeType) return res.status(400).json({ error: "Parámetros inválidos" });

  const key = `${fiat}|${tradeType}|${page}|${(payTypes || []).join(",")}|${transAmount || ""}`;
  const now = Date.now();
  const cached = binanceCache.get(key);
  if (cached && now - cached.t < BINANCE_TTL_MS) {
    return res.json(cached.data);
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
    return res.json(data);
  } catch (error) {
    console.error("❌ Binance:", error?.message);
    if (cached) return res.json(cached.data);
    return res.status(500).json({ error: "Fallo conexión Binance" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
});
