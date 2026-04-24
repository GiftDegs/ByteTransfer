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
  writeSnapshotToDb,
  getSnapshotPath,
  readLocalSnapshot,
  writeLocalSnapshot,
  isDbAvailable,
};