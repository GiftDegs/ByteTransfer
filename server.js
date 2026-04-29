const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;


const {
  initDb,
  readLatestSnapshotFromDb,
  readSnapshotsFromDb,
  readSnapshotByIdFromDb,
  writeSnapshotToDb,
  getSnapshotPath,
  readLocalSnapshot,
  writeLocalSnapshot,
  isDbAvailable,
  readAuditLogs,
  readPaytypeCatalog,
writePaytypeCatalog,
writeAuditLog,
} = require("./services/snapshotStore");

const { quoteStrategies } = require("./config/quoteStrategies");

const {
  callBinanceP2P,
} = require("./services/binanceService");

const { getDynamicBrlPrice } = require("./services/brlService");

const { getBcvRates } = require("./services/bcvService");

const { getReferencias } = require("./services/referenceService");

const { resolveReference } = require("./services/referenceResolverService");

const {
  getActiveCurrencies,
  getActiveCurrencyCodes,
  isSupportedCurrency,
} = require("./config/currencies");

const {
  resolveCurrencyQuotes,
  getEffectiveQuoteStrategies,
  applyQuoteStrategyAmountOverrides,
  applyQuoteStrategyPaytypeOverrides,
  applyQuoteStrategyAdvancedOverrides,
  loadQuoteStrategyOverridesFromStore,
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

app.get("/api/runtime-info", (req, res) => {
  res.set("Cache-Control", "no-store");

  const host = String(req.headers.host || "");
  const serviceName = String(process.env.RENDER_SERVICE_NAME || "");
  const isRenderEnv = !!process.env.RENDER;

  let environment = "local";

  if (isRenderEnv) {
    const text = `${host} ${serviceName}`.toLowerCase();

    if (text.includes("staging")) {
      environment = "staging";
    } else {
      environment = "production";
    }
  }

  return res.json({
    ok: true,
    environment,
    label:
      environment === "local"
        ? "LOCAL"
        : environment === "staging"
          ? "STAGING"
          : "PROD",
    storage: isDbAvailable() ? "postgres" : "local",
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

const MONEDAS_HISTORIAL = ["VES", "ARS", "COP", "PEN", "CLP", "MXN", "BRL"];

function numeroHistorico(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function variacionPctHistorica(anterior, nuevo) {
  const a = Number(anterior);
  const n = Number(nuevo);

  if (!Number.isFinite(a) || !Number.isFinite(n) || a === 0) {
    return null;
  }

  return Number((((n - a) / a) * 100).toFixed(6));
}

function promedioHistorico(compra, venta) {
  const c = numeroHistorico(compra);
  const v = numeroHistorico(venta);

  if (c == null && v == null) return null;
  if (c != null && v != null) return Number(((c + v) / 2).toFixed(6));
  return c ?? v;
}

function compararMonedasSnapshot(base = {}, destino = {}) {
  return MONEDAS_HISTORIAL.map((code) => {
    const a = base?.[code] || {};
    const b = destino?.[code] || {};

    const compraAnterior = numeroHistorico(a.compra);
    const compraNueva = numeroHistorico(b.compra);
    const ventaAnterior = numeroHistorico(a.venta);
    const ventaNueva = numeroHistorico(b.venta);

    const promedioAnterior = promedioHistorico(compraAnterior, ventaAnterior);
    const promedioNuevo = promedioHistorico(compraNueva, ventaNueva);

    return {
      code,
      compra: {
        anterior: compraAnterior,
        nuevo: compraNueva,
        delta: compraAnterior != null && compraNueva != null
          ? Number((compraNueva - compraAnterior).toFixed(6))
          : null,
        pct: variacionPctHistorica(compraAnterior, compraNueva),
      },
      venta: {
        anterior: ventaAnterior,
        nuevo: ventaNueva,
        delta: ventaAnterior != null && ventaNueva != null
          ? Number((ventaNueva - ventaAnterior).toFixed(6))
          : null,
        pct: variacionPctHistorica(ventaAnterior, ventaNueva),
      },
      promedio: {
        anterior: promedioAnterior,
        nuevo: promedioNuevo,
        delta: promedioAnterior != null && promedioNuevo != null
          ? Number((promedioNuevo - promedioAnterior).toFixed(6))
          : null,
        pct: variacionPctHistorica(promedioAnterior, promedioNuevo),
      },
    };
  });
}

function compararMapaNumericoSnapshot(base = {}, destino = {}) {
  const claves = new Set([
    ...Object.keys(base || {}),
    ...Object.keys(destino || {}),
  ]);

  return [...claves].sort().map((key) => {
    const anterior = numeroHistorico(base?.[key]);
    const nuevo = numeroHistorico(destino?.[key]);

    return {
      key,
      anterior,
      nuevo,
      delta: anterior != null && nuevo != null
        ? Number((nuevo - anterior).toFixed(6))
        : null,
      pct: variacionPctHistorica(anterior, nuevo),
    };
  });
}

function resumirComparacionSnapshots(monedaCambios = [], cruceCambios = [], margenCambios = []) {
  const movimientosMonedas = monedaCambios
    .filter((m) => Number.isFinite(Number(m.promedio?.pct)))
    .sort((a, b) => Math.abs(b.promedio.pct) - Math.abs(a.promedio.pct));

  const movimientosCruces = cruceCambios
    .filter((c) => Number.isFinite(Number(c.pct)))
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

  const movimientosMargenes = margenCambios
    .filter((m) => Number.isFinite(Number(m.delta)))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    monedas: {
      total: monedaCambios.length,
      mas_movidas: movimientosMonedas.slice(0, 5),
    },
    cruces: {
      total: cruceCambios.length,
      mas_movidos: movimientosCruces.slice(0, 10),
    },
    margenes: {
      total: margenCambios.length,
      mas_movidos: movimientosMargenes.slice(0, 10),
    },
  };
}

function compararSnapshotsData(snapshotA = {}, snapshotB = {}) {
  const monedas = compararMonedasSnapshot(snapshotA, snapshotB);
  const cruces = compararMapaNumericoSnapshot(snapshotA?.cruces || {}, snapshotB?.cruces || {});
  const margenes = compararMapaNumericoSnapshot(snapshotA?.margenesCruce || {}, snapshotB?.margenesCruce || {});

  return {
    resumen: resumirComparacionSnapshots(monedas, cruces, margenes),
    monedas,
    cruces,
    margenes,
  };
}

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
    console.error("[snapshots] Error leyendo snapshots:", e.message);
    return res.status(500).json({ error: "Error leyendo snapshots" });
  }
});

app.get("/api/snapshots/compare", async (req, res) => {
  res.set("Cache-Control", "no-store");

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

    const fromId = req.query.from;
    const toId = req.query.to;

    const fromSnapshot = await readSnapshotByIdFromDb(fromId);
    const toSnapshot = await readSnapshotByIdFromDb(toId);

    if (!fromSnapshot) {
      return res.status(404).json({ error: "Snapshot base no encontrado" });
    }

    if (!toSnapshot) {
      return res.status(404).json({ error: "Snapshot destino no encontrado" });
    }

    const comparacion = compararSnapshotsData(fromSnapshot.data, toSnapshot.data);

    return res.json({
      from: {
        id: fromSnapshot.id,
        guardado_en: fromSnapshot.guardado_en,
      },
      to: {
        id: toSnapshot.id,
        guardado_en: toSnapshot.guardado_en,
      },
      ...comparacion,
    });
  } catch (e) {
    console.error("[snapshots] Error comparando snapshots:", e.message);
    return res.status(500).json({ error: "Error comparando snapshots" });
  }
});

app.get("/api/snapshots/:id", async (req, res) => {
  res.set("Cache-Control", "no-store");

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

    const snapshot = await readSnapshotByIdFromDb(req.params.id);

    if (!snapshot) {
      return res.status(404).json({ error: "Snapshot no encontrado" });
    }

    return res.json(snapshot);
  } catch (e) {
    console.error("[snapshots] Error leyendo snapshot por id:", e.message);
    return res.status(500).json({ error: "Error leyendo snapshot" });
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

app.get("/api/debug/reference/:code", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const code = String(req.params.code || "").toUpperCase();
    const result = await resolveReference(code);

    return res.json({
      ok: true,
      reference: result,
    });
  } catch (e) {
    console.error("❌ /api/debug/reference:", e.message);

    return res.status(500).json({
      ok: false,
      error: e.message,
    });
  }
});

app.get("/api/debug/references", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const codes = ["BCV_USD", "BCV_EUR", "BRL_PTAX"];
    const results = {};

    for (const code of codes) {
      results[code] = await resolveReference(code);
    }

    return res.json({
      ok: true,
      results,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e.message,
    });
  }
});

app.get("/api/debug/quote-strategies", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    return res.json({
      ok: true,
      strategies: getEffectiveQuoteStrategies(),
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ /api/debug/quote-strategies:", e.message);

    return res.status(500).json({
      ok: false,
      error: "No se pudo leer configuración del motor",
      detail: e.message,
    });
  }
});

function obtenerEstrategiaBinance(strategy) {
  if (!strategy) return null;

  if (strategy.provider === "binance") return strategy;

  if (Array.isArray(strategy.providers)) {
    return strategy.providers.find((p) => p.provider === "binance") || null;
  }

  return null;
}

function calcularPromedioMedianaDesdePrecios(precios = [], strategy = {}) {
  const trimLowest = Math.max(0, Number(strategy.trimLowest) || 0);
  const trimHighest = Math.max(0, Number(strategy.trimHighest) || 0);

  let nums = precios
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  const rawCount = nums.length;

  if (trimLowest || trimHighest) {
    nums = nums.slice(trimLowest, nums.length - trimHighest);
  }

  const usedCount = nums.length;

  if (!nums.length) {
    return {
      promedio: null,
      mediana: null,
      rawCount,
      usedCount,
      diferenciaPct: null,
    };
  }

  const promedio = nums.reduce((a, b) => a + b, 0) / nums.length;

  const mid = Math.floor(nums.length / 2);
  const mediana =
    nums.length % 2 === 0
      ? (nums[mid - 1] + nums[mid]) / 2
      : nums[mid];

  const diferenciaPct =
    promedio && mediana
      ? ((promedio - mediana) / mediana) * 100
      : null;

  return {
    promedio: formatearTasa(promedio),
    mediana: formatearTasa(mediana),
    rawCount,
    usedCount,
    diferenciaPct: formatearTasa(diferenciaPct),
  };
}

function interpretarComparacionMetodo(item) {
  const diff = Math.abs(Number(item?.diferenciaPct));

  if (!Number.isFinite(diff)) {
    return {
      nivel: "sin_datos",
      texto: "No hay datos suficientes para comparar métodos.",
    };
  }

  if (diff < 0.25) {
    return {
      nivel: "estable",
      texto: "El mercado está parejo. Promedio y mediana dan resultados muy similares.",
    };
  }

  if (diff < 0.75) {
    return {
      nivel: "observacion",
      texto: "Hay una diferencia moderada. Conviene observar si se repite antes de cambiar el método.",
    };
  }

  return {
    nivel: "revisar",
    texto: "Hay una diferencia alta entre promedio y mediana. Conviene evaluar usar mediana o excluir más extremos.",
  };
}

async function compararMetodoBinance(currency, side, strategy) {
  const rows = Math.max(
    1,
    Math.min(Number(strategy.rows || 20), 100)
  );

  const amountInfo = await calcularTransAmountDebug(currency, strategy);

  const data = await callBinanceP2PPaginated({
    fiat: currency,
    tradeType: strategy.tradeType,
    page: strategy.page || 1,
    payTypes: strategy.payTypes || [],
    transAmount: amountInfo.transAmount,
    rows,
  });

  const items = Array.isArray(data?.data) ? data.data : [];
  const precios = [];

  for (const item of items) {
    const adv = item?.adv;
    if (!adv) continue;

    const price = Number(adv.price);
    if (!Number.isFinite(price) || price <= 0) continue;
    if (adv.isAdvBanned) continue;

    precios.push(price);
    if (precios.length >= rows) break;
  }

  const comparacion = calcularPromedioMedianaDesdePrecios(precios, strategy);
  const lectura = interpretarComparacionMetodo(comparacion);

  return {
    currency,
    side,
    tradeType: strategy.tradeType,
    metodoActual: strategy.aggregation || "average",
    rows,
    trimLowest: Math.max(0, Number(strategy.trimLowest) || 0),
    trimHighest: Math.max(0, Number(strategy.trimHighest) || 0),

    amountMode: amountInfo.amountMode,
    amountUsdt: amountInfo.amountUsdt,
    probePrice: amountInfo.probePrice,
    transAmount: amountInfo.transAmount,

    payTypes: Array.isArray(strategy.payTypes) ? strategy.payTypes : [],

    pagesFetched: data.pages_fetched,
    returnedRows: data.returned_rows,

    ...comparacion,
    lectura,
    captured_at: new Date().toISOString(),
  };
}

app.get("/api/debug/quote-method-compare", async (req, res) => {
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
    const effectiveStrategies = getEffectiveQuoteStrategies();

    for (const code of codes) {
      const cfg = effectiveStrategies?.[code];
      if (!cfg) continue;

      results[code] = {};

      for (const side of ["buy", "sell"]) {
        const binanceStrategy = obtenerEstrategiaBinance(cfg[side]);

        if (!binanceStrategy) {
          results[code][side] = {
            currency: code,
            side,
            skipped: true,
            reason: "Este lado no usa mercado P2P directo.",
          };
          continue;
        }

        try {
          results[code][side] = await compararMetodoBinance(
            code,
            side,
            binanceStrategy
          );
        } catch (e) {
          results[code][side] = {
            currency: code,
            side,
            error: e.message,
            skipped: true,
          };
        }
      }
    }

    return res.json({
      ok: true,
      captured_at: new Date().toISOString(),
      results,
    });
  } catch (e) {
    console.error("❌ /api/debug/quote-method-compare:", e.message);

    return res.status(500).json({
      ok: false,
      error: "No se pudo comparar promedio y mediana",
      detail: e.message,
    });
  }
});

function obtenerEstrategiaParaRaw(currency, tradeType) {
  const code = String(currency || "").toUpperCase();
  const tipo = String(tradeType || "").toUpperCase();

  const side = tipo === "BUY" ? "buy" : "sell";

  const effectiveStrategies = getEffectiveQuoteStrategies();
  const cfg = effectiveStrategies?.[code]?.[side];

  if (!cfg) return null;

  if (cfg.provider === "binance") return cfg;

  if (Array.isArray(cfg.providers)) {
    return cfg.providers.find((p) => p.provider === "binance") || null;
  }

  return null;
}

function extraerMetodosPagoRaw(adv) {
  const tradeMethods = Array.isArray(adv?.tradeMethods) ? adv.tradeMethods : [];

  return tradeMethods
    .map((m) => ({
      identifier: m.identifier || null,
      name: m.tradeMethodName || m.name || m.identifier || null,
    }))
    .filter((m) => m.identifier || m.name);
}

async function calcularTransAmountDebug(currency, strategy) {
  const amountMode = strategy?.amountMode || "fixed";
  const amountUsdt = Number(strategy?.amountUsdt);

  if (!(amountMode === "usdt" && Number.isFinite(amountUsdt) && amountUsdt > 0)) {
    return {
      amountMode,
      amountUsdt: null,
      probePrice: null,
      transAmount: strategy?.transAmount ?? null,
    };
  }

  const probeData = await callBinanceP2P({
    fiat: currency,
    tradeType: strategy.tradeType,
    page: strategy.page || 1,
    payTypes: strategy.payTypes || [],
    transAmount: null,
  });

  const probePrices = [];

  for (const item of probeData?.data || []) {
    const adv = item?.adv;
    if (!adv) continue;

    const price = Number(adv.price);
    if (!Number.isFinite(price) || price <= 0) continue;
    if (adv.isAdvBanned) continue;

    probePrices.push(price);
    if (probePrices.length >= 10) break;
  }

  if (!probePrices.length) {
    return {
      amountMode,
      amountUsdt,
      probePrice: null,
      transAmount: null,
    };
  }

  const probePrice =
    probePrices.reduce((a, b) => a + b, 0) / probePrices.length;

  return {
    amountMode,
    amountUsdt,
    probePrice: formatearTasa(probePrice),
    transAmount: Math.round(amountUsdt * probePrice),
  };
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

app.get("/api/debug/binance-raw/:currency/:tradeType", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const currency = String(req.params.currency || "").toUpperCase();
  const tradeType = String(req.params.tradeType || "").toUpperCase();

  if (!isSupportedCurrency(currency)) {
    return res.status(400).json({ error: `Moneda no soportada: ${currency}` });
  }

  if (!["BUY", "SELL"].includes(tradeType)) {
    return res.status(400).json({ error: "tradeType debe ser BUY o SELL" });
  }

  try {
    const strategy = obtenerEstrategiaParaRaw(currency, tradeType);

    if (!strategy) {
      return res.status(400).json({
        error: `${currency}.${tradeType} no usa Binance P2P directo`,
      });
    }

    const amountInfo = await calcularTransAmountDebug(currency, strategy);

const rows = Math.max(
  1,
  Math.min(Number(req.query.rows || strategy.rows || 20), 100)
);

const data = await callBinanceP2PPaginated({
  fiat: currency,
  tradeType,
  page: strategy.page || 1,
  payTypes: strategy.payTypes || [],
  transAmount: amountInfo.transAmount,
  rows,
});

const rawItems = Array.isArray(data?.data) ? data.data : [];

const ads = rawItems.map((item, index) => {
      const adv = item?.adv || {};
      const advertiser = item?.advertiser || {};

      return {
        position: index + 1,
        price: Number(adv.price),
        minSingleTransAmount: Number(adv.minSingleTransAmount) || null,
        maxSingleTransAmount: Number(adv.maxSingleTransAmount) || null,
        tradableQuantity: adv.tradableQuantity || null,
        isAdvBanned: !!adv.isAdvBanned,
        advertiserNickName:
          advertiser.nickName ||
          advertiser.userName ||
          advertiser.realName ||
          null,
        monthOrderCount: advertiser.monthOrderCount ?? null,
        monthFinishRate: advertiser.monthFinishRate ?? null,
        payMethods: extraerMetodosPagoRaw(adv),
      };
    });

    const prices = ads
      .map((a) => Number(a.price))
      .filter((n) => Number.isFinite(n) && n > 0);

    const average = prices.length
      ? formatearTasa(prices.reduce((a, b) => a + b, 0) / prices.length)
      : null;

    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length
      ? formatearTasa(
          sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid]
        )
      : null;

    return res.json({
      ok: true,
      currency,
      tradeType,
      side: tradeType === "BUY" ? "compra" : "venta",
      query: {
        rows,
        payTypes: strategy.payTypes || [],
        amountMode: amountInfo.amountMode,
        amountUsdt: amountInfo.amountUsdt,
        probePrice: amountInfo.probePrice,
        transAmount: amountInfo.transAmount,
        pagesFetched: data.pages_fetched,
returnedRows: data.returned_rows,
      },
      summary: {
        count: ads.length,
        firstPrice: ads[0]?.price ?? null,
        average,
        median,
      },
      ads,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ /api/debug/binance-raw:", currency, tradeType, e.message);

    return res.status(500).json({
      ok: false,
      error: "No se pudieron leer anuncios crudos",
      detail: e.message,
    });
  }
});


app.post("/api/admin/quote-strategies/amounts", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const changes = Array.isArray(req.body?.changes) ? req.body.changes : [];

    if (!changes.length) {
      return res.status(400).json({
        ok: false,
        error: "No hay cambios para aplicar",
      });
    }

    const actor =
  req.headers["x-admin-user"] ||
  req.body?.actor ||
  "admin";

const result = await applyQuoteStrategyAmountOverrides(changes, {
  actor,
  source: "admin_panel",
});

    return res.json({
      ok: true,
      applied: result.applied,
      overrides: result.overrides,
      strategies: result.strategies,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ /api/admin/quote-strategies/amounts:", e.message);

    return res.status(500).json({
      ok: false,
      error: "No se pudo aplicar configuración del motor",
      detail: e.message,
    });
  }
});

app.get("/api/admin/audit-log", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const area = req.query.area ? String(req.query.area) : null;
    const limit = req.query.limit || 50;

    const logs = await readAuditLogs({ area, limit });

    return res.json({
      ok: true,
      logs,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ /api/admin/audit-log:", e.message);

    return res.status(500).json({
      ok: false,
      error: "No se pudo leer historial de auditoría",
      detail: e.message,
    });
  }
});

app.get("/api/debug/binance-paytypes/:currency/:tradeType", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const currency = String(req.params.currency || "").toUpperCase();
  const tradeType = String(req.params.tradeType || "").toUpperCase();

  if (!isSupportedCurrency(currency)) {
    return res.status(400).json({ error: `Moneda no soportada: ${currency}` });
  }

  if (!["BUY", "SELL"].includes(tradeType)) {
    return res.status(400).json({ error: "tradeType debe ser BUY o SELL" });
  }

  try {
    const strategy = obtenerEstrategiaParaRaw(currency, tradeType);

    if (!strategy) {
      return res.status(400).json({
        error: `${currency}.${tradeType} no usa Binance P2P directo`,
      });
    }

    const amountInfo = await calcularTransAmountDebug(currency, strategy);

const rows = Math.max(
  1,
  Math.min(Number(req.query.rows || strategy.rows || 20), 100)
);

const data = await callBinanceP2PPaginated({
  fiat: currency,
  tradeType,
  page: strategy.page || 1,
  payTypes: [],
  transAmount: amountInfo.transAmount,
  rows,
});

const rawItems = Array.isArray(data?.data) ? data.data : [];

    const grouped = {};

    for (const item of rawItems) {
      const adv = item?.adv || {};
      const advertiser = item?.advertiser || {};
      const methods = extraerMetodosPagoRaw(adv);

      for (const method of methods) {
        const identifier = method.identifier || method.name || "unknown";
        const name = method.name || method.identifier || "Método desconocido";

        if (!grouped[identifier]) {
          grouped[identifier] = {
            identifier,
            name,
            count: 0,
            prices: [],
            advertisers: new Set(),
          };
        }

        const price = Number(adv.price);

        grouped[identifier].count += 1;

        if (Number.isFinite(price) && price > 0) {
          grouped[identifier].prices.push(price);
        }

        const nick =
          advertiser.nickName ||
          advertiser.userName ||
          advertiser.realName ||
          null;

        if (nick) grouped[identifier].advertisers.add(nick);
      }
    }

    const methods = Object.values(grouped)
      .map((m) => {
        const prices = m.prices || [];
        const avg = prices.length
          ? formatearTasa(prices.reduce((a, b) => a + b, 0) / prices.length)
          : null;

        const min = prices.length ? Math.min(...prices) : null;
        const max = prices.length ? Math.max(...prices) : null;

        return {
          identifier: m.identifier,
          name: m.name,
          count: m.count,
          average_price: avg,
          min_price: min == null ? null : formatearTasa(min),
          max_price: max == null ? null : formatearTasa(max),
          advertisers_count: m.advertisers.size,
        };
      })
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return String(a.name).localeCompare(String(b.name));
      });

    return res.json({
      ok: true,
      currency,
      tradeType,
      side: tradeType === "BUY" ? "compra" : "venta",
      query: {
        rows,
        amountMode: amountInfo.amountMode,
        amountUsdt: amountInfo.amountUsdt,
        probePrice: amountInfo.probePrice,
        transAmount: amountInfo.transAmount,
        pagesFetched: data.pages_fetched,
returnedRows: data.returned_rows,
      },
      methods,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ /api/debug/binance-paytypes:", currency, tradeType, e.message);

    return res.status(500).json({
      ok: false,
      error: "No se pudieron leer métodos de pago",
      detail: e.message,
    });
  }
});

app.get("/api/debug/binance-paytypes-scan/:currency", async (req, res) => {
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
    const rows = Math.max(20, Math.min(Number(req.query.rows) || 80, 100));
    const catalog = {};

    async function scanSide(tradeType, useAmount) {
      const strategy = obtenerEstrategiaParaRaw(currency, tradeType);

      if (!strategy) return;

      let transAmount = null;
      let amountInfo = {
        amountMode: "none",
        amountUsdt: null,
        probePrice: null,
        transAmount: null,
      };

      if (useAmount) {
        amountInfo = await calcularTransAmountDebug(currency, strategy);
        transAmount = amountInfo.transAmount;
      }

const data = await callBinanceP2PPaginated({
  fiat: currency,
  tradeType,
  page: strategy.page || 1,
  payTypes: [],
  transAmount,
  rows,
});

const rawItems = Array.isArray(data?.data) ? data.data : [];

      for (const item of rawItems) {
        const adv = item?.adv || {};
        const advertiser = item?.advertiser || {};
        const methods = extraerMetodosPagoRaw(adv);

        const price = Number(adv.price);
        const nick =
          advertiser.nickName ||
          advertiser.userName ||
          advertiser.realName ||
          null;

        for (const method of methods) {
          const identifier = method.identifier || method.name || "unknown";
          const name = method.name || method.identifier || "Método desconocido";

          if (!catalog[identifier]) {
            catalog[identifier] = {
              identifier,
              name,
              seen_count: 0,
              sides_seen: [],
              contexts_seen: [],
              prices: [],
              advertisers: new Set(),
              first_seen_at: new Date().toISOString(),
              last_seen_at: null,
            };
          }

          const entry = catalog[identifier];

          entry.seen_count += 1;

          if (!entry.sides_seen.includes(tradeType)) {
            entry.sides_seen.push(tradeType);
          }

          const context = useAmount ? "con_monto_operativo" : "sin_monto";
          if (!entry.contexts_seen.includes(context)) {
            entry.contexts_seen.push(context);
          }

          if (Number.isFinite(price) && price > 0) {
            entry.prices.push(price);
          }

          if (nick) {
            entry.advertisers.add(nick);
          }

          entry.last_seen_at = new Date().toISOString();
        }
      }

      return amountInfo;
    }

    const probes = {};

    for (const tradeType of ["BUY", "SELL"]) {
      probes[`${tradeType}_with_amount`] = await scanSide(tradeType, true);
      probes[`${tradeType}_without_amount`] = await scanSide(tradeType, false);
    }

    const methods = Object.values(catalog)
      .map((m) => {
        const prices = m.prices || [];
        const avg = prices.length
          ? formatearTasa(prices.reduce((a, b) => a + b, 0) / prices.length)
          : null;

        const min = prices.length ? Math.min(...prices) : null;
        const max = prices.length ? Math.max(...prices) : null;

        return {
          identifier: m.identifier,
          name: m.name,
          seen_count: m.seen_count,
          sides_seen: m.sides_seen,
          contexts_seen: m.contexts_seen,
          average_price: avg,
          min_price: min == null ? null : formatearTasa(min),
          max_price: max == null ? null : formatearTasa(max),
          advertisers_count: m.advertisers.size,
          first_seen_at: m.first_seen_at,
          last_seen_at: m.last_seen_at,
        };
      })
      .sort((a, b) => {
        if (b.seen_count !== a.seen_count) return b.seen_count - a.seen_count;
        return String(a.name).localeCompare(String(b.name));
      });

    return res.json({
      ok: true,
      currency,
      rows,
      scanned_contexts: [
        "BUY con monto operativo",
        "BUY sin monto",
        "SELL con monto operativo",
        "SELL sin monto",
      ],
      probes,
      methods,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ /api/debug/binance-paytypes-scan:", currency, e.message);

    return res.status(500).json({
      ok: false,
      error: "No se pudo escanear catálogo de métodos",
      detail: e.message,
    });
  }
});

function unirArraysUnicos(a = [], b = []) {
  return Array.from(new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]));
}

function clasificarPopularidadMetodo(method, topSeenCount) {
  const seen = Number(method.seen_count) || 0;
  const advertisers = Number(method.advertisers_count) || 0;

  const sides = Array.isArray(method.sides_seen) ? method.sides_seen.length : 0;
  const contexts = Array.isArray(method.contexts_seen) ? method.contexts_seen.length : 0;

  const score =
    seen +
    advertisers * 1.5 +
    (sides >= 2 ? 8 : 0) +
    (contexts >= 2 ? 5 : 0);

  let label = "Ocasional";

  if (seen >= 30 && topSeenCount > 0 && seen >= topSeenCount * 0.85) {
    label = "Dominante";
  } else if (topSeenCount > 0 && seen >= topSeenCount * 0.5) {
    label = "Popular";
  } else if (topSeenCount > 0 && seen >= topSeenCount * 0.2) {
    label = "Presente";
  }

  return {
    rank_score: formatearTasa(score),
    rank_label: label,
  };
}

function recalcularRankingCatalogoMoneda(currencyCatalog) {
  const methodsObj = currencyCatalog?.methods || {};
  const methods = Object.values(methodsObj);

  const topSeenCount = methods.reduce((max, m) => {
    return Math.max(max, Number(m.seen_count) || 0);
  }, 0);

  for (const method of methods) {
    const rank = clasificarPopularidadMetodo(method, topSeenCount);
    method.rank_score = rank.rank_score;
    method.rank_label = rank.rank_label;
  }

  const ordered = methods.sort((a, b) => {
    if (Number(b.rank_score) !== Number(a.rank_score)) {
      return Number(b.rank_score) - Number(a.rank_score);
    }

    if (Number(b.seen_count) !== Number(a.seen_count)) {
      return Number(b.seen_count) - Number(a.seen_count);
    }

    return String(a.name).localeCompare(String(b.name));
  });

  currencyCatalog.methods_ordered = ordered.map((m) => m.identifier);

  return currencyCatalog;
}

function fusionarPaytypeCatalogo(catalogoActual = {}, currency, scanResult) {
  const code = String(currency || "").toUpperCase();

  const next = {
    version: 1,
    currencies: {
      ...(catalogoActual.currencies || {}),
    },
  };

  const actualCurrency = next.currencies[code] || {
    currency: code,
    methods: {},
    scan_count: 0,
    first_scanned_at: new Date().toISOString(),
    last_scanned_at: null,
  };

  actualCurrency.methods = actualCurrency.methods || {};
  actualCurrency.scan_count = (Number(actualCurrency.scan_count) || 0) + 1;
  actualCurrency.last_scanned_at = new Date().toISOString();

  for (const method of scanResult.methods || []) {
    const id = method.identifier;
    if (!id) continue;

    const prev = actualCurrency.methods[id] || {
      identifier: id,
      name: method.name || id,
      seen_count: 0,
      advertisers_count: 0,
      sides_seen: [],
      contexts_seen: [],
      first_seen_at: new Date().toISOString(),
      last_seen_at: null,
      min_price: null,
      max_price: null,
      last_average_price: null,
      scan_hits: 0,
    };

    const prevSeen = Number(prev.seen_count) || 0;
    const newSeen = Number(method.seen_count) || 0;

    prev.name = method.name || prev.name || id;
    prev.seen_count = prevSeen + newSeen;
    prev.scan_hits = (Number(prev.scan_hits) || 0) + 1;

    prev.advertisers_count = Math.max(
      Number(prev.advertisers_count) || 0,
      Number(method.advertisers_count) || 0
    );

    prev.sides_seen = unirArraysUnicos(prev.sides_seen, method.sides_seen);
    prev.contexts_seen = unirArraysUnicos(prev.contexts_seen, method.contexts_seen);

    const methodMin = Number(method.min_price);
    const methodMax = Number(method.max_price);

    if (Number.isFinite(methodMin)) {
      prev.min_price =
        prev.min_price == null
          ? methodMin
          : Math.min(Number(prev.min_price), methodMin);
    }

    if (Number.isFinite(methodMax)) {
      prev.max_price =
        prev.max_price == null
          ? methodMax
          : Math.max(Number(prev.max_price), methodMax);
    }

    prev.last_average_price = method.average_price ?? prev.last_average_price;
    prev.last_seen_at = new Date().toISOString();

    actualCurrency.methods[id] = prev;
  }

  next.currencies[code] = recalcularRankingCatalogoMoneda(actualCurrency);
  next.updated_at = new Date().toISOString();

  return next;
}

app.post("/api/admin/paytypes/scan/:currency", async (req, res) => {
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
    const rows = Math.max(20, Math.min(Number(req.query.rows) || 80, 100));
    const catalog = {};

    async function scanSide(tradeType, useAmount) {
      const strategy = obtenerEstrategiaParaRaw(currency, tradeType);
      if (!strategy) return null;

      let transAmount = null;
      let amountInfo = {
        amountMode: "none",
        amountUsdt: null,
        probePrice: null,
        transAmount: null,
      };

      if (useAmount) {
        amountInfo = await calcularTransAmountDebug(currency, strategy);
        transAmount = amountInfo.transAmount;
      }

const data = await callBinanceP2PPaginated({
  fiat: currency,
  tradeType,
  page: strategy.page || 1,
  payTypes: [],
  transAmount,
  rows,
});

const rawItems = Array.isArray(data?.data) ? data.data : [];

      for (const item of rawItems) {
        const adv = item?.adv || {};
        const advertiser = item?.advertiser || {};
        const methods = extraerMetodosPagoRaw(adv);

        const price = Number(adv.price);
        const nick =
          advertiser.nickName ||
          advertiser.userName ||
          advertiser.realName ||
          null;

        for (const method of methods) {
          const identifier = method.identifier || method.name || "unknown";
          const name = method.name || method.identifier || "Método desconocido";

          if (!catalog[identifier]) {
            catalog[identifier] = {
              identifier,
              name,
              seen_count: 0,
              sides_seen: [],
              contexts_seen: [],
              prices: [],
              advertisers: new Set(),
            };
          }

          const entry = catalog[identifier];

          entry.seen_count += 1;

          if (!entry.sides_seen.includes(tradeType)) {
            entry.sides_seen.push(tradeType);
          }

          const context = useAmount ? "con_monto_operativo" : "sin_monto";
          if (!entry.contexts_seen.includes(context)) {
            entry.contexts_seen.push(context);
          }

          if (Number.isFinite(price) && price > 0) {
            entry.prices.push(price);
          }

          if (nick) {
            entry.advertisers.add(nick);
          }
        }
      }

      return amountInfo;
    }

    const probes = {};

    for (const tradeType of ["BUY", "SELL"]) {
      probes[`${tradeType}_with_amount`] = await scanSide(tradeType, true);
      probes[`${tradeType}_without_amount`] = await scanSide(tradeType, false);
    }

    const methods = Object.values(catalog)
      .map((m) => {
        const prices = m.prices || [];

        const avg = prices.length
          ? formatearTasa(prices.reduce((a, b) => a + b, 0) / prices.length)
          : null;

        const min = prices.length ? Math.min(...prices) : null;
        const max = prices.length ? Math.max(...prices) : null;

        return {
          identifier: m.identifier,
          name: m.name,
          seen_count: m.seen_count,
          sides_seen: m.sides_seen,
          contexts_seen: m.contexts_seen,
          average_price: avg,
          min_price: min == null ? null : formatearTasa(min),
          max_price: max == null ? null : formatearTasa(max),
          advertisers_count: m.advertisers.size,
        };
      })
      .sort((a, b) => {
        if (b.seen_count !== a.seen_count) return b.seen_count - a.seen_count;
        return String(a.name).localeCompare(String(b.name));
      });

    const scanResult = {
      currency,
      rows,
      probes,
      methods,
      captured_at: new Date().toISOString(),
    };

    const beforeCatalog = await readPaytypeCatalog();
    const nextCatalog = fusionarPaytypeCatalogo(beforeCatalog, currency, scanResult);
    const persisted = await writePaytypeCatalog(nextCatalog);

    const actor =
      req.headers["x-admin-user"] ||
      req.body?.actor ||
      "admin";

    const audit = await writeAuditLog({
      area: "paytype_catalog",
      action: "scan_currency",
      entity_key: currency,
      actor,
      source: "admin_panel",
      before_value: beforeCatalog?.currencies?.[currency] || null,
      after_value: nextCatalog?.currencies?.[currency] || null,
      metadata: {
        rows,
        detected_methods: methods.length,
        persisted_storage: persisted?.storage || null,
      },
    });

    return res.json({
      ok: true,
      currency,
      scan: scanResult,
      catalog: nextCatalog.currencies?.[currency] || null,
      persisted,
      audit,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ /api/admin/paytypes/scan:", currency, e.message);

    return res.status(500).json({
      ok: false,
      error: "No se pudo escanear y guardar catálogo de métodos",
      detail: e.message,
    });
  }
});

app.get("/api/admin/paytypes/catalog", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const catalog = await readPaytypeCatalog();

    return res.json({
      ok: true,
      catalog,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ /api/admin/paytypes/catalog:", e.message);

    return res.status(500).json({
      ok: false,
      error: "No se pudo leer catálogo de métodos",
      detail: e.message,
    });
  }
});

app.post("/api/admin/quote-strategies/paytypes", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const changes = Array.isArray(req.body?.changes) ? req.body.changes : [];

    if (!changes.length) {
      return res.status(400).json({
        ok: false,
        error: "No hay cambios para aplicar",
      });
    }

    const actor =
      req.headers["x-admin-user"] ||
      req.body?.actor ||
      "admin";

    const result = await applyQuoteStrategyPaytypeOverrides(changes, {
      actor,
      source: "admin_panel",
    });

    return res.json({
      ok: true,
      applied: result.applied,
      overrides: result.overrides,
      strategies: result.strategies,
      persisted: result.persisted,
      audit: result.audit,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ /api/admin/quote-strategies/paytypes:", e.message);

    return res.status(500).json({
      ok: false,
      error: "No se pudo aplicar configuración de métodos",
      detail: e.message,
    });
  }
});

function analizarElegibilidadAnuncioOperativo(adv, amountInfo, options = {}) {
  const transAmount = Number(amountInfo?.transAmount);
  const price = Number(adv?.price);

  const minAmount = Number(adv?.minSingleTransAmount);
  const maxAmount = Number(adv?.maxSingleTransAmount);

  const maxMinAmountMultiplier = Number(options.maxMinAmountMultiplier) || 1.25;
  const maxAmountMultiplier = Number(options.maxAmountMultiplier) || null;

  const reasons = [];

  if (!Number.isFinite(price) || price <= 0) {
    reasons.push("Precio inválido");
  }

  if (adv?.isAdvBanned) {
    reasons.push("Anuncio bloqueado por Binance");
  }

  if (!Number.isFinite(transAmount) || transAmount <= 0) {
    reasons.push("Monto operativo inválido o no calculado");
  }

  if (Number.isFinite(transAmount) && transAmount > 0) {
    if (Number.isFinite(minAmount) && minAmount > transAmount) {
      reasons.push(
        `Mínimo requerido superior al monto operativo (${formatearTasa(minAmount)} > ${formatearTasa(transAmount)})`
      );
    }

    if (Number.isFinite(maxAmount) && maxAmount < transAmount) {
      reasons.push(
        `Máximo permitido inferior al monto operativo (${formatearTasa(maxAmount)} < ${formatearTasa(transAmount)})`
      );
    }

    if (
  Number.isFinite(maxAmount) &&
  Number.isFinite(maxAmountMultiplier) &&
  maxAmountMultiplier > 0 &&
  maxAmount > transAmount * maxAmountMultiplier
) {
  reasons.push(
    `Máximo demasiado alto frente al monto operativo (${formatearTasa(maxAmount)} > ${formatearTasa(transAmount * maxAmountMultiplier)})`
  );
}

    if (
      Number.isFinite(minAmount) &&
      minAmount > transAmount * maxMinAmountMultiplier
    ) {
      reasons.push(
        `Mínimo demasiado alto frente al monto operativo (${formatearTasa(minAmount)} > ${formatearTasa(transAmount * maxMinAmountMultiplier)})`
      );
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

function calcularResumenElegibilidad(rows = []) {
  const total = rows.length;
  const used = rows.filter((r) => r.eligible).length;
  const discarded = total - used;

  const reasonCounts = {};

  for (const row of rows) {
    for (const reason of row.reasons || []) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
  }

  const eligiblePrices = rows
    .filter((r) => r.eligible)
    .map((r) => Number(r.price))
    .filter((n) => Number.isFinite(n) && n > 0);

  const allPrices = rows
    .map((r) => Number(r.price))
    .filter((n) => Number.isFinite(n) && n > 0);

  function avg(nums) {
    if (!nums.length) return null;
    return formatearTasa(nums.reduce((a, b) => a + b, 0) / nums.length);
  }

  function median(nums) {
    if (!nums.length) return null;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return formatearTasa((sorted[mid - 1] + sorted[mid]) / 2);
    }

    return formatearTasa(sorted[mid]);
  }

  return {
    total_ads: total,
    eligible_ads: used,
    discarded_ads: discarded,
    discard_reasons: Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    all_ads: {
      average: avg(allPrices),
      median: median(allPrices),
    },
    eligible_only: {
      average: avg(eligiblePrices),
      median: median(eligiblePrices),
    },
  };
}

app.get("/api/debug/binance-operational-filter/:currency/:tradeType", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const currency = String(req.params.currency || "").toUpperCase();
  const tradeType = String(req.params.tradeType || "").toUpperCase();

  if (!isSupportedCurrency(currency)) {
    return res.status(400).json({ error: `Moneda no soportada: ${currency}` });
  }

  if (!["BUY", "SELL"].includes(tradeType)) {
    return res.status(400).json({ error: "tradeType debe ser BUY o SELL" });
  }

  try {
    const strategy = obtenerEstrategiaParaRaw(currency, tradeType);

    if (!strategy) {
      return res.status(400).json({
        error: `${currency}.${tradeType} no usa Binance P2P directo`,
      });
    }

    const rows = Math.max(20, Math.min(Number(req.query.rows) || 50, 100));
    const maxMinAmountMultiplier =
      Number(req.query.maxMinAmountMultiplier) > 0
        ? Number(req.query.maxMinAmountMultiplier)
        : 1.25;

        const maxAmountMultiplier =
  Number(req.query.maxAmountMultiplier) > 0
    ? Number(req.query.maxAmountMultiplier)
    : null;

    const amountInfo = await calcularTransAmountDebug(currency, strategy);

const data = await callBinanceP2PPaginated({
  fiat: currency,
  tradeType,
  page: strategy.page || 1,
  payTypes: strategy.payTypes || [],
  transAmount: amountInfo.transAmount,
  rows,
});

const rawItems = Array.isArray(data?.data) ? data.data : [];

    const ads = rawItems.map((item, index) => {
      const adv = item?.adv || {};
      const advertiser = item?.advertiser || {};

const check = analizarElegibilidadAnuncioOperativo(adv, amountInfo, {
  maxMinAmountMultiplier,
  maxAmountMultiplier,
});

      return {
        position: index + 1,
        eligible: check.eligible,
        status: check.eligible ? "usado" : "descartado",
        reasons: check.reasons,
        price: Number(adv.price),
        minSingleTransAmount: Number(adv.minSingleTransAmount) || null,
        maxSingleTransAmount: Number(adv.maxSingleTransAmount) || null,
        tradableQuantity: adv.tradableQuantity || null,
        advertiserNickName:
          advertiser.nickName ||
          advertiser.userName ||
          advertiser.realName ||
          null,
        monthOrderCount: advertiser.monthOrderCount ?? null,
        monthFinishRate: advertiser.monthFinishRate ?? null,
        payMethods: extraerMetodosPagoRaw(adv),
      };
    });

    const summary = calcularResumenElegibilidad(ads);

    return res.json({
      ok: true,
      currency,
      tradeType,
      side: tradeType === "BUY" ? "compra" : "venta",
      query: {
        rows,
        payTypes: strategy.payTypes || [],
        amountMode: amountInfo.amountMode,
        amountUsdt: amountInfo.amountUsdt,
        probePrice: amountInfo.probePrice,
        transAmount: amountInfo.transAmount,
        maxMinAmountMultiplier,
        maxAmountMultiplier,
        pagesFetched: data.pages_fetched,
returnedRows: data.returned_rows,
      },
      summary,
      ads,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error(
      "❌ /api/debug/binance-operational-filter:",
      currency,
      tradeType,
      e.message
    );

    return res.status(500).json({
      ok: false,
      error: "No se pudo analizar filtro operativo",
      detail: e.message,
    });
  }
});

app.post("/api/admin/quote-strategies/advanced", async (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: "ADMIN_KEY no configurada" });
  }

  const clientKey = req.headers["x-admin-key"];
  if (!clientKey || clientKey !== ADMIN_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const changes = Array.isArray(req.body?.changes) ? req.body.changes : [];

    if (!changes.length) {
      return res.status(400).json({
        ok: false,
        error: "No hay cambios para aplicar",
      });
    }

    const actor =
      req.headers["x-admin-user"] ||
      req.body?.actor ||
      "admin";

    const result = await applyQuoteStrategyAdvancedOverrides(changes, {
      actor,
      source: "admin_panel",
    });

    return res.json({
      ok: true,
      applied: result.applied,
      overrides: result.overrides,
      strategies: result.strategies,
      persisted: result.persisted,
      audit: result.audit,
      captured_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ /api/admin/quote-strategies/advanced:", e.message);

    return res.status(500).json({
      ok: false,
      error: "No se pudo aplicar configuración avanzada del motor",
      detail: e.message,
    });
  }
});

// ---------- Arranque ----------
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`📁 Snapshot fallback local: ${getSnapshotPath()}`);

  await initDb();
await loadQuoteStrategyOverridesFromStore();
});