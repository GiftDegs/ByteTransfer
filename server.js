const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;


const {
  initDb,
  readLatestSnapshotFromDb,
  readSnapshotsFromDb,
  writeSnapshotToDb,
  getSnapshotPath,
  readLocalSnapshot,
  writeLocalSnapshot,
  isDbAvailable,
} = require("./services/snapshotStore");

const {
  callBinanceP2P,
  binanceAvgPriceTop20,
  fetchPrecio,
} = require("./services/binanceService");

const { getDynamicBrlPrice } = require("./services/brlService");

const { getBcvRates } = require("./services/bcvService");

const { getReferencias } = require("./services/referenceService");

const {
  getActiveCurrencies,
  getActiveCurrencyCodes,
  isSupportedCurrency,
} = require("./config/currencies");

const {
  resolveCurrencyQuotes,
} = require("./services/quoteResolverService");


// 🔐 Admin
const ADMIN_KEY = process.env.ADMIN_KEY;


// ---------- Utils ----------
function formatearTasa(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return +n.toFixed(6);
}

const PAISES_REQUERIDOS = getActiveCurrencyCodes();

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function validarBloquePais(nombre, bloque) {
  if (!isPlainObject(bloque)) {
    return `Falta o es inválido el bloque de ${nombre}`;
  }

  const compra = Number(bloque.compra);
  const venta = Number(bloque.venta);

  if (!Number.isFinite(compra) || compra <= 0) {
    return `Compra inválida en ${nombre}`;
  }

  if (!Number.isFinite(venta) || venta <= 0) {
    return `Venta inválida en ${nombre}`;
  }

  return null;
}

function validarCruces(cruces) {
  if (cruces == null) return null;
  if (!isPlainObject(cruces)) return "cruces debe ser un objeto";

  for (const [clave, valor] of Object.entries(cruces)) {
    if (!/^[A-Z]{3}-[A-Z]{3}$/.test(clave)) {
      return `Clave de cruce inválida: ${clave}`;
    }

    const n = Number(valor);
    if (!Number.isFinite(n) || n <= 0) {
      return `Valor inválido en cruce ${clave}`;
    }
  }

  return null;
}

function validarMargenesCruce(margenes) {
  if (margenes == null) return null;
  if (!isPlainObject(margenes)) return "margenesCruce debe ser un objeto";

  for (const [clave, valor] of Object.entries(margenes)) {
    if (!/^[A-Z]{3}-[A-Z]{3}$/.test(clave)) {
      return `Clave de margen inválida: ${clave}`;
    }

    const n = Number(valor);
    if (!Number.isFinite(n) || n < 0) {
      return `Margen inválido en ${clave}`;
    }
  }

  return null;
}

function validarReferencias(referencias) {
  if (referencias == null) return null;
  if (!isPlainObject(referencias)) return "referencias debe ser un objeto";

  if (referencias.bcv != null && !isPlainObject(referencias.bcv)) {
    return "referencias.bcv debe ser un objeto";
  }

  if (referencias.usdt_ves != null && !isPlainObject(referencias.usdt_ves)) {
    return "referencias.usdt_ves debe ser un objeto";
  }

  return null;
}

function validarPublicConfig(publicConfig) {
  if (publicConfig == null) return null;
  if (!isPlainObject(publicConfig)) return "publicConfig debe ser un objeto";
  return null;
}

function validarSnapshotPayload(payload, { requireCountries = false } = {}) {
  if (!isPlainObject(payload)) {
    return "Payload inválido";
  }

  if (requireCountries) {
    for (const fiat of PAISES_REQUERIDOS) {
      const err = validarBloquePais(fiat, payload[fiat]);
      if (err) return err;
    }
  } else {
    for (const fiat of PAISES_REQUERIDOS) {
      if (payload[fiat] != null) {
        const err = validarBloquePais(fiat, payload[fiat]);
        if (err) return err;
      }
    }
  }

  const errCruces = validarCruces(payload.cruces);
  if (errCruces) return errCruces;

  const errMargenes = validarMargenesCruce(payload.margenesCruce);
  if (errMargenes) return errMargenes;

  const errRefs = validarReferencias(payload.referencias);
  if (errRefs) return errRefs;

  const errPublic = validarPublicConfig(payload.publicConfig);
  if (errPublic) return errPublic;

  return null;
}

// ---------- Middlewares ----------
app.use(express.json({ limit: "1mb" }));
app.use("/admin", express.static(path.join(__dirname, "public/admin")));
app.use(express.static(path.join(__dirname, "public")));

// ---------- Rutas ----------
app.get("/healthz", async (req, res) => {
  try {
    if (isDbAvailable()) {
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

app.get("/api/currencies", (_req, res) => {
  res.set("Cache-Control", "no-store");

  return res.json({
    currencies: getActiveCurrencies(),
    codes: getActiveCurrencyCodes(),
  });
});

app.get("/api/snapshot", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    if (isDbAvailable()) {
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
    if (isDbAvailable()) {
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
    if (!isDbAvailable()) {
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
    if (!isDbAvailable()) {
      return res.status(503).json({ error: "DB no disponible" });
    }

    const snapshots = req.body?.snapshots;

    if (!Array.isArray(snapshots)) {
      return res.status(400).json({ error: "Formato inválido: snapshots debe ser un array" });
    }

    if (!snapshots.length) {
      return res.status(400).json({ error: "Formato inválido: snapshots está vacío" });
    }

    for (let i = 0; i < snapshots.length; i++) {
      const item = snapshots[i];

      if (!isPlainObject(item)) {
        return res.status(400).json({
          error: `Formato inválido: snapshots[${i}] no es un objeto válido`,
        });
      }

      if (!item.guardado_en) {
        return res.status(400).json({
          error: `Formato inválido: snapshots[${i}].guardado_en es obligatorio`,
        });
      }

      const fecha = new Date(item.guardado_en);
      if (Number.isNaN(fecha.getTime())) {
        return res.status(400).json({
          error: `Formato inválido: snapshots[${i}].guardado_en no es una fecha válida`,
        });
      }

      if (!isPlainObject(item.data)) {
        return res.status(400).json({
          error: `Formato inválido: snapshots[${i}].data falta o no es un objeto válido`,
        });
      }

      const errPayload = validarSnapshotPayload(item.data, { requireCountries: true });
      if (errPayload) {
        return res.status(400).json({
          error: `snapshots[${i}].data inválido: ${errPayload}`,
        });
      }
    }

    await pool.query("DELETE FROM snapshots");

    for (const item of snapshots) {
      await pool.query(
        `INSERT INTO snapshots (data, guardado_en)
         VALUES ($1::jsonb, $2::timestamptz)`,
        [JSON.stringify(item.data), item.guardado_en]
      );
    }

    return res.json({ ok: true, total: snapshots.length });
  } catch (e) {
    console.error("❌ /api/import-snapshots:", e.message);
    return res.status(500).json({ error: "Error importando backup" });
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

  const errPayload = validarSnapshotPayload(req.body, { requireCountries: false });
  if (errPayload) {
  return res.status(400).json({ error: errPayload });
  }

  let snapshotAnterior = {};
  try {
    if (isDbAvailable()) {
      snapshotAnterior = (await readLatestSnapshotFromDb()) || {};
    } else {
      snapshotAnterior = readLocalSnapshot() || {};
    }
  } catch (e) {
    console.warn("⚠️ No pude leer snapshot previo, regenerando:", e.message);
    snapshotAnterior = {};
  }

  const bodyNormalizado = { ...req.body };

  for (const fiat of PAISES_REQUERIDOS) {
  if (!bodyNormalizado[fiat]) continue;

  bodyNormalizado[fiat] = {
    compra: Number(bodyNormalizado[fiat].compra),
    venta: Number(bodyNormalizado[fiat].venta),
  };
  }

const crucesRecibidos = req.body?.cruces;
let crucesCompletos = snapshotAnterior.cruces || {};

if (crucesRecibidos && typeof crucesRecibidos === "object" && !Array.isArray(crucesRecibidos)) {
  const crucesNuevosFormateados = {};

  for (const [k, v] of Object.entries(crucesRecibidos)) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) continue;
    crucesNuevosFormateados[k] = formatearTasa(n);
  }

  // IMPORTANTE:
  // Si el frontend manda cruces, se consideran la foto completa nueva
  // y NO se mezclan con cruces viejos del snapshot anterior.
  crucesCompletos = crucesNuevosFormateados;
}

  const datosFinales = {
  ...snapshotAnterior,
  ...bodyNormalizado,
  cruces: crucesCompletos,
  guardado_en: new Date().toISOString(),
  };

  try {
    if (isDbAvailable()) {
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
app.get("/api/referencias", async (_req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const referencias = await getReferencias();
    return res.json(referencias);
  } catch (e) {
    console.error("❌ /api/referencias:", e.message);
    return res.status(500).json({
      error: "No se pudieron obtener referencias",
      detail: e.message,
    });
  }
});

// ---------- BRL price endpoint ----------
app.get("/api/brl-price", async (_req, res) => {
  try {
    const brl = await getDynamicBrlPrice();
    return res.json(brl);
  } catch (e) {
    console.error("❌ /api/brl-price:", e.message);
    return res.status(500).json({
      error: "No se pudo obtener BRL",
    });
  }
});

// ---------- TEMP: test nuevo motor de cotizaciones ----------
app.get("/api/debug/quote/:currency", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const currency = String(req.params.currency || "").toUpperCase();

  if (!isSupportedCurrency(currency)) {
    return res.status(400).json({ error: `Moneda no soportada: ${currency}` });
  }

  try {
    const result = await resolveCurrencyQuotes(currency);
    return res.json(result);
  } catch (e) {
    console.error("❌ /api/debug/quote:", currency, e.message);
    return res.status(500).json({
      error: "Error resolviendo cotización",
      detail: e.message,
    });
  }
});

// ---------- TEMP: test nuevo motor para todas las monedas ----------
app.get("/api/debug/quotes", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const codes = getActiveCurrencyCodes();
    const results = {};

    for (const code of codes) {
      results[code] = await resolveCurrencyQuotes(code);
    }

const warnings = [];
const lowConfidenceCurrencies = [];
const mediumConfidenceCurrencies = [];

for (const [code, item] of Object.entries(results)) {
  const audit = item?.audit || {};

  if (audit.confidence === "low") {
    lowConfidenceCurrencies.push(code);
  }

  if (audit.confidence === "medium") {
    mediumConfidenceCurrencies.push(code);
  }

  if (Array.isArray(audit.warnings)) {
    for (const warning of audit.warnings) {
      warnings.push(warning);
    }
  }
}

let globalConfidence = "high";

if (lowConfidenceCurrencies.length) {
  globalConfidence = "low";
} else if (mediumConfidenceCurrencies.length || warnings.length) {
  globalConfidence = "medium";
}

  return res.json({
    ok: true,
    captured_at: new Date().toISOString(),
    currencies: codes,
    audit_summary: {
      confidence: globalConfidence,
      warnings_count: warnings.length,
      low_confidence_currencies: lowConfidenceCurrencies,
      medium_confidence_currencies: mediumConfidenceCurrencies,
      warnings,
    },
    results,
  });

  } catch (e) {
    console.error("❌ /api/debug/quotes:", e.message);
    return res.status(500).json({
      ok: false,
      error: "Error resolviendo cotizaciones",
      detail: e.message,
    });
  }
});

app.post("/api/binance", async (req, res) => {
  const { fiat, tradeType, page = 1, payTypes = [], transAmount } = req.body || {};

  if (!fiat || !tradeType) {
    return res.status(400).json({ error: "Parámetros inválidos" });
  }

  if (!isSupportedCurrency(fiat)) {
  return res.status(400).json({ error: `Moneda no soportada: ${fiat}` });
  }

  try {
    // BRL temporal: luego se moverá a brlService.js
    if (fiat === "BRL") {
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
    }

    const data = await callBinanceP2P({
      fiat,
      tradeType,
      page,
      payTypes,
      transAmount,
    });

    return res.json(data);
  } catch (e) {
    console.error("❌ /api/binance:", e.message);
    return res.status(500).json({ error: "Fallo conexión Binance" });
  }
});

// ---------- Arranque ----------
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`📁 Snapshot fallback local: ${getSnapshotPath()}`);

  await initDb();
});