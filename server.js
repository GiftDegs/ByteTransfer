const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Admin
const ADMIN_KEY = process.env.ADMIN_KEY || null;

// ---------- Postgres ----------
const DATABASE_URL = process.env.DATABASE_URL || null;

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
    })
  : null;

// ---------- Snapshot fallback local ----------
function getSnapshotCandidatePaths() {
  const custom = process.env.SNAPSHOT_FALLBACK_PATH;
  const candidates = [
    custom,
    path.join(__dirname, "public", "snapshot.json"),
    path.join(__dirname, "snapshot.json"),
  ].filter(Boolean);

  return [...new Set(candidates)];
}

function getReadableSnapshotPath() {
  const candidates = getSnapshotCandidatePaths();
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return candidates[0] || path.join(__dirname, "snapshot.json");
}

function getWritableSnapshotPath() {
  const custom = process.env.SNAPSHOT_FALLBACK_PATH;
  if (custom) return custom;

  const publicPath = path.join(__dirname, "public", "snapshot.json");
  const publicDir = path.dirname(publicPath);

  try {
    if (fs.existsSync(publicDir)) return publicPath;
  } catch (_) {}

  return path.join(__dirname, "snapshot.json");
}

function readLocalSnapshot() {
  const p = getReadableSnapshotPath();
  if (!fs.existsSync(p)) return null;

  const raw = fs.readFileSync(p, "utf8");
  if (!raw.trim()) return null;

  return JSON.parse(raw);
}

function writeLocalSnapshot(obj) {
  const p = getWritableSnapshotPath();
  const dir = path.dirname(p);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
  return p;
}

// ---------- DB helpers ----------
async function dbAvailable() {
  if (!pool) return false;
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

async function ensureTables() {
  if (!pool) {
    console.warn("⚠️ DATABASE_URL no configurada. Se usará fallback local.");
    return false;
  }

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
  return true;
}

async function dbGetLatestSnapshot() {
  if (!pool) throw new Error("DATABASE_URL no configurada");

  const { rows } = await pool.query(
    "SELECT id, content, created_at FROM snapshots ORDER BY created_at DESC, id DESC LIMIT 1"
  );

  if (!rows.length) return null;
  return rows[0];
}

async function dbInsertSnapshot(contentObj) {
  if (!pool) throw new Error("DATABASE_URL no configurada");

  const { rows } = await pool.query(
    "INSERT INTO snapshots (content) VALUES ($1) RETURNING id, created_at",
    [contentObj]
  );

  return rows[0];
}

async function getLatestSnapshotSafe() {
  if (pool) {
    try {
      const latest = await dbGetLatestSnapshot();
      if (latest?.content) {
        return { source: "db", snapshot: latest.content };
      }
    } catch (e) {
      console.error("❌ DB snapshot read failed:", e.message);
    }
  }

  try {
    const local = readLocalSnapshot();
    if (local) {
      return { source: "local", snapshot: local };
    }
  } catch (e) {
    console.error("❌ Local snapshot read failed:", e.message);
  }

  return { source: "none", snapshot: {} };
}

async function saveSnapshotSafe(contentObj) {
  if (pool) {
    try {
      const inserted = await dbInsertSnapshot(contentObj);

      try {
        writeLocalSnapshot(contentObj);
      } catch (e) {
        console.warn("⚠️ No pude escribir fallback local:", e.message);
      }

      return {
        ok: true,
        storage: "postgres",
        id: inserted.id,
        created_at: inserted.created_at,
      };
    } catch (e) {
      console.error("❌ Guardar snapshot en DB falló:", e.message);
    }
  }

  try {
    const writtenPath = writeLocalSnapshot(contentObj);
    return {
      ok: true,
      storage: "local",
      path: writtenPath,
    };
  } catch (e) {
    console.error("❌ Guardar snapshot local falló:", e.message);
    return {
      ok: false,
      error: e.message,
    };
  }
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
  const dbOk = await dbAvailable();

  if (dbOk) {
    return res.json({ ok: true, storage: "db" });
  }

  try {
    const local = readLocalSnapshot();
    if (local) {
      return res.status(200).json({ ok: true, storage: "local-fallback" });
    }
  } catch (_) {}

  return res.status(503).json({ ok: false, storage: "none", error: "db not ready" });
});

app.get("/api/snapshot", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const result = await getLatestSnapshotSafe();
    res.set("X-Snapshot-Source", result.source);
    return res.json(result.snapshot || {});
  } catch (e) {
    console.error("❌ /api/snapshot:", e.message);
    return res.status(500).json({ error: "Error leyendo snapshot" });
  }
});

app.get("/api/snapshots", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const limit = Math.min(Number(req.query.limit || 10), 50);

  if (!pool) {
    return res.json([]);
  }

  try {
    const { rows } = await pool.query(
      "SELECT id, created_at, content FROM snapshots ORDER BY created_at DESC, id DESC LIMIT $1",
      [limit]
    );

    const out = rows.map((r) => ({
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
    const latest = await getLatestSnapshotSafe();
    snapshotAnterior = latest?.snapshot || {};
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

  const result = await saveSnapshotSafe(datosFinales);

  if (!result.ok) {
    return res.status(500).json({
      error: "Error guardando snapshot",
      detail: result.error,
    });
  }

  return res.json({
    status: "ok",
    storage: result.storage,
    id: result.id || null,
    created_at: result.created_at || null,
    path: result.path || null,
  });
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
(async () => {
  if (pool) {
    try {
      await ensureTables();
    } catch (e) {
      console.error("❌ Error creando/verificando tabla snapshots:", e.message);
      console.warn("⚠️ La app seguirá usando fallback local si existe snapshot.json");
    }
  } else {
    console.warn("⚠️ Arrancando sin Postgres. Se usará snapshot local si existe.");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`📁 Snapshot fallback: ${getReadableSnapshotPath()}`);
  });
})();