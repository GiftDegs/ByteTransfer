const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Admin
const ADMIN_KEY = process.env.ADMIN_KEY;

// ---------- PostgreSQL ----------
// En local usa tu External Database URL.
// En Render usa la variable DATABASE_URL del panel Environment.
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://bytetransfer_user:S16nBKmM24o34ZVvGqrf7IsRAn77OCbn@dpg-d7b5klsvjg8s73et2q20-a.oregon-postgres.render.com/bytetransfer";

const isRender = !!process.env.RENDER;

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: isRender ? false : { rejectUnauthorized: false },
    })
  : null;

let dbReady = false;

async function initDb() {
  if (!pool) {
    console.log("🟡 DATABASE_URL no configurada. Usando snapshot local.");
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id BIGSERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        guardado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const test = await pool.query("SELECT NOW() AS now");
    dbReady = true;
    console.log("✅ DB conectada:", test.rows[0].now);
  } catch (err) {
    dbReady = false;
    console.error("❌ Error conectando/inicializando DB:", err.message);
  }
}

async function readLatestSnapshotFromDb() {
  if (!pool || !dbReady) return null;

  const result = await pool.query(`
    SELECT data
    FROM snapshots
    ORDER BY guardado_en DESC, id DESC
    LIMIT 1
  `);

  if (!result.rows.length) return {};
  return result.rows[0].data || {};
}

async function readSnapshotsFromDb(limit = 20) {
  if (!pool || !dbReady) return [];

  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));

  const result = await pool.query(
    `
    SELECT id, data, guardado_en
    FROM snapshots
    ORDER BY guardado_en DESC, id DESC
    LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    guardado_en: row.guardado_en,
    ...(row.data || {}),
  }));
}

async function writeSnapshotToDb(obj) {
  if (!pool || !dbReady) {
    throw new Error("DB no disponible");
  }

  const result = await pool.query(
    `
    INSERT INTO snapshots (data, guardado_en)
    VALUES ($1::jsonb, $2::timestamptz)
    RETURNING id, guardado_en
    `,
    [JSON.stringify(obj), obj.guardado_en || new Date().toISOString()]
  );

  return result.rows[0];
}

// ---------- Snapshot local único ----------
function getSnapshotPath() {
  const custom = process.env.SNAPSHOT_FALLBACK_PATH;
  if (custom) return custom;
  return path.join(__dirname, "public", "snapshot.json");
}

function readLocalSnapshot() {
  const p = getSnapshotPath();
  if (!fs.existsSync(p)) return {};

  const raw = fs.readFileSync(p, "utf8");
  if (!raw.trim()) return {};

  return JSON.parse(raw);
}

function writeLocalSnapshot(obj) {
  const p = getSnapshotPath();
  const dir = path.dirname(p);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
  return p;
}

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

// ---------- BRL simple (PTAX -> fijo) ----------
function formatPtaxDateBR(d = new Date()) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

async function getBcbUsdBrlPtax() {
  const cotacao = "USD";
  const dataStr = formatPtaxDateBR(new Date());

  const url =
    `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/` +
    `CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?` +
    `@moeda='${cotacao}'&@dataCotacao='${dataStr}'&$top=1&$format=json`;

  const { data } = await axios.get(url, {
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const row = data?.value?.[0] || null;
  const buy = Number(row?.cotacaoCompra);
  const sell = Number(row?.cotacaoVenda);

  return {
    source: "ptax",
    buy: Number.isFinite(buy) ? buy : null,
    sell: Number.isFinite(sell) ? sell : null,
  };
}

async function getDynamicBrlPrice() {
  try {
    const ptax = await getBcbUsdBrlPtax();
    if (Number.isFinite(ptax.buy) || Number.isFinite(ptax.sell)) {
      return ptax;
    }
  } catch (e) {
    console.warn("⚠️ BRL PTAX falló:", e.message);
  }

  return {
    source: "fallback",
    buy: 5.74,
    sell: 5.49,
  };
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

  return { usd, eur, fecha: null, fuente: "mercantil" };
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

// ---------- Middlewares ----------
app.use(express.json({ limit: "1mb" }));
app.use("/admin", express.static(path.join(__dirname, "public/admin")));
app.use(express.static(path.join(__dirname, "public")));

// ---------- Rutas ----------
app.get("/healthz", async (req, res) => {
  try {
    if (pool && dbReady) {
      await pool.query("SELECT 1");
      return res.status(200).json({ ok: true, storage: "postgres" });
    }

    const snap = readLocalSnapshot();
    if (snap && typeof snap === "object") {
      return res.status(200).json({ ok: true, storage: "local" });
    }
  } catch (_) {}

  return res.status(503).json({ ok: false, storage: "none", error: "snapshot not ready" });
});

app.get("/api/snapshot", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    if (pool && dbReady) {
      const snap = await readLatestSnapshotFromDb();
      res.set("X-Snapshot-Source", "postgres");
      return res.json(snap || {});
    }

    const snap = readLocalSnapshot();
    res.set("X-Snapshot-Source", "local");
    return res.json(snap || {});
  } catch (e) {
    console.error("❌ /api/snapshot:", e.message);
    return res.status(500).json({ error: "Error leyendo snapshot" });
  }
});

app.get("/api/snapshots", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    if (pool && dbReady) {
      const limit = req.query.limit || 20;
      const rows = await readSnapshotsFromDb(limit);
      return res.json(rows);
    }

    return res.json([]);
  } catch (e) {
    console.error("❌ /api/snapshots:", e.message);
    return res.status(500).json({ error: "Error leyendo snapshots" });
  }
});

// ---------- EXPORT SNAPSHOTS ----------
app.get("/api/export-snapshots", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    if (!(pool && dbReady)) {
      return res.status(503).json({ error: "DB no disponible" });
    }

    const result = await pool.query(`
      SELECT id, data, guardado_en
      FROM snapshots
      ORDER BY guardado_en ASC, id ASC
    `);

    const exportData = result.rows.map((row) => ({
      id: row.id,
      guardado_en: row.guardado_en,
      data: row.data,
    }));

    return res.json({
      exported_at: new Date().toISOString(),
      total: exportData.length,
      snapshots: exportData,
    });
  } catch (e) {
    console.error("❌ /api/export-snapshots:", e.message);
    return res.status(500).json({ error: "Error exportando snapshots" });
  }
});

// ---------- IMPORT SNAPSHOTS ----------
app.post("/api/import-snapshots", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    if (!(pool && dbReady)) {
      return res.status(503).json({ error: "DB no disponible" });
    }

    const snapshots = req.body?.snapshots;

    if (!Array.isArray(snapshots)) {
      return res.status(400).json({ error: "Formato inválido" });
    }

    // ⚠️ BORRAR TODO
    await pool.query("DELETE FROM snapshots");

    for (const item of snapshots) {
      await pool.query(
        `INSERT INTO snapshots (data, guardado_en)
         VALUES ($1::jsonb, $2::timestamptz)`,
        [JSON.stringify(item.data), item.guardado_en]
      );
    }

    res.json({ ok: true, total: snapshots.length });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error importando backup" });
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
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada en el servidor" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado: clave admin inválida" });
  }

  let snapshotAnterior = {};
  try {
    if (pool && dbReady) {
      snapshotAnterior = (await readLatestSnapshotFromDb()) || {};
    } else {
      snapshotAnterior = readLocalSnapshot() || {};
    }
  } catch (e) {
    console.warn("⚠️ No pude leer snapshot previo, regenerando:", e.message);
    snapshotAnterior = {};
  }

  const crucesNuevos = req.body?.cruces || {};
  const crucesNuevosFormateados = {};

  for (const k of Object.keys(crucesNuevos)) {
    const n = Number(crucesNuevos[k]);
    if (!Number.isFinite(n)) continue;
    crucesNuevosFormateados[k] = formatearTasa(n);
  }

  const crucesCompletos = {
    ...(snapshotAnterior.cruces || {}),
    ...crucesNuevosFormateados,
  };

  const datosFinales = {
    ...snapshotAnterior,
    ...req.body,
    cruces: crucesCompletos,
    guardado_en: new Date().toISOString(),
  };

  try {
    if (pool && dbReady) {
      const saved = await writeSnapshotToDb(datosFinales);
      return res.json({
        status: "ok",
        storage: "postgres",
        id: saved.id,
        guardado_en: saved.guardado_en,
      });
    }

    const writtenPath = writeLocalSnapshot(datosFinales);
    return res.json({
      status: "ok",
      storage: "local",
      path: writtenPath,
    });
  } catch (e) {
    console.error("❌ Guardar snapshot falló:", e.message);
    return res.status(500).json({
      error: "Error guardando snapshot",
      detail: e.message,
    });
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

// ---------- BRL price endpoint ----------
app.get("/api/brl-price", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const data = await getDynamicBrlPrice();
    return res.json(data);
  } catch (e) {
    console.error("❌ /api/brl-price:", e.message);
    return res.status(500).json({ error: "No se pudo obtener BRL" });
  }
});

// ---- BINANCE con cache simple (TTL 45s) ----
const binanceCache = new Map();
const BINANCE_TTL_MS = 45 * 1000;

app.post("/api/binance", async (req, res) => {
  const { fiat, tradeType, page = 1, payTypes = [], transAmount } = req.body || {};
  if (!fiat || !tradeType) {
    return res.status(400).json({ error: "Parámetros inválidos" });
  }

  // BRL especial
  if (fiat === "BRL") {
    try {
      const brl = await getDynamicBrlPrice();
      const price = tradeType === "BUY" ? brl.buy : brl.sell;

      if (!Number.isFinite(price)) {
        return res.status(500).json({ error: "No se pudo obtener precio BRL" });
      }

      return res.json({
        data: [
          {
            adv: {
              price: String(price),
              minSingleTransAmount: "0",
              isAdvBanned: false,
            },
          },
        ],
        source: brl.source,
      });
    } catch (e) {
      console.error("❌ /api/binance BRL:", e.message);
      return res.status(500).json({ error: "Fallo conexión BRL" });
    }
  }

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

// ---------- Precios dinámicos ----------
async function fetchPrecio(fiat, tipo) {
  const USDT_LIMITE_VES = 150;
  const precios = [];

  try {
    // BRL simple
    if (fiat === "BRL") {
      const brl = await getDynamicBrlPrice();
      return tipo === "BUY" ? brl.buy : brl.sell;
    }

    // Caso particular: VES SELL basado en BUY
    if (tipo === "SELL" && fiat === "VES") {
      const precioCompra = await fetchPrecio(fiat, "BUY");
      if (!precioCompra) return null;
      return parseFloat((precioCompra * 0.9975).toFixed(6));
    }

    const res = await axios.post(
      "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
      {
        page: 1,
        rows: 100,
        payTypes: [],
        asset: "USDT",
        tradeType: tipo,
        fiat,
        order: null,
        orderColumn: "price",
      },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );

    const comerciales = res.data?.data || [];

    for (const item of comerciales) {
      const adv = item?.adv;
      if (!adv) continue;

      const precio = parseFloat(adv.price);
      const minVES = parseFloat(adv.minSingleTransAmount) || Infinity;
      const permitido = !adv.isAdvBanned;

      if (!precio || !permitido) continue;

      if (fiat === "VES" && tipo === "SELL") {
        const usdtNecesario = minVES / precio;
        if (usdtNecesario > USDT_LIMITE_VES) continue;
      }

      precios.push(precio);
      if (precios.length === 20) break;
    }

    if (!precios.length) return null;
    const promedio = precios.reduce((a, b) => a + b, 0) / precios.length;
    return parseFloat(promedio.toFixed(6));
  } catch (e) {
    console.error("❌ fetchPrecio:", fiat, tipo, e.message || e);
    return null;
  }
}

// ---------- Arranque ----------
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`📁 Snapshot fallback local: ${getSnapshotPath()}`);

  await initDb();
});