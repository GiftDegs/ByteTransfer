"use strict";

// =====================================================
// MONITOREO
// =====================================================
async function obtenerMercadoLive(onProgress = null) {
  const total = paises.length;
  let completados = 0;

  const actualizarProgreso = () => {
    if (typeof onProgress !== "function") return;

    const progresoBase = 40;
    const progresoMax = 95;
    const tramo = progresoMax - progresoBase;
    const porcentaje = progresoBase + (completados / total) * tramo;

    onProgress({
      completados,
      total,
      porcentaje: Math.round(porcentaje),
      texto: `Consultando mercado live (${completados}/${total})`,
      detalle:
        completados < total
          ? "Obteniendo compra y venta por moneda..."
          : "Mercado live completado.",
    });
  };

  actualizarProgreso();

  const tareas = paises.map(async (p) => {
    const fiat = p.fiat;

    const [compra, venta] = await Promise.all([
      fetchPrecio(fiat, "BUY"),
      fetchPrecio(fiat, "SELL"),
    ]);

    completados++;
    actualizarProgreso();

    return [fiat, { compra, venta }];
  });

  const entries = await Promise.all(tareas);
  const resultado = Object.fromEntries(entries);

  mercadoPaises = resultado;

  try {
    referenciasMercado = await obtenerReferencias();
  } catch {
    referenciasMercado = null;
  }

  ultimoTick = new Date();
  const monMarket = document.getElementById("mon-market-time");
  if (monMarket) monMarket.textContent = `Market: ${ultimoTick.toLocaleString()}`;

  return resultado;
}

function sincronizarMercadoDesdeDatos() {
  console.warn("⚠️ sincronizarMercadoDesdeDatos deshabilitada: el monitoreo no debe tomar datos editables.");
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

// =====================================================
// ALERTAS
// =====================================================
function clasificarEstadoMargen(actual, objetivo) {
  if (!Number.isFinite(actual) || !Number.isFinite(objetivo) || objetivo <= 0) {
    return {
      key: "sin_datos",
      label: "Sin datos",
      severity: -1,
      ratio: 0,
      delta: null,
      badgeClass: "bg-slate-900/5 dark:bg-white/10 text-slate-700 dark:text-slate-200",
    };
  }

  const ratio = actual / objetivo;
  const delta = actual - objetivo;

  if (actual <= 0 || ratio < 0.25) {
    return {
      key: "perdidas",
      label: "Operativa en Pérdidas",
      severity: 3,
      ratio,
      delta,
      badgeClass: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/15",
    };
  }

  if (ratio < 0.50) {
    return {
      key: "actualizar_tasas",
      label: "Actualizar Tasas",
      severity: 2,
      ratio,
      delta,
      badgeClass: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/15",
    };
  }

  if (ratio < 0.75) {
    return {
      key: "monitoreo_activo",
      label: "Monitoreo activo",
      severity: 1,
      ratio,
      delta,
      badgeClass: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-200 border border-yellow-500/15",
    };
  }

  return {
    key: "estable",
    label: "Operativa Estable",
    severity: 0,
    ratio,
    delta,
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/15",
  };
}

function obtenerCruceBaseLive(origen, destino, mercado = mercadoPaises) {
  const o = mercado?.[origen];
  const d = mercado?.[destino];

  if (!o || !d) return null;

  const compraOrigen = Number(o.compra);
  const ventaDestino = Number(d.venta);

  if (!Number.isFinite(compraOrigen) || compraOrigen <= 0) return null;
  if (!Number.isFinite(ventaDestino) || ventaDestino <= 0) return null;

  return ventaDestino / compraOrigen;
}

function calcularMargenActualCruce(_origen, _destino, tasaCliente, baseLive) {
  const cliente = Number(tasaCliente);
  const live = Number(baseLive);

  if (!Number.isFinite(cliente) || cliente <= 0) return null;
  if (!Number.isFinite(live) || live <= 0) return null;

  return ((live - cliente) / live) * 100;
}

function obtenerDatosAlertasCruces() {
  const resultados = [];
  const activos = paises.map((p) => p.fiat);
  const baseClienteCruces = baseMonitoreoCruces || {};
  const baseObjetivos = baseMonitoreoMargenes || {};

  for (const origen of activos) {
    for (const destino of activos) {
      if (origen === destino) continue;

      const clave = `${origen}-${destino}`;
      const tasaCliente = Number(baseClienteCruces?.[clave]);
      const baseLive = obtenerCruceBaseLive(origen, destino, mercadoPaises);

      if (!Number.isFinite(tasaCliente) || tasaCliente <= 0) continue;
      if (!Number.isFinite(baseLive) || baseLive <= 0) continue;

      const objetivo = Number.isFinite(Number(baseObjetivos?.[clave]))
        ? Number(baseObjetivos[clave])
        : 5;

      const margenActual = calcularMargenActualCruce(origen, destino, tasaCliente, baseLive);
      if (!Number.isFinite(margenActual)) continue;

      const estado = clasificarEstadoMargen(margenActual, objetivo);
      const excesoPts = margenActual - objetivo;

      resultados.push({
        cruce: `${origen} → ${destino}`,
        origen,
        destino,
        clave,
        tasaCliente,
        baseLive,
        objetivo,
        actual: margenActual,
        excesoPts,
        estado,
      });
    }
  }

  resultados.sort((a, b) => {
    if (b.estado.severity !== a.estado.severity) {
      return b.estado.severity - a.estado.severity;
    }
    return a.actual - b.actual;
  });

  return resultados;
 }

function renderCentroAlertas() {
  const titulo = document.getElementById("alertas-titulo-global");
  const badge = document.getElementById("alertas-badge-global");
  const subtitulo = document.getElementById("alertas-subtitulo");
  const top3 = document.getElementById("alertas-top3");
  const resumen = document.getElementById("alertas-resumen-extra");
  const accion = document.getElementById("alertas-accion");
  const semaforo = document.getElementById("alertas-semaforo");

  if (!titulo || !badge || !subtitulo || !top3 || !resumen || !accion || !semaforo) return;

  const alertas = obtenerDatosAlertasCruces();

  if (!alertas.length) {
    titulo.textContent = "Sin datos";
    badge.textContent = "Sin datos";
    badge.className =
      "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900/5 dark:bg-white/10 text-slate-700 dark:text-slate-200";
    subtitulo.textContent = "Esperando snapshot base y mercado live.";
    resumen.textContent = "";
    accion.textContent = "";
    semaforo.className =
      "rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4";
    top3.innerHTML = "";
    return;
  }

  const comprometidos = alertas
    .filter((a) => Number.isFinite(a.actual) && Number.isFinite(a.objetivo) && a.estado.severity > 0)
    .sort((a, b) => {
      if (b.estado.severity !== a.estado.severity) {
        return b.estado.severity - a.estado.severity;
      }
      return a.estado.ratio - b.estado.ratio;
    });

  const oportunidades = alertas
    .filter((a) => Number.isFinite(a.actual) && Number.isFinite(a.objetivo) && a.estado.ratio >= 1.25)
    .sort((a, b) => b.estado.ratio - a.estado.ratio);

  const perdidas = comprometidos.filter((a) => a.estado.key === "perdidas");
  const actualizar = comprometidos.filter((a) => a.estado.key === "actualizar_tasas");
  const monitoreo = comprometidos.filter((a) => a.estado.key === "monitoreo_activo");

  let estadoGlobal = "estable";
  if (perdidas.length) estadoGlobal = "perdidas";
  else if (actualizar.length) estadoGlobal = "actualizar_tasas";
  else if (monitoreo.length) estadoGlobal = "monitoreo_activo";

  const topComprometidos = comprometidos.slice(0, 3);
  const mejor = oportunidades[0] || null;

  function fmtPct(n) {
    return Number.isFinite(Number(n)) ? `${Number(n).toFixed(2)}%` : "—";
  }

  function fmtDelta(n) {
    if (!Number.isFinite(Number(n))) return "—";
    const num = Number(n);
    return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;
  }

  function fmtCumplimiento(ratio) {
    if (!Number.isFinite(Number(ratio))) return "—";
    return `${(Number(ratio) * 100).toFixed(0)}% del objetivo`;
  }

  function claseDelta(n) {
    return Number(n) >= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";
  }

  function etiquetaOportunidad(ratio) {
    if (!Number.isFinite(Number(ratio))) return "Oportunidad";
    if (ratio >= 1.75) return "Oportunidad destacada";
    if (ratio >= 1.50) return "Oportunidad fuerte";
    return "Oportunidad real";
  }

  if (estadoGlobal === "estable") {
    titulo.textContent = "Operativa Estable";
    badge.textContent = "Operativa Estable";
    badge.className =
      "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/15";
    subtitulo.textContent = "Todos los cruces están dentro del rango operativo esperado.";
    semaforo.className =
      "rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-4";
  }

  if (estadoGlobal === "monitoreo_activo") {
    titulo.textContent = "Monitoreo activo";
    badge.textContent = "Monitoreo activo";
    badge.className =
      "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-700 dark:text-yellow-200 border border-yellow-500/15";
    subtitulo.textContent = "Hay cruces por debajo de 75% del objetivo, pero aún dentro de margen recuperable.";
    semaforo.className =
      "rounded-2xl border border-yellow-500/15 bg-yellow-500/10 p-4";
  }

  if (estadoGlobal === "actualizar_tasas") {
    titulo.textContent = "Actualizar Tasas";
    badge.textContent = "Actualizar Tasas";
    badge.className =
      "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/15";
    subtitulo.textContent = "Hay cruces por debajo de 50% del objetivo. Conviene ajustar tasas.";
    semaforo.className =
      "rounded-2xl border border-orange-500/15 bg-orange-500/10 p-4";
  }

  if (estadoGlobal === "perdidas") {
    titulo.textContent = "Operativa en Pérdidas";
    badge.textContent = "Operativa en Pérdidas";
    badge.className =
      "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/15";
    subtitulo.textContent = "Hay cruces por debajo de 25% del objetivo o con margen real en cero/negativo.";
    semaforo.className =
      "rounded-2xl border border-red-500/15 bg-red-500/10 p-4";
  }

  let html = "";

  if (estadoGlobal !== "estable" && topComprometidos.length) {
    html += `
      <div class="premium-card rounded-2xl p-4">
        <div class="text-sm font-semibold">Cruces a revisar</div>
        <div class="mt-3 space-y-2">
          ${topComprometidos.map((item) => `
            <div class="rounded-xl border border-slate-200/60 dark:border-slate-700/60 px-3 py-2">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-medium">${item.cruce}</span>
                <span class="text-xs font-semibold ${claseDelta(item.actual - item.objetivo)}">
                  ${fmtCumplimiento(item.estado.ratio)}
                </span>
              </div>
              <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ganancia actual ${fmtPct(item.actual)} · Objetivo ${fmtPct(item.objetivo)} · Diferencia ${fmtDelta(item.actual - item.objetivo)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (mejor) {
    html += `
      <div class="premium-card rounded-2xl p-4 ${html ? "mt-3" : ""}">
        <div class="text-sm font-semibold">${etiquetaOportunidad(mejor.estado.ratio)}</div>
        <div class="mt-2 text-sm">
          <span class="font-medium">${mejor.cruce}</span>
          <span class="mx-2 opacity-60">·</span>
          <span class="font-semibold text-emerald-600 dark:text-emerald-400">
            ${fmtDelta(mejor.actual - mejor.objetivo)}
          </span>
        </div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Estás ganando ${fmtPct(mejor.actual)} con objetivo ${fmtPct(mejor.objetivo)} · ${fmtCumplimiento(mejor.estado.ratio)}
        </div>
      </div>
    `;
  }

  top3.innerHTML = html;

  if (estadoGlobal === "estable") {
    resumen.textContent = mejor ? `Oportunidades detectadas: ${oportunidades.length}.` : "";
    accion.textContent = mejor
      ? `${mejor.cruce} está rindiendo por encima del seteo objetivo.`
      : "";
  }

  if (estadoGlobal === "monitoreo_activo") {
    resumen.textContent = `En monitoreo: ${monitoreo.length}.`;
    accion.textContent = topComprometidos.length
      ? `Mantén bajo observación ${topComprometidos[0].cruce}.`
      : "";
  }

  if (estadoGlobal === "actualizar_tasas") {
    resumen.textContent = `Cruces para actualizar: ${actualizar.length}. En monitoreo: ${monitoreo.length}.`;
    accion.textContent = topComprometidos.length
      ? `Conviene revisar ${topComprometidos[0].cruce}.`
      : "";
  }

  if (estadoGlobal === "perdidas") {
    resumen.textContent = `Cruces en pérdidas: ${perdidas.length}.`;
    accion.textContent = topComprometidos.length
      ? `Prioridad: actuar sobre ${topComprometidos[0].cruce}.`
      : "";
  }
}

  function renderMonitoreo() {
  const snapRefs = snapshotPrevio?.referencias || null;

  {
    const usdEl = document.getElementById("mon-bcv-usd");
    const eurEl = document.getElementById("mon-bcv-eur");

    const marketUsd = referenciasMercado?.bcv?.usd ?? null;
    const marketEur = referenciasMercado?.bcv?.eur ?? null;

    const snapUsd = snapRefs?.bcv?.usd ?? null;
    const snapEur = snapRefs?.bcv?.eur ?? null;

    pintarDelta(usdEl, marketUsd, snapUsd, "Snapshot BCV USD");
    pintarDelta(eurEl, marketEur, snapEur, "Snapshot BCV EUR");
  }

  {
    const usdtEl = document.getElementById("mon-usdt-ves");
    const marketUsdtVes = referenciasMercado?.usdt_ves?.mid ?? null;
    const snapUsdtVes = snapRefs?.usdt_ves?.mid ?? null;
    pintarDelta(usdtEl, marketUsdtVes, snapUsdtVes, "Snapshot USDT→VES");
  }

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