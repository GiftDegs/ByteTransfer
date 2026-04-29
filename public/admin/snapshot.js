"use strict";

// =====================================================
// REFERENCIAS / SNAPSHOT
// =====================================================
async function obtenerReferencias() {
  const res = await fetch("/api/referencias", { cache: "no-store" });
  if (!res.ok) throw new Error("No referencias");
  return await res.json();
}

function setRefValue(el, val) {
  if (!el) return;
  const v = val ?? "";
  if (el.tagName === "INPUT") {
    el.value = v === "—" ? "" : v;
    if (!v) el.placeholder = "—";
  } else {
    el.textContent = v || "—";
  }
}

function renderReferencias() {
  if (!referenciasExternas) return;

  const usdEl = document.getElementById("ref-bcv-usd");
  const eurEl = document.getElementById("ref-bcv-eur");
    const fechaEl = document.getElementById("ref-fecha");

  setRefValue(usdEl, referenciasExternas.bcv?.usd ?? "—");
  setRefValue(eurEl, referenciasExternas.bcv?.eur ?? "—");
  
  if (fechaEl) {
    const base = referenciasExternas.actualizado_en
      ? `Actualizado: ${new Date(referenciasExternas.actualizado_en).toLocaleString()}`
      : "—";

    const manual = referenciasExternas?.bcv?.manual ? " • BCV manual" : "";
    fechaEl.textContent = base + manual;
  }
}

async function cargarSnapshot() {
  try {
    const res = await fetch("/api/snapshot", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    snapshotPrevio = json || {};

    datosPaises = {};
    for (const p of paises) {
      const sp = snapshotPrevio[p.fiat] || {};
      datosPaises[p.fiat] = {
        compra: Number.isFinite(sp.compra) ? sp.compra : null,
        venta: Number.isFinite(sp.venta) ? sp.venta : null,
      };
    }

    margenesCruce = asegurarMapaCompletoMargenes(5, snapshotPrevio.margenesCruce || {});
    resetearBorradorMargenesDesdeAplicado();
    limpiarBorradorEdicionMasiva();

    crucesAnteriores = { ...(snapshotPrevio.cruces || {}) };
    crucesBaseHistorica = { ...(snapshotPrevio.cruces || {}) };
    crucesRenderActuales = calcularTodosLosCruces(datosPaises, margenesCruce);
    crucesAntesVisibles = { ...(crucesBaseHistorica || {}) };
    snapshotCrucesAntesVisibles = { ...(crucesBaseHistorica || {}) };

    fijarBaseMonitoreoCruces(
      snapshotPrevio.cruces || {},
      snapshotPrevio.margenesCruce || {}
    );

    referenciasExternas = snapshotPrevio.referencias
      ? JSON.parse(JSON.stringify(snapshotPrevio.referencias))
      : null;

    renderReferencias();
    actualizarTopbar();
    mostrarAdvertenciaPendiente(false);
    actualizarBotonCancelarBorrador?.();
    actualizarEstadoGuardadoUI();

    const pollingGuardado = Number(snapshotPrevio?.systemConfig?.pollingSeconds);
    if (Number.isFinite(pollingGuardado) && pollingGuardado > 0) {
      pollingMs = pollingGuardado * 1000;

      const selectPolling = document.getElementById("config-polling-interval");
      if (selectPolling) {
        selectPolling.value = String(pollingGuardado);
      }
    }

    const fechaBase = snapshotPrevio.guardado_en || snapshotPrevio.timestamp || null;
    if (fechaBase) {
      const f = new Date(fechaBase);
      const el = document.getElementById("ultima-actualizacion");
      if (el) el.textContent = f.toLocaleString();

      const monSnap = document.getElementById("mon-snapshot-time");
      if (monSnap) monSnap.textContent = `Snapshot: ${f.toLocaleString()}`;
    }
  } catch (err) {
    console.error("❌ cargarSnapshot", err);
    mostrarToast("❌ No se pudo cargar el snapshot");
  }

  cargarOperacionPublica();
  renderEstadoOperacionPublicaActual();
}

async function guardarSnapshot(datos) {
  try {
    const res = await fetch("/api/guardar-snapshot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": getAdminKey(),
      },
      body: JSON.stringify(datos),
    });

    if (res.status === 401) {
      clearAdminKey();
      mostrarToast("🔒 Sesión admin inválida");
      return false;
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      mostrarToast(`❌ No se guardó: ${errJson?.error || "Error"}`);
      return false;
    }

    return true;
  } catch {
    mostrarToast("❌ Error de red al guardar");
    return false;
  }
}