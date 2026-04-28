const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || null;
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

          await pool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS app_audit_logs (
        id BIGSERIAL PRIMARY KEY,
        area TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_key TEXT,
        actor TEXT,
        source TEXT,
        before_value JSONB,
        after_value JSONB,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

function calcularPromedioSnapshot(compra, venta) {
  const c = Number(compra);
  const v = Number(venta);

  if (!Number.isFinite(c) && !Number.isFinite(v)) return null;
  if (Number.isFinite(c) && Number.isFinite(v)) return Number(((c + v) / 2).toFixed(6));
  if (Number.isFinite(c)) return c;
  return v;
}

function resumirSnapshotRow(row) {
  const data = row?.data || {};
  const monedas = {};
  const codigos = ["VES", "ARS", "COP", "PEN", "CLP", "MXN", "BRL"];

  for (const code of codigos) {
    const item = data?.[code];
    if (!item || typeof item !== "object") continue;

    const compra = Number(item.compra);
    const venta = Number(item.venta);

    monedas[code] = {
      compra: Number.isFinite(compra) ? compra : null,
      venta: Number.isFinite(venta) ? venta : null,
      promedio: calcularPromedioSnapshot(compra, venta),
    };
  }

return {
  id: row.id,
  guardado_en: row.guardado_en,
  timestamp: data.timestamp || null,
  monedas,
  cruces: data.cruces && typeof data.cruces === "object"
    ? data.cruces
    : {},
  totales: {
    monedas: Object.keys(monedas).length,
    cruces: Object.keys(data.cruces || {}).length,
    margenes: Object.keys(data.margenesCruce || {}).length,
  },
    publicConfig: {
      calculatorState: data.publicConfig?.calculatorState || null,
      message: data.publicConfig?.message || "",
    },
    referencias: {
      bcv_usd: Number.isFinite(Number(data.referencias?.bcv?.usd))
        ? Number(data.referencias.bcv.usd)
        : null,
      bcv_eur: Number.isFinite(Number(data.referencias?.bcv?.eur))
        ? Number(data.referencias.bcv.eur)
        : null,
      usdt_ves_mid: Number.isFinite(Number(data.referencias?.usdt_ves?.mid))
        ? Number(data.referencias.usdt_ves.mid)
        : null,
    },
  };
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

  return result.rows.map(resumirSnapshotRow);
}

async function readSnapshotByIdFromDb(id) {
  if (!pool || !dbReady) return null;

  const snapshotId = Number(id);
  if (!Number.isSafeInteger(snapshotId) || snapshotId <= 0) {
    return null;
  }

  const result = await pool.query(
    `
    SELECT id, data, guardado_en
    FROM snapshots
    WHERE id = $1
    LIMIT 1
    `,
    [snapshotId]
  );

  if (!result.rows.length) return null;

  const row = result.rows[0];

  return {
    id: row.id,
    guardado_en: row.guardado_en,
    data: row.data || {},
  };
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

function getQuoteEngineConfigPath() {
  return path.join(__dirname, "..", "public", "quote-engine-config.json");
}

function readLocalQuoteEngineConfig() {
  const p = getQuoteEngineConfigPath();
  if (!fs.existsSync(p)) return {};

  const raw = fs.readFileSync(p, "utf8");
  if (!raw.trim()) return {};

  return JSON.parse(raw);
}

function writeLocalQuoteEngineConfig(obj) {
  const p = getQuoteEngineConfigPath();
  const dir = path.dirname(p);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
  return p;
}

async function readQuoteEngineConfig() {
  const localConfig = readLocalQuoteEngineConfig();

  if (pool && dbReady) {
    const result = await pool.query(
      `
      SELECT value
      FROM app_settings
      WHERE key = $1
      LIMIT 1
      `,
      ["quote_engine_config"]
    );

    if (!result.rows.length) {
      return localConfig || {};
    }

    return result.rows[0].value || localConfig || {};
  }

  return localConfig || {};
}

function getPaytypeCatalogPath() {
  return path.join(__dirname, "..", "public", "paytype-catalog.json");
}

function readLocalPaytypeCatalog() {
  const p = getPaytypeCatalogPath();
  if (!fs.existsSync(p)) return {};

  const raw = fs.readFileSync(p, "utf8");
  if (!raw.trim()) return {};

  return JSON.parse(raw);
}

function writeLocalPaytypeCatalog(obj) {
  const p = getPaytypeCatalogPath();
  const dir = path.dirname(p);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");

  return p;
}

async function readPaytypeCatalog() {
  if (pool && dbReady) {
    const result = await pool.query(
      `
      SELECT value
      FROM app_settings
      WHERE key = $1
      LIMIT 1
      `,
      ["paytype_catalog"]
    );

    if (!result.rows.length) return {};
    return result.rows[0].value || {};
  }

  return readLocalPaytypeCatalog();
}

async function writePaytypeCatalog(obj) {
  const payload = {
    ...(obj || {}),
    updated_at: new Date().toISOString(),
  };

  if (pool && dbReady) {
    await pool.query(
      `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `,
      ["paytype_catalog", JSON.stringify(payload)]
    );

    return {
      storage: "postgres",
      value: payload,
    };
  }

  const writtenPath = writeLocalPaytypeCatalog(payload);

  return {
    storage: "local",
    path: writtenPath,
    value: payload,
  };
}

async function writeQuoteEngineConfig(obj) {
  const payload = {
    ...(obj || {}),
    updated_at: new Date().toISOString(),
  };

  if (pool && dbReady) {
    await pool.query(
      `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `,
      ["quote_engine_config", JSON.stringify(payload)]
    );

    return {
      storage: "postgres",
      value: payload,
    };
  }

  const writtenPath = writeLocalQuoteEngineConfig(payload);

  return {
    storage: "local",
    path: writtenPath,
    value: payload,
  };
}

function getAuditLogPath() {
  return path.join(__dirname, "..", "public", "audit-log.json");
}

function readLocalAuditLog() {
  const p = getAuditLogPath();
  if (!fs.existsSync(p)) return [];

  const raw = fs.readFileSync(p, "utf8");
  if (!raw.trim()) return [];

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeLocalAuditLog(entry) {
  const p = getAuditLogPath();
  const dir = path.dirname(p);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const current = readLocalAuditLog();
  current.push(entry);

  fs.writeFileSync(p, JSON.stringify(current.slice(-500), null, 2), "utf8");

  return p;
}

async function writeAuditLog(entry = {}) {
  const payload = {
    area: entry.area || "system",
    action: entry.action || "unknown",
    entity_key: entry.entity_key || null,
    actor: entry.actor || "admin",
    source: entry.source || "admin_panel",
    before_value: entry.before_value ?? null,
    after_value: entry.after_value ?? null,
    metadata: entry.metadata ?? {},
    created_at: new Date().toISOString(),
  };

  if (pool && dbReady) {
    const result = await pool.query(
      `
      INSERT INTO app_audit_logs (
        area,
        action,
        entity_key,
        actor,
        source,
        before_value,
        after_value,
        metadata,
        created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6::jsonb,
        $7::jsonb,
        $8::jsonb,
        $9::timestamptz
      )
      RETURNING id, created_at
      `,
      [
        payload.area,
        payload.action,
        payload.entity_key,
        payload.actor,
        payload.source,
        payload.before_value == null ? null : JSON.stringify(payload.before_value),
        payload.after_value == null ? null : JSON.stringify(payload.after_value),
        JSON.stringify(payload.metadata || {}),
        payload.created_at,
      ]
    );

    return {
      storage: "postgres",
      id: result.rows[0]?.id,
      created_at: result.rows[0]?.created_at,
    };
  }

  const writtenPath = writeLocalAuditLog(payload);

  return {
    storage: "local",
    path: writtenPath,
    created_at: payload.created_at,
  };
}

async function readAuditLogs({ area = null, limit = 50 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));

  if (pool && dbReady) {
    const params = [];
    let where = "";

    if (area) {
      params.push(area);
      where = `WHERE area = $${params.length}`;
    }

    params.push(safeLimit);

    const result = await pool.query(
      `
      SELECT
        id,
        area,
        action,
        entity_key,
        actor,
        source,
        before_value,
        after_value,
        metadata,
        created_at
      FROM app_audit_logs
      ${where}
      ORDER BY created_at DESC, id DESC
      LIMIT $${params.length}
      `,
      params
    );

    return result.rows;
  }

  const local = readLocalAuditLog();

  return local
    .filter((item) => !area || item.area === area)
    .slice(-safeLimit)
    .reverse();
}

function getSnapshotPath() {
  const custom = process.env.SNAPSHOT_FALLBACK_PATH;
  if (custom) return custom;
  return path.join(__dirname, "..", "public", "snapshot.json");
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

function isDbAvailable() {
  return !!(pool && dbReady);
}

module.exports = {
  initDb,
  readLatestSnapshotFromDb,
  readSnapshotsFromDb,
  readSnapshotByIdFromDb,
  writeSnapshotToDb,
  getSnapshotPath,
  readLocalSnapshot,
  writeLocalSnapshot,
  isDbAvailable,
    readQuoteEngineConfig,
  writeQuoteEngineConfig,
    writeAuditLog,
  readAuditLogs,
  readPaytypeCatalog,
writePaytypeCatalog,
};