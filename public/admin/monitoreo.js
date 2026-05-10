"use strict";

// =====================================================
// MONITOREO
// =====================================================
async function obtenerMercadoLive(onProgress = null) {
  const total = paises.length;

  const reportar = (porcentaje, texto, detalle, completados = 0) => {
    if (typeof onProgress !== "function") return;

    onProgress({
      completados,
      total,
      porcentaje,
      texto,
      detalle,
    });
  };

  reportar(
    40,
    "Consultando motor configurable",
    "Solicitando compra y venta consolidada por moneda...",
    0
  );

  const res = await fetch("/api/debug/quotes", {
    cache: "no-store",
    headers: {
      "x-admin-key": getAdminKey(),
    },
  });

  if (!res.ok) {
    throw new Error(`No se pudo consultar motor configurable: HTTP ${res.status}`);
  }

  reportar(
    70,
    "Procesando cotizaciones",
    "Normalizando respuesta del motor configurable...",
    Math.round(total / 2)
  );

  const data = await res.json();
  const results = data?.results || {};
  const resultado = {};

  metadataCotizacionesMotor = {};

  for (const p of paises) {
    const fiat = p.fiat;
    const item = results?.[fiat] || {};

    const compra = Number(item?.buy?.price);
    const venta = Number(item?.sell?.price);

    resultado[fiat] = {
      compra: Number.isFinite(compra) && compra > 0 ? Number(compra.toFixed(2)) : null,
      venta: Number.isFinite(venta) && venta > 0 ? Number(venta.toFixed(2)) : null,
    };

    metadataCotizacionesMotor[fiat] = {
      compra: item?.buy || null,
      venta: item?.sell || null,
    };
  }

  mercadoPaises = resultado;

  reportar(
    85,
    "Actualizando referencias",
    "Consultando referencias externas relacionadas...",
    total
  );

  try {
    referenciasMercado = await obtenerReferencias();
  } catch {
    referenciasMercado = null;
  }

  ultimoTick = new Date();
  const monMarket = document.getElementById("mon-market-time");
  if (monMarket) monMarket.textContent = `Market: ${ultimoTick.toLocaleString()}`;

  reportar(
    95,
    "Mercado live completado",
    "Datos operativos cargados desde el motor configurable.",
    total
  );

  return resultado;
}

function renderMonedas() {
  const cont = document.getElementById("mon-grid-monedas");
  if (!cont) return;
  cont.innerHTML = "";

  for (const p of paises) {
    const s = snapshotPrevio?.[p.fiat];
    const m = mercadoPaises?.[p.fiat];
    if (!s || !m) continue;

    const sC = Number(s.compra);
    const sV = Number(s.venta);
    const mC = Number(m.compra);
    const mV = Number(m.venta);

    if (!Number.isFinite(sC) || !Number.isFinite(sV) || !Number.isFinite(mC) || !Number.isFinite(mV)) continue;

    const midSnap = (sC + sV) / 2;
    const midMarket = (mC + mV) / 2;
    const deltaPct = ((midMarket - midSnap) / midSnap) * 100;

    const cls = deltaPct > 0 ? "text-green-600" : deltaPct < 0 ? "text-red-600" : "text-blue-600";

    const card = document.createElement("div");
    card.className = "premium-card rounded-2xl p-5";

    card.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-sm font-semibold">${p.nombre}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${p.fiat}</div>
        </div>
        <div class="text-2xl">${p.emoji}</div>
      </div>

      <div class="mt-4 text-xs text-slate-500 dark:text-slate-400">Snapshot medio</div>
      <div class="text-lg font-semibold mt-1">${Math.round(midSnap)}</div>

      <div class="mt-3 text-xs text-slate-500 dark:text-slate-400">Market medio</div>
      <div class="text-lg font-semibold mt-1">${Math.round(midMarket)}</div>

      <div class="mt-4 text-sm font-semibold ${cls}">
        ${deltaPct.toFixed(2)}%
      </div>
    `;

    cont.appendChild(card);
  }
}

  function renderMonitoreo() {
  const snapRefs = snapshotPrevio?.referencias || null;

  const refFecha = document.getElementById("mon-ref-fecha");
  if (refFecha) {
    refFecha.textContent = referenciasMercado?.actualizado_en
      ? `Refs: ${new Date(referenciasMercado.actualizado_en).toLocaleString()}`
      : "—";
  }

  const pollStatus = document.getElementById("mon-poll-status");
  const pollNext = document.getElementById("mon-poll-next");
  if (pollStatus) pollStatus.textContent = pollingActivo ? "Activo" : "Pausado";
  if (pollNext) pollNext.textContent = pollingActivo ? `• cada ${pollingMs / 1000}s` : "• detenido";

  renderCentroAlertas();
  renderMonedas();
 }

  async function tickMonitoreo(onProgress = null) {
    if (!pollingActivo) return;

    try {
      await obtenerMercadoLive(onProgress);
      renderMonitoreo();

      try {
        const refs = await obtenerReferenciasExternas();
        renderReferenciasExternas(refs);
      } catch (e) {
        console.warn("refs:", e.message);
      }
    } catch (e) {
      console.error("❌ tickMonitoreo", e);
    }
  }

 function iniciarPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(() => {
    tickMonitoreo();
  }, pollingMs);

 }

 function detenerPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = null;
 }

