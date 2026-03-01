// server.js
const express = require("express");
const path = require("path");
const axios = require("axios");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Admin
const ADMIN_KEY = process.env.ADMIN_KEY || null;

// ---------- Postgres ----------
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ Falta DATABASE_URL en variables de entorno.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  // En Render normalmente necesitas SSL.
  // Si en local te molesta, puedes poner PGSSLMODE=disable.
  ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
});

// ✅ Auto-crear tabla/índice al arrancar (para plan Free, sin shell)
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS snapshots (
      id BIGSERIAL PRIMARY KEY,
      content JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS snapshots_created_at_idx
    ON snapshots (created_at DESC);
  `);

  console.log("✅ Tabla snapshots verificada");
}

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

// ---------- DB helpers ----------
async function dbGetLatestSnapshot() {
  const { rows } = await pool.query(
    "SELECT id, content, created_at FROM snapshots ORDER BY created_at DESC, id DESC LIMIT 1"
  );
  if (!rows.length) return null;
  return rows[0];
}

async function dbInsertSnapshot(contentObj) {
  const { rows } = await pool.query(
    "INSERT INTO snapshots (content) VALUES ($1) RETURNING id, created_at",
    [contentObj]
  );
  return rows[0];
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
app.get("/healthz", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.send("ok");
  } catch (e) {
    res.status(503).send("db not ready");
  }
});

// Trae el ÚLTIMO snapshot guardado
app.get("/api/snapshot", async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    const latest = await dbGetLatestSnapshot();
    if (!latest) return res.json({});
    return res.json(latest.content || {});
  } catch (e) {
    console.error("❌ /api/snapshot:", e.message);
    return res.status(500).json({ error: "Error leyendo snapshot (DB)" });
  }
});

// Lista últimos N snapshots (historial)
app.get("/api/snapshots", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const limit = Math.min(Number(req.query.limit || 10), 50);
  try {
    const { rows } = await pool.query(
      "SELECT id, created_at, content FROM snapshots ORDER BY created_at DESC, id DESC LIMIT $1",
      [limit]
    );
    const out = rows.map(r => ({
      id: r.id,
      created_at: r.created_at,
      timestamp: r.content?.timestamp ?? null,
      guardado_en: r.content?.guardado_en ?? null,
    }));
    return res.json(out);
  } catch (e) {
    console.error("❌ /api/snapshots:", e.message);
    return res.status(500).json({ error: "Error listando snapshots" });
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

// Guarda snapshot nuevo (historial): INSERT siempre
app.post("/api/guardar-snapshot", async (req, res) => {
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
    const latest = await dbGetLatestSnapshot();
    snapshotAnterior = latest?.content || {};
  } catch (e) {
    console.warn("⚠️ No pude leer snapshot previo, regenerando:", e.message);
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

  // 5) Insert (historial)
  try {
    const inserted = await dbInsertSnapshot(datosFinales);
    return res.json({
      status: "ok",
      storage: "postgres",
      id: inserted.id,
      created_at: inserted.created_at,
    });
  } catch (e) {
    console.error("❌ Guardar snapshot (DB):", e.message);
    return res.status(500).json({ error: "Error guardando snapshot (DB)" });
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

// Arranque: crea tabla y luego escucha
(async () => {
  try {
    await ensureTables();
  } catch (e) {
    console.error("❌ Error creando/verificando tabla snapshots:", e.message);
    // No mato el proceso; pero si esto falla, el guardado no servirá.
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
  });
})();