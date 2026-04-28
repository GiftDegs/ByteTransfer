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

 function obtenerNombreMonedaOperativa(code) {
  const item = paises.find((p) => p.fiat === code);
  return item?.nombre || code;
}

function formatearPctOperativo(valor, decimales = 2) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(decimales)}%`;
}

function formatearPuntosMargen(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)} puntos`;
}

function obtenerMovimientosPorMoneda() {
  const movimientos = [];

  for (const p of paises) {
    const fiat = p.fiat;
    const snap = snapshotPrevio?.[fiat];
    const market = mercadoPaises?.[fiat];

    if (!snap || !market) continue;

    const snapCompra = Number(snap.compra);
    const snapVenta = Number(snap.venta);
    const marketCompra = Number(market.compra);
    const marketVenta = Number(market.venta);

    if (
      !Number.isFinite(snapCompra) ||
      !Number.isFinite(snapVenta) ||
      !Number.isFinite(marketCompra) ||
      !Number.isFinite(marketVenta) ||
      snapCompra <= 0 ||
      snapVenta <= 0
    ) {
      continue;
    }

    const baseMedia = (snapCompra + snapVenta) / 2;
    const marketMedia = (marketCompra + marketVenta) / 2;
    const variacionPct = ((marketMedia - baseMedia) / baseMedia) * 100;

    movimientos.push({
      fiat,
      nombre: obtenerNombreMonedaOperativa(fiat),
      baseMedia,
      marketMedia,
      variacionPct,
      absPct: Math.abs(variacionPct),
      direccion: variacionPct > 0 ? "subio" : variacionPct < 0 ? "bajo" : "estable",
    });
  }

  movimientos.sort((a, b) => b.absPct - a.absPct);
  return movimientos;
}

function obtenerMovimientoMoneda(fiat, movimientos) {
  return movimientos.find((m) => m.fiat === fiat) || null;
}

function describirMovimientoMoneda(mov) {
  if (!mov) return "";

  if (mov.absPct < 0.25) {
    return `${mov.nombre} casi no se movió frente a la base guardada del día.`;
  }

  const verbo = mov.variacionPct > 0 ? "subió" : "bajó";

  return `${mov.nombre} ${verbo} ${formatearPctOperativo(mov.variacionPct)} frente a la base guardada del día.`;
}

function obtenerCrucesRelacionados(alertas, principal) {
  if (!principal) {
    return {
      mismoOrigen: [],
      mismoDestino: [],
    };
  }

  const mismoOrigen = alertas
    .filter((a) => a.clave !== principal.clave && a.origen === principal.origen && a.estado?.severity > 0)
    .slice(0, 4);

  const mismoDestino = alertas
    .filter((a) => a.clave !== principal.clave && a.destino === principal.destino && a.estado?.severity > 0)
    .slice(0, 4);

  return { mismoOrigen, mismoDestino };
}

function generarInformeOperativoAlertas(alertas = []) {
  const movimientos = obtenerMovimientosPorMoneda();
  const relevantes = movimientos.filter((m) => m.absPct >= 0.25).slice(0, 4);

  const comprometidos = alertas
    .filter((a) => Number.isFinite(a.actual) && Number.isFinite(a.objetivo) && a.estado?.severity > 0)
    .sort((a, b) => {
      if (b.estado.severity !== a.estado.severity) {
        return b.estado.severity - a.estado.severity;
      }
      return a.estado.ratio - b.estado.ratio;
    });

  const principal = comprometidos[0] || null;

  if (!principal) {
    const movPrincipal = relevantes[0];

    if (!movPrincipal) {
      return {
        nivel: "estable",
        titulo: "Operativa estable",
        causa: "No hay movimientos relevantes frente a la base guardada del día.",
        impacto: "Los cruces principales se mantienen dentro del margen esperado.",
        accion: "Puedes continuar operando sin ajustar tasas por ahora.",
        detalle: [],
      };
    }

    return {
      nivel: "observacion",
      titulo: "Movimiento de mercado detectado",
      causa: describirMovimientoMoneda(movPrincipal),
      impacto: "Por ahora no hay cruces comprometidos, pero conviene observar los próximos movimientos.",
      accion: "Mantén el monitoreo activo antes de guardar una nueva base de precios.",
      detalle: relevantes.slice(0, 3).map(describirMovimientoMoneda),
    };
  }

  const movOrigen = obtenerMovimientoMoneda(principal.origen, movimientos);
  const movDestino = obtenerMovimientoMoneda(principal.destino, movimientos);

  const origenNombre = obtenerNombreMonedaOperativa(principal.origen);
  const destinoNombre = obtenerNombreMonedaOperativa(principal.destino);

  const cumplimiento = Number.isFinite(Number(principal.estado?.ratio))
    ? `${(Number(principal.estado.ratio) * 100).toFixed(0)}%`
    : "—";

  const faltante = Number(principal.objetivo) - Number(principal.actual);
  const faltanteTxt = Number.isFinite(faltante) && faltante > 0
    ? formatearPuntosMargen(faltante)
    : "0 puntos";

  let causa = "";

  const origenFuerte = movOrigen && movOrigen.absPct >= 0.25;
  const destinoFuerte = movDestino && movDestino.absPct >= 0.25;

  if (origenFuerte && destinoFuerte) {
    causa = `${origenNombre} ${movOrigen.variacionPct > 0 ? "subió" : "bajó"} ${formatearPctOperativo(movOrigen.variacionPct)} y ${destinoNombre} ${movDestino.variacionPct > 0 ? "subió" : "bajó"} ${formatearPctOperativo(movDestino.variacionPct)} frente a la base guardada del día. Esa combinación está presionando especialmente este cruce.`;
  } else if (origenFuerte) {
    causa = `${origenNombre} ${movOrigen.variacionPct > 0 ? "subió" : "bajó"} ${formatearPctOperativo(movOrigen.variacionPct)} frente a la base guardada del día. Esto puede afectar los cruces donde ${principal.origen} participa como origen.`;
  } else if (destinoFuerte) {
    causa = `${destinoNombre} ${movDestino.variacionPct > 0 ? "subió" : "bajó"} ${formatearPctOperativo(movDestino.variacionPct)} frente a la base guardada del día. Esto puede afectar los cruces donde ${principal.destino} participa como destino.`;
  } else {
    causa = `El cruce ${principal.cruce} se movió por debajo del margen esperado aunque las monedas no muestran un cambio individual fuerte. Conviene revisar la combinación completa.`;
  }

  const impacto = `${principal.cruce} quedó al ${cumplimiento} del margen esperado. La ganancia estimada actual es ${Number(principal.actual).toFixed(2)}% y el margen esperado es ${Number(principal.objetivo).toFixed(2)}%.`;

  const { mismoOrigen, mismoDestino } = obtenerCrucesRelacionados(comprometidos, principal);

  const detalle = [];

  if (mismoDestino.length) {
    detalle.push(
      `También conviene revisar cruces con destino ${principal.destino}: ${mismoDestino
        .map((a) => a.cruce)
        .join(", ")}.`
    );
  }

  if (mismoOrigen.length) {
    detalle.push(
      `También hay presión en cruces donde ${principal.origen} sale como origen: ${mismoOrigen
        .map((a) => a.cruce)
        .join(", ")}.`
    );
  }

  const accion = `Primero revisa el margen específico de ${principal.cruce}. Para volver al margen esperado faltan aproximadamente ${faltanteTxt}. Después actualiza tasas y guarda cambios para que la nueva base quede registrada.`;

  let nivel = "observacion";
  if (principal.estado?.key === "perdidas") nivel = "critico";
  else if (principal.estado?.key === "actualizar_tasas") nivel = "actualizar";
  else if (principal.estado?.key === "monitoreo_activo") nivel = "observacion";

  return {
    nivel,
    titulo: "Informe operativo",
    causa,
    impacto,
    accion,
    detalle,
    principal,
  };
}

function asegurarContenedorInformeOperativo() {
  const top3 = document.getElementById("alertas-top3");
  if (!top3) return null;

  let box = document.getElementById("alertas-informe-operativo");
  if (box) return box;

  box = document.createElement("div");
  box.id = "alertas-informe-operativo";
  box.className = "mt-4";

  top3.insertAdjacentElement("afterend", box);
  return box;
}

function renderInformeOperativoAlertas(alertas = []) {
  const box = asegurarContenedorInformeOperativo();
  if (!box) return;

  const informe = generarInformeOperativoAlertas(alertas);

  let colorClass = "border-emerald-500/20 bg-emerald-500/10";
  let badgeClass = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/15";
  let badgeText = "Estable";

  if (informe.nivel === "observacion") {
    colorClass = "border-yellow-500/20 bg-yellow-500/10";
    badgeClass = "bg-yellow-500/10 text-yellow-700 dark:text-yellow-200 border border-yellow-500/15";
    badgeText = "Observar";
  }

  if (informe.nivel === "actualizar") {
    colorClass = "border-orange-500/20 bg-orange-500/10";
    badgeClass = "bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/15";
    badgeText = "Actualizar";
  }

  if (informe.nivel === "critico") {
    colorClass = "border-red-500/20 bg-red-500/10";
    badgeClass = "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/15";
    badgeText = "Prioridad alta";
  }

  box.innerHTML = `
    <div class="rounded-3xl border ${colorClass} p-5">
      <div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <div class="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Análisis operativo
          </div>
          <h3 class="text-xl font-semibold tracking-tight mt-2">
            ${informe.titulo}
          </h3>
        </div>

        <span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${badgeClass}">
          ${badgeText}
        </span>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-5">
        <div class="premium-card rounded-2xl p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Causa
          </div>
          <div class="text-sm mt-2 text-slate-700 dark:text-slate-200 leading-relaxed">
            ${informe.causa}
          </div>
        </div>

        <div class="premium-card rounded-2xl p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Impacto
          </div>
          <div class="text-sm mt-2 text-slate-700 dark:text-slate-200 leading-relaxed">
            ${informe.impacto}
          </div>
        </div>

        <div class="premium-card rounded-2xl p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Acción sugerida
          </div>
          <div class="text-sm mt-2 text-slate-700 dark:text-slate-200 leading-relaxed">
            ${informe.accion}
          </div>
        </div>
      </div>

      ${
        informe.detalle?.length
          ? `
            <div class="mt-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
              <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                Revisión secundaria
              </div>
              <div class="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                ${informe.detalle.map((d) => `<div>• ${d}</div>`).join("")}
              </div>
            </div>
          `
          : ""
      }
    </div>
  `;
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
  renderInformeOperativoAlertas(alertas);

if (estadoGlobal === "estable") {
  resumen.textContent = mejor
    ? `Oportunidades detectadas: ${oportunidades.length}.`
    : "Sin movimientos que requieran acción.";

  accion.textContent = mejor
    ? `${mejor.cruce} está rindiendo por encima del margen esperado.`
    : "Operación alineada con la base guardada del día.";
}

if (estadoGlobal === "monitoreo_activo") {
  resumen.textContent = `Cruces bajo observación: ${monitoreo.length}.`;

  accion.textContent = "Revisa el análisis operativo para decidir si conviene ajustar tasas.";
}

if (estadoGlobal === "actualizar_tasas") {
  resumen.textContent = `Cruces que requieren ajuste: ${actualizar.length}. Bajo observación: ${monitoreo.length}.`;

  accion.textContent = "Revisa el análisis operativo, ajusta el cruce afectado, actualiza tasas y guarda cambios.";
}

if (estadoGlobal === "perdidas") {
  resumen.textContent = `Cruces en zona crítica: ${perdidas.length}.`;

  accion.textContent = "Prioridad alta: revisa el análisis operativo antes de seguir ofreciendo estos cruces.";
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

      const audit = await obtenerAuditoriaCotizaciones();
      renderAuditoriaCotizaciones(audit);
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

async function obtenerReferenciasExternas() {
  const r = await fetch("/api/debug/references", {
    headers: {
      "x-admin-key": getAdminKey(),
    },
    cache: "no-store",
  });

  if (!r.ok) throw new Error("No se pudieron cargar referencias");
  return r.json();
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

async function obtenerAuditoriaCotizaciones() {
  try {
    const res = await fetch("/api/debug/quotes", {
      headers: {
        "x-admin-key": getAdminKey(),
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return await res.json();
  } catch (err) {
    console.error("❌ Auditoría:", err);
    return null;
  }
}

function renderAuditoriaCotizaciones(data) {
  const title = document.getElementById("quote-audit-title");
  const subtitle = document.getElementById("quote-audit-subtitle");
  const badge = document.getElementById("quote-audit-badge");
  const grid = document.getElementById("quote-audit-grid");
  const warnings = document.getElementById("quote-audit-warnings");

  if (!title || !subtitle || !badge || !grid || !warnings) return;

  if (!data || !data.ok) {
    title.textContent = "Sin datos";
    subtitle.textContent = "No se pudo consultar la auditoría del motor.";
    badge.textContent = "Error";
    badge.className =
      "inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/15";
    grid.innerHTML = "";
    warnings.textContent = "";
    return;
  }

  const summary = data.audit_summary || {};
  const results = data.results || {};
  const currencies = Array.isArray(data.currencies)
    ? data.currencies
    : Object.keys(results);

  const total = currencies.length;
  const low = Array.isArray(summary.low_confidence_currencies)
    ? summary.low_confidence_currencies.length
    : 0;
  const medium = Array.isArray(summary.medium_confidence_currencies)
    ? summary.medium_confidence_currencies.length
    : 0;
  const high = Math.max(0, total - low - medium);
  const warningsList = Array.isArray(summary.warnings) ? summary.warnings : [];

  const confidence = summary.confidence || "unknown";

  if (confidence === "low") {
    title.textContent = "Cotizaciones con riesgo";
    subtitle.textContent = "Hay fuentes en fallback, stale o con baja confianza.";
    badge.textContent = "Revisar";
    badge.className =
      "inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/15";
  } else if (confidence === "medium") {
    title.textContent = "Cotizaciones bajo observación";
    subtitle.textContent = "El motor opera, pero hay al menos una fuente con confianza media.";
    badge.textContent = "Atención";
    badge.className =
      "inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-yellow-500/10 text-yellow-700 dark:text-yellow-200 border border-yellow-500/15";
  } else {
    title.textContent = "Cotizaciones saludables";
    subtitle.textContent = "El motor de precios opera con datos confiables.";
    badge.textContent = "OK";
    badge.className =
      "inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/15";
  }

  grid.innerHTML = currencies
    .map((code) => {
      const item = results[code] || {};
      const audit = item.audit || {};
      const buy = item.buy || {};
      const sell = item.sell || {};

      const conf = audit.confidence || "unknown";
      const confTexto = traducirConfianza(conf);

      let borderClass = "border-emerald-500/15";
      let badgeClass = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

      if (conf === "medium") {
        borderClass = "border-yellow-500/20";
        badgeClass = "bg-yellow-500/10 text-yellow-700 dark:text-yellow-200";
      }

      if (conf === "low") {
        borderClass = "border-red-500/20";
        badgeClass = "bg-red-500/10 text-red-700 dark:text-red-300";
      }

      const providerBuy = traducirProvider(buy.provider);
      const providerSell = traducirProvider(sell.provider);
      const sourceBuy = traducirSource(buy.source);
      const sourceSell = traducirSource(sell.source);
      const spread = Number.isFinite(Number(audit.spread_pct))
        ? `${Number(audit.spread_pct).toFixed(2)}%`
        : "—";

      return `
        <div class="premium-card rounded-2xl p-4 border ${borderClass}">
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-semibold">${code}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Diferencia compra/venta ${spread}
              </div>
            </div>
           <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}">
            ${confTexto}
          </span>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div class="text-slate-500 dark:text-slate-400">Compra</div>
              <div class="font-semibold mt-1">${providerBuy}</div>
              <div class="text-slate-500 dark:text-slate-400 truncate">${sourceBuy}</div>
            </div>

            <div>
              <div class="text-slate-500 dark:text-slate-400">Venta</div>
              <div class="font-semibold mt-1">${providerSell}</div>
              <div class="text-slate-500 dark:text-slate-400 truncate">${sourceSell}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  warnings.innerHTML = warningsList.length
    ? `
      <div class="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
        <div class="font-semibold text-amber-700 dark:text-amber-200 mb-2">
          Observaciones detectadas
        </div>
        <ul class="space-y-1 text-sm">
          ${warningsList.map((w) => `<li>• ${traducirWarningCotizacion(w)}</li>`).join("")}
        </ul>
      </div>
    `
    : `
      <div class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
        Sin observaciones críticas.
      </div>
    `;
}

function renderReferenciasExternas(refs) {
  const grid = document.getElementById("quote-reference-grid");
  if (!grid) return;

  const results = refs?.results || {};
  const items = Object.entries(results);

  if (!items.length) {
    grid.innerHTML = `
      <div class="premium-card rounded-2xl p-4 text-sm text-slate-500 dark:text-slate-400">
        Sin referencias externas disponibles.
      </div>
    `;
    return;
  }

  grid.innerHTML = items
    .map(([code, ref]) => {
      const price = Number.isFinite(Number(ref.price))
        ? Number(ref.price).toFixed(6)
        : "—";

      const badgeClass = ref.fallback || ref.stale
        ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-200 border border-yellow-500/15"
        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/15";

      const badgeText = ref.fallback || ref.stale ? "Respaldo temporal" : "Actualizada";

      return `
        <div class="premium-card rounded-2xl p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-semibold">${code}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ${traducirProvider(ref.provider)} · ${traducirSource(ref.source)}
              </div>
            </div>

            <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}">
              ${badgeText}
            </span>
          </div>

          <div class="mt-4 text-2xl font-semibold tracking-tight">
            ${price}
          </div>

          <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
            ${ref.captured_at ? new Date(ref.captured_at).toLocaleString() : "Sin fecha"}
          </div>
        </div>
      `;
    })
    .join("");
}

async function obtenerEstrategiasCotizacion() {
  const r = await fetch("/api/debug/quote-strategies", {
    headers: {
      "x-admin-key": getAdminKey(),
    },
    cache: "no-store",
  });

  if (!r.ok) throw new Error("No se pudo cargar configuración del motor");
  return r.json();
}

const borradorPaytypesMotor = {};
const borradorAvanzadoMotor = {};

async function obtenerCatalogoMetodosPago() {
  const r = await fetch("/api/admin/paytypes/catalog", {
    headers: {
      "x-admin-key": getAdminKey(),
    },
    cache: "no-store",
  });

  if (!r.ok) throw new Error("No se pudo cargar catálogo de métodos");
  return r.json();
}

function obtenerBinanceStrategyDesdeLado(strategy) {
  if (!strategy) return null;
  if (strategy.provider === "binance") return strategy;

  if (Array.isArray(strategy.providers)) {
    return strategy.providers.find((p) => p.provider === "binance") || null;
  }

  return null;
}

function renderControlAvanzadoMotor(code, side, strategyOriginal) {
  const strategy = obtenerBinanceStrategyDesdeLado(strategyOriginal);

  if (!strategy) {
    return `
      <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5 p-4">
        <div class="text-sm font-semibold">${side === "buy" ? "Compra" : "Venta"}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Este lado no usa Binance P2P directo.
        </div>
      </div>
    `;
  }

  const key = `${code}.${side}`;
  const draft = borradorAvanzadoMotor[key] || {};

  const rows = draft.rows ?? strategy.rows ?? 20;
  const aggregation = draft.aggregation ?? strategy.aggregation ?? "average";
  const trimLowest = draft.trimLowest ?? strategy.trimLowest ?? 0;
  const trimHighest = draft.trimHighest ?? strategy.trimHighest ?? 0;

  const preparado = !!borradorAvanzadoMotor[key];

  return `
    <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-semibold">
            ${side === "buy" ? "Compra" : "Venta"}
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ajusta cómo se calcula esta cotización.
          </div>
        </div>

        ${
          preparado
            ? `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/15">
                Cambio preparado
              </span>`
            : ""
        }
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <label class="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Anuncios
          <select
            class="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            data-advanced-field="rows"
            data-code="${code}"
            data-side="${side}"
          >
            ${[20, 30, 50, 80, 100]
              .map(
                (n) => `
                  <option value="${n}" ${Number(rows) === n ? "selected" : ""}>
                    ${n} anuncios
                  </option>
                `
              )
              .join("")}
          </select>
        </label>

        <label class="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Método
          <select
            class="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            data-advanced-field="aggregation"
            data-code="${code}"
            data-side="${side}"
          >
            <option value="average" ${aggregation === "average" ? "selected" : ""}>
              Promedio
            </option>
            <option value="median" ${aggregation === "median" ? "selected" : ""}>
              Mediana
            </option>
          </select>
        </label>

        <label class="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Excluir más bajos
          <input
            type="number"
            min="0"
            max="10"
            step="1"
            value="${Number(trimLowest) || 0}"
            class="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            data-advanced-field="trimLowest"
            data-code="${code}"
            data-side="${side}"
          />
        </label>

        <label class="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Excluir más altos
          <input
            type="number"
            min="0"
            max="10"
            step="1"
            value="${Number(trimHighest) || 0}"
            class="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            data-advanced-field="trimHighest"
            data-code="${code}"
            data-side="${side}"
          />
        </label>
      </div>

      <div class="flex flex-wrap gap-2 mt-4">
        <button
          class="btn-primary text-sm"
          data-apply-advanced="1"
          data-code="${code}"
          data-side="${side}"
        >
          Aplicar cálculo
        </button>

        <button
          class="btn-ghost text-sm"
          data-advanced-preset="50-median"
          data-code="${code}"
          data-side="${side}"
        >
          50 + mediana
        </button>

        <button
          class="btn-ghost text-sm"
          data-advanced-preset="20-average"
          data-code="${code}"
          data-side="${side}"
        >
          20 + promedio
        </button>
      </div>
    </div>
  `;
}

function registrarEventosAvanzadosMotor() {
  document.querySelectorAll("[data-advanced-field]").forEach((el) => {
    if (el.dataset.bound === "1") return;
    el.dataset.bound = "1";

    el.addEventListener("change", () => {
      const code = el.dataset.code;
      const side = el.dataset.side;
      const field = el.dataset.advancedField;

      if (!code || !side || !field) return;

      const key = `${code}.${side}`;
      const prev = borradorAvanzadoMotor[key] || {
        code,
        side,
      };

      let value = el.value;

      if (["rows", "trimLowest", "trimHighest"].includes(field)) {
        value = Number(value);
      }

      borradorAvanzadoMotor[key] = {
        ...prev,
        [field]: value,
      };

      cargarPanelEstrategiasCotizacion();
    });
  });

  document.querySelectorAll("[data-advanced-preset]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", () => {
      const code = btn.dataset.code;
      const side = btn.dataset.side;
      const preset = btn.dataset.advancedPreset;

      if (!code || !side) return;

      const key = `${code}.${side}`;

      if (preset === "50-median") {
        borradorAvanzadoMotor[key] = {
          code,
          side,
          rows: 50,
          aggregation: "median",
          trimLowest: 0,
          trimHighest: 0,
        };
      }

      if (preset === "20-average") {
        borradorAvanzadoMotor[key] = {
          code,
          side,
          rows: 20,
          aggregation: "average",
          trimLowest: 0,
          trimHighest: 0,
        };
      }

      cargarPanelEstrategiasCotizacion();
    });
  });

  document.querySelectorAll("[data-apply-advanced]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", async () => {
      const code = btn.dataset.code;
      const side = btn.dataset.side;

      if (!code || !side) return;

      try {
        await aplicarAvanzadoMotor(code, side);
      } catch (e) {
        console.error("❌ aplicar cálculo avanzado:", e);
        mostrarToast(`❌ ${e.message}`);
      }
    });
  });
}

async function aplicarAvanzadoMotor(code, side) {
  const key = `${code}.${side}`;
  const change = borradorAvanzadoMotor[key];

  if (!change) {
    mostrarToast("No hay cambios preparados para este cálculo");
    return;
  }

  const r = await fetch("/api/admin/quote-strategies/advanced", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": getAdminKey(),
    },
    body: JSON.stringify({
      changes: [
        {
          code,
          side,
          rows: Number(change.rows),
          aggregation: change.aggregation,
          trimLowest: Number(change.trimLowest || 0),
          trimHighest: Number(change.trimHighest || 0),
        },
      ],
    }),
  });

  const data = await r.json().catch(() => null);

  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || "No se pudo aplicar configuración avanzada");
  }

  delete borradorAvanzadoMotor[key];

  mostrarToast("✅ Cálculo actualizado");
  await cargarPanelEstrategiasCotizacion();
  await cargarComparacionMetodoCotizacion();
}

function obtenerPaytypesActualesMotor(cfg) {
  const buy = obtenerBinanceStrategyDesdeLado(cfg?.buy);
  const sell = obtenerBinanceStrategyDesdeLado(cfg?.sell);

  const set = new Set();

  if (Array.isArray(buy?.payTypes)) {
    buy.payTypes.forEach((x) => set.add(String(x)));
  }

  if (Array.isArray(sell?.payTypes)) {
    sell.payTypes.forEach((x) => set.add(String(x)));
  }

  return Array.from(set);
}

function obtenerClaseRankingMetodo(label) {
  if (label === "Dominante") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25";
  }

  if (label === "Popular") {
    return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25";
  }

  if (label === "Presente") {
    return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20";
  }

  return "bg-white/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-black/5 dark:border-white/10";
}

function renderSelectorMetodosPagoMotor(code, cfg, catalogData) {
  const catalog = catalogData?.catalog?.currencies?.[code];
  const methodsObj = catalog?.methods || {};
  const ordered = Array.isArray(catalog?.methods_ordered)
    ? catalog.methods_ordered
    : Object.keys(methodsObj);

  const actuales = borradorPaytypesMotor[code]?.payTypes || obtenerPaytypesActualesMotor(cfg);
  const selected = new Set(actuales.map(String));

  const esBinance =
    obtenerBinanceStrategyDesdeLado(cfg?.buy) ||
    obtenerBinanceStrategyDesdeLado(cfg?.sell);

  if (!esBinance) {
    return `
      <div class="mt-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
        <div class="text-sm font-semibold">Métodos de pago</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Esta moneda no usa Binance P2P directo.
        </div>
      </div>
    `;
  }

  if (!ordered.length) {
    return `
      <div class="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div class="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              Sin métodos detectados
            </div>
            <div class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Escanea esta moneda para descubrir bancos y métodos disponibles.
            </div>
          </div>

          <button
            class="btn-ghost text-sm"
            data-scan-paytypes="1"
            data-code="${code}"
          >
            Escanear métodos
          </button>
        </div>
      </div>
    `;
  }

  const chips = ordered
    .map((id) => methodsObj[id])
    .filter(Boolean)
    .map((method) => {
      const active = selected.has(method.identifier);
      const rankClass = obtenerClaseRankingMetodo(method.rank_label);
      const activeClass = active
        ? "ring-2 ring-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
        : rankClass;

      return `
<button
  type="button"
  class="rounded-full border px-3 py-2 text-xs font-semibold transition hover:scale-[1.01] ${activeClass}"
  data-paytype-chip="1"
  data-code="${code}"
  data-paytype="${method.identifier}"
  data-rank-label="${method.rank_label || "Ocasional"}"
>
          <span>${method.name}</span>
          <span class="opacity-70 ml-1">· ${method.rank_label || "Ocasional"}</span>
        </button>
      `;
    })
    .join("");

  const resumenSeleccion = selected.size
    ? `${selected.size} método(s) seleccionado(s)`
    : "Sin filtro de método: Binance buscará sin limitar bancos.";

  const preparado = !!borradorPaytypesMotor[code];

  return `
    <div class="mt-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <div class="text-sm font-semibold">Métodos de pago</div>
            ${
              preparado
                ? `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/15">
                    Cambio preparado
                  </span>`
                : ""
            }
          </div>

          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ${resumenSeleccion}
          </div>
        </div>

<div class="flex flex-wrap gap-2">
  <button
    class="btn-primary text-sm"
    data-apply-paytypes="1"
    data-code="${code}"
  >
    Aplicar métodos
  </button>

  <button
    class="btn-ghost text-sm"
    data-select-rank-paytypes="1"
    data-rank-mode="dominantes"
    data-code="${code}"
  >
    Solo dominantes
  </button>

  <button
    class="btn-ghost text-sm"
    data-select-rank-paytypes="1"
    data-rank-mode="populares"
    data-code="${code}"
  >
    Populares
  </button>

  <button
    class="btn-ghost text-sm"
    data-clear-paytypes="1"
    data-code="${code}"
  >
    Sin filtro
  </button>

  <button
    class="btn-ghost text-sm"
    data-scan-paytypes="1"
    data-code="${code}"
  >
    Escanear
  </button>
</div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        ${chips}
      </div>

      <div class="text-xs text-slate-500 dark:text-slate-400 mt-3">
        Los métodos elegidos se aplican a compra y venta de ${code}.
      </div>
    </div>
  `;
}

function registrarEventosPaytypesMotor() {
  document.querySelectorAll("[data-paytype-chip]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", () => {
      const code = btn.dataset.code;
      const paytype = btn.dataset.paytype;
      if (!code || !paytype) return;

      const actuales = new Set(
        (borradorPaytypesMotor[code]?.payTypes || obtenerPaytypesDesdeDOM(code)).map(String)
      );

      if (actuales.has(paytype)) {
        actuales.delete(paytype);
      } else {
        actuales.add(paytype);
      }

      borradorPaytypesMotor[code] = {
        code,
        payTypes: Array.from(actuales),
      };

      cargarPanelEstrategiasCotizacion();
    });
  });

document.querySelectorAll("[data-select-rank-paytypes]").forEach((btn) => {
  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", () => {
    const code = btn.dataset.code;
    const mode = btn.dataset.rankMode;

    if (!code) return;

    const selected = [];

    document
      .querySelectorAll(`[data-paytype-chip][data-code="${code}"]`)
      .forEach((chip) => {
        const paytype = chip.dataset.paytype;
        const rank = chip.dataset.rankLabel;

        if (!paytype) return;

        if (mode === "dominantes" && rank === "Dominante") {
          selected.push(paytype);
        }

        if (
          mode === "populares" &&
          ["Dominante", "Popular", "Presente"].includes(rank)
        ) {
          selected.push(paytype);
        }
      });

    borradorPaytypesMotor[code] = {
      code,
      payTypes: selected,
    };

    cargarPanelEstrategiasCotizacion();
  });
});

  document.querySelectorAll("[data-clear-paytypes]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", () => {
      const code = btn.dataset.code;
      if (!code) return;

      borradorPaytypesMotor[code] = {
        code,
        payTypes: [],
      };

      cargarPanelEstrategiasCotizacion();
    });
  });

  document.querySelectorAll("[data-apply-paytypes]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", async () => {
      const code = btn.dataset.code;
      if (!code) return;

      try {
        await aplicarPaytypesMotor(code);
      } catch (e) {
        console.error("❌ aplicar métodos:", e);
        mostrarToast(`❌ ${e.message}`);
      }
    });
  });

  document.querySelectorAll("[data-scan-paytypes]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", async () => {
      const code = btn.dataset.code;
      if (!code) return;

      try {
        btn.disabled = true;
        btn.textContent = "Escaneando...";
        await escanearPaytypesMotor(code);
      } catch (e) {
        console.error("❌ escanear métodos:", e);
        mostrarToast(`❌ ${e.message}`);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function obtenerPaytypesDesdeDOM(code) {
  const activos = [];

  document
    .querySelectorAll(`[data-paytype-chip][data-code="${code}"]`)
    .forEach((btn) => {
      const paytype = btn.dataset.paytype;
      const estaActivo =
        btn.className.includes("ring-blue") ||
        btn.className.includes("text-blue-700") ||
        btn.className.includes("dark:text-blue-300");

      if (paytype && estaActivo) activos.push(paytype);
    });

  return activos;
}

async function aplicarPaytypesMotor(code) {
  const change = borradorPaytypesMotor[code];

  if (!change) {
    mostrarToast("No hay cambios preparados para esta moneda");
    return;
  }

  const r = await fetch("/api/admin/quote-strategies/paytypes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": getAdminKey(),
    },
    body: JSON.stringify({
      changes: [
        {
          code,
          payTypes: Array.isArray(change.payTypes) ? change.payTypes : [],
        },
      ],
    }),
  });

  const data = await r.json().catch(() => null);

  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || "No se pudieron aplicar métodos");
  }

  delete borradorPaytypesMotor[code];

  mostrarToast("✅ Métodos aplicados");
  await cargarPanelEstrategiasCotizacion();
  await cargarComparacionMetodoCotizacion();
}

async function escanearPaytypesMotor(code) {
  const r = await fetch(`/api/admin/paytypes/scan/${encodeURIComponent(code)}?rows=80`, {
    method: "POST",
    headers: {
      "x-admin-key": getAdminKey(),
    },
  });

  const data = await r.json().catch(() => null);

  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || "No se pudo escanear métodos");
  }

  mostrarToast(`✅ Métodos actualizados para ${code}`);
  await cargarPanelEstrategiasCotizacion();
}

function describirOperacionDerived(strategy) {
  if (!strategy) return "Cálculo interno";

  if (strategy.operation === "multiply") {
    return `Calculado desde ${strategy.from} con ajuste operativo`;
  }

  if (strategy.operation === "divide") {
    return `Calculado desde ${strategy.from} por división operativa`;
  }

  if (strategy.operation === "add") {
    return `Calculado desde ${strategy.from} sumando ajuste`;
  }

  if (strategy.operation === "subtract") {
    return `Calculado desde ${strategy.from} restando ajuste`;
  }

  return `Calculado desde ${strategy.from || "otra referencia"}`;
}

function describirEstrategiaLado(strategy) {
  if (!strategy) return "Sin configuración";

  const lista = Array.isArray(strategy.providers) ? strategy.providers : [strategy];

  return lista
    .map((item, idx) => {
      const prefijo = idx === 0 ? "Principal" : `Respaldo ${idx}`;

        if (item.provider === "binance") {
          const metodo =
            item.aggregation === "median"
              ? "mediana"
              : "promedio";

          const extremos =
            Number(item.trimLowest || 0) || Number(item.trimHighest || 0)
              ? ` Excluye extremos: ${item.trimLowest || 0} más bajo(s) y ${item.trimHighest || 0} más alto(s).`
              : " Sin exclusión de extremos.";

          let monto = " Sin filtro de monto.";

          if (item.amountMode === "usdt" && Number.isFinite(Number(item.amountUsdt))) {
            monto = ` Monto operativo: ${Number(item.amountUsdt).toLocaleString("es-AR")} USDT. El sistema lo convierte automáticamente a moneda local al consultar Binance.`;
          } else if (Number.isFinite(Number(item.transAmount))) {
            monto = ` Monto de consulta fijo: ${Number(item.transAmount).toLocaleString("es-AR")} en moneda local.`;
          }

          return `${prefijo}: Mercado P2P. Usa ${item.rows || 20} anuncios y calcula por ${metodo}.${extremos}${monto}`;
        }

      if (item.provider === "ptax") {
        return `${prefijo}: Referencia oficial BRL.`;
      }

      if (item.provider === "snapshot") {
        return `${prefijo}: Base guardada del día.`;
      }

      if (item.provider === "derived") {
        return `${prefijo}: ${describirOperacionDerived(item)}.`;
      }

      return `${prefijo}: Fuente externa.`;
    })
    .join(" ");
}

function renderEstrategiasCotizacion(data, quotesData = null, catalogData = null) {
  const grid = document.getElementById("quote-strategies-grid");
  if (!grid) return;

  const strategies = data?.strategies || {};
  const entries = Object.entries(strategies);

  if (!entries.length) {
    grid.innerHTML = `
      <div class="premium-card rounded-2xl p-4 text-sm text-slate-500 dark:text-slate-400">
        No hay estrategias configuradas.
      </div>
    `;
    return;
  }

  grid.innerHTML = entries
    .map(([code, cfg]) => {
      const quote = quotesData?.results?.[code] || null;

const resumenConsulta = quote
  ? `
    <div class="mt-4 rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4">
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Última consulta operativa
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
        ${["buy", "sell"].map((side) => {
          const item = quote?.[side];
          if (!item || item.provider !== "binance") {
            return `
              <div class="rounded-xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3">
                <div class="text-xs text-slate-500 dark:text-slate-400">
                  ${traducirLadoCotizacion(side)}
                </div>
                <div class="font-medium mt-1">
                  No usa consulta P2P directa.
                </div>
              </div>
            `;
          }

          const amountUsdt = Number.isFinite(Number(item.amountUsdt))
            ? `${Number(item.amountUsdt).toLocaleString("es-AR")} USDT`
            : "Sin monto operativo";

          const transAmount = Number.isFinite(Number(item.transAmount))
            ? formatearMontoLocalMotor(code, item.transAmount)
            : "—";

          const probePrice = Number.isFinite(Number(item.probePrice))
            ? Number(item.probePrice).toFixed(6)
            : "—";

          return `
            <div class="rounded-xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3">
              <div class="text-xs text-slate-500 dark:text-slate-400">
                ${traducirLadoCotizacion(side)}
              </div>

              <div class="font-semibold mt-1">
                ${amountUsdt} → ${transAmount} ${code}
              </div>

              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Referencia rápida usada: ${probePrice}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `
  : "";

      return `
        <div class="premium-card rounded-2xl p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-lg font-semibold">${code}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configuración actual del motor
              </div>
            </div>
          </div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
  ${renderControlMontoMotor(code, "buy", cfg.buy)}
  ${renderControlMontoMotor(code, "sell", cfg.sell)}
</div>

<div class="mt-5">
  <div class="text-sm font-semibold mb-3">Ajustes de cálculo</div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    ${renderControlAvanzadoMotor(code, "buy", cfg.buy)}
    ${renderControlAvanzadoMotor(code, "sell", cfg.sell)}
  </div>
</div>

${renderSelectorMetodosPagoMotor(code, cfg, catalogData)}

${resumenConsulta}
        </div>
      `;
    })
    .join("");

      registrarEventosMontoMotor();
      renderResumenBorradorMotor();
      registrarEventosMontoMotor();
      registrarEventosAvanzadosMotor();
registrarEventosPaytypesMotor();
renderResumenBorradorMotor();
}

async function cargarPanelEstrategiasCotizacion() {
  try {
const [strategiesData, quotesData, catalogData] = await Promise.all([
  obtenerEstrategiasCotizacion(),
  obtenerAuditoriaCotizaciones(),
  obtenerCatalogoMetodosPago(),
]);

renderEstrategiasCotizacion(strategiesData, quotesData, catalogData);
  } catch (e) {
    const grid = document.getElementById("quote-strategies-grid");
    if (grid) {
      grid.innerHTML = `
        <div class="premium-card rounded-2xl p-4 text-sm text-red-600 dark:text-red-300">
          No se pudo cargar la configuración del motor.
        </div>
      `;
    }
  }
}

function formatearMontoLocalMotor(code, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  const sinDecimales = ["VES", "ARS", "COP", "CLP", "MXN"];
  const decimales = sinDecimales.includes(code) ? 0 : 2;

  return n.toLocaleString("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

async function obtenerComparacionMetodoCotizacion() {
  const r = await fetch("/api/debug/quote-method-compare", {
    headers: {
      "x-admin-key": getAdminKey(),
    },
    cache: "no-store",
  });

  if (!r.ok) throw new Error("No se pudo cargar comparación de métodos");
  return r.json();
}

function traducirLadoCotizacion(side) {
  if (side === "buy") return "Compra";
  if (side === "sell") return "Venta";
  return side || "—";
}

function traducirMetodoCalculo(metodo) {
  if (metodo === "average") return "Promedio";
  if (metodo === "median") return "Mediana";
  return "Sin definir";
}

function renderComparacionMetodoCotizacion(data) {
  const grid = document.getElementById("quote-method-compare-grid");
  if (!grid) return;

  const results = data?.results || {};
  const cards = [];

  for (const [code, sides] of Object.entries(results)) {
    for (const side of ["buy", "sell"]) {
      const item = sides?.[side];
      if (!item || item.skipped) continue;

      const nivel = item.lectura?.nivel || "sin_datos";
      const texto = item.lectura?.texto || "Sin lectura disponible.";

      let borderClass = "border-emerald-500/20";
      let badgeClass = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/15";
      let badgeText = "Mercado parejo";

      if (nivel === "observacion") {
        borderClass = "border-yellow-500/20";
        badgeClass = "bg-yellow-500/10 text-yellow-700 dark:text-yellow-200 border border-yellow-500/15";
        badgeText = "Observar";
      }

      if (nivel === "revisar") {
        borderClass = "border-orange-500/20";
        badgeClass = "bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/15";
        badgeText = "Revisar método";
      }

      if (nivel === "sin_datos") {
        borderClass = "border-slate-500/20";
        badgeClass = "bg-slate-900/5 dark:bg-white/10 text-slate-700 dark:text-slate-200";
        badgeText = "Sin datos";
      }

      const promedio = Number.isFinite(Number(item.promedio))
        ? Number(item.promedio).toFixed(6)
        : "—";

      const mediana = Number.isFinite(Number(item.mediana))
        ? Number(item.mediana).toFixed(6)
        : "—";

      const diferencia = Number.isFinite(Number(item.diferenciaPct))
        ? `${Number(item.diferenciaPct) > 0 ? "+" : ""}${Number(item.diferenciaPct).toFixed(2)}%`
        : "—";

      cards.push(`
        <div class="premium-card rounded-2xl p-5 border ${borderClass}">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-lg font-semibold">${code} · ${traducirLadoCotizacion(side)}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Método actual: ${traducirMetodoCalculo(item.metodoActual)}
              </div>
            </div>

            <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}">
              ${badgeText}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-3 mt-5">
            <div class="rounded-2xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3">
              <div class="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Promedio
              </div>
              <div class="text-sm font-semibold mt-1">${promedio}</div>
            </div>

            <div class="rounded-2xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3">
              <div class="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Mediana
              </div>
              <div class="text-sm font-semibold mt-1">${mediana}</div>
            </div>

            <div class="rounded-2xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3">
              <div class="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Diferencia
              </div>
              <div class="text-sm font-semibold mt-1">${diferencia}</div>
            </div>
          </div>

          <div class="mt-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            ${texto}
          </div>

          <div class="mt-3 text-xs text-slate-500 dark:text-slate-400">
            ${item.usedCount || 0} anuncios usados de ${item.rawCount || 0} encontrados.
          </div>
        </div>
      `);
    }
  }

  if (!cards.length) {
    grid.innerHTML = `
      <div class="premium-card rounded-2xl p-4 text-sm text-slate-500 dark:text-slate-400">
        No hay comparaciones disponibles para mostrar.
      </div>
    `;
    return;
  }

  grid.innerHTML = cards.join("");
}

async function cargarComparacionMetodoCotizacion() {
  try {
    const data = await obtenerComparacionMetodoCotizacion();
    renderComparacionMetodoCotizacion(data);
  } catch (e) {
    const grid = document.getElementById("quote-method-compare-grid");
    if (grid) {
      grid.innerHTML = `
        <div class="premium-card rounded-2xl p-4 text-sm text-red-600 dark:text-red-300">
          No se pudo cargar la comparación de métodos.
        </div>
      `;
    }
  }
}

const borradorMotorCotizaciones = {};

function obtenerPrimerProviderBinance(strategy) {
  if (!strategy) return null;
  if (strategy.provider === "binance") return strategy;

  if (Array.isArray(strategy.providers)) {
    return strategy.providers.find((p) => p.provider === "binance") || null;
  }

  return null;
}

function obtenerMontoUsdtEstrategia(strategy) {
  const binance = obtenerPrimerProviderBinance(strategy);
  if (!binance) return null;

  if (binance.amountMode === "usdt" && Number.isFinite(Number(binance.amountUsdt))) {
    return Number(binance.amountUsdt);
  }

  return null;
}

function renderControlMontoMotor(code, side, strategy) {
  const label = side === "buy" ? "Compra" : "Venta";
  const monto = obtenerMontoUsdtEstrategia(strategy);
  const descripcion = describirEstrategiaLado(strategy);
  const esP2P = monto != null;

  if (!esP2P) {
    return `
      <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          ${label}
        </div>

        <div class="text-sm mt-2 text-slate-700 dark:text-slate-200 leading-relaxed">
          ${descripcion}
        </div>

        <div class="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Este lado no usa monto operativo USDT.
        </div>
      </div>
    `;
  }

  const key = `${code}.${side}`;
  const preparado = borradorMotorCotizaciones[key];
  const valorMostrado = preparado?.amountUsdt ?? monto;

  return `
    <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
      <div class="flex items-center justify-between gap-3">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          ${label}
        </div>

        ${
          preparado
            ? `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/15">
                Cambio preparado
              </span>`
            : ""
        }
      </div>

      <div class="text-sm mt-2 text-slate-700 dark:text-slate-200 leading-relaxed">
        ${descripcion}
      </div>

      <div class="mt-4">
        <label class="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 block mb-2">
          Monto operativo
        </label>

        <div class="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="any"
            value="${valorMostrado}"
            data-motor-amount-input="1"
            data-code="${code}"
            data-side="${side}"
            class="input-premium w-full"
            placeholder="Sin filtro"
          />

          <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">
            USDT
          </span>
        </div>

        <div class="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Binance lo recibirá convertido a moneda local al consultar precios.
        </div>
      </div>
    </div>
  `;
}

function registrarEventosMontoMotor() {
  document.querySelectorAll("[data-motor-amount-input]").forEach((input) => {
    if (input.dataset.bound === "1") return;
    input.dataset.bound = "1";

    input.addEventListener("change", () => {
      const code = input.dataset.code;
      const side = input.dataset.side;
      const key = `${code}.${side}`;
      const n = Number(input.value);

      if (!Number.isFinite(n) || n <= 0) {
        delete borradorMotorCotizaciones[key];
      } else {
        borradorMotorCotizaciones[key] = {
          code,
          side,
          amountMode: "usdt",
          amountUsdt: n,
        };
      }

      renderResumenBorradorMotor();
    });
  });
}

function renderResumenBorradorMotor() {
  let box = document.getElementById("quote-engine-draft-summary");

  const panel = document.getElementById("quote-strategies-grid");
  if (!panel) return;

  if (!box) {
    box = document.createElement("div");
    box.id = "quote-engine-draft-summary";
    box.className = "mt-5";
    panel.parentElement.appendChild(box);
  }

  const cambios = Object.values(borradorMotorCotizaciones);

  if (!cambios.length) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `
    <div class="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div class="text-sm font-semibold text-blue-800 dark:text-blue-200">
            Cambios preparados en el motor
          </div>
          <div class="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Estos cambios todavía no se guardan ni afectan el cálculo real.
          </div>
        </div>

<div class="flex items-center gap-2">
  <button id="btn-aplicar-borrador-motor" class="btn-primary text-sm">
    Aplicar configuración
  </button>

  <button id="btn-limpiar-borrador-motor" class="btn-ghost text-sm">
    Limpiar cambios
  </button>
</div>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        ${cambios
          .map(
            (c) => `
              <div class="rounded-2xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3 text-sm">
                <div class="font-semibold">
                  ${c.code} · ${traducirLadoCotizacion(c.side)}
                </div>
                <div class="text-slate-600 dark:text-slate-300 mt-1">
                  Nuevo monto operativo: ${Number(c.amountUsdt).toLocaleString("es-AR")} USDT
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  document.getElementById("btn-limpiar-borrador-motor")?.addEventListener("click", async () => {
    for (const key of Object.keys(borradorMotorCotizaciones)) {
      delete borradorMotorCotizaciones[key];
    }

    await cargarPanelEstrategiasCotizacion();
  });

  document.getElementById("btn-aplicar-borrador-motor")?.addEventListener("click", async () => {
  try {
    await aplicarBorradorMotorCotizaciones();
  } catch (e) {
    console.error("❌ aplicar motor:", e);
    mostrarToast(`❌ ${e.message}`);
  }
});
}

async function aplicarBorradorMotorCotizaciones() {
  const changes = Object.values(borradorMotorCotizaciones);

  if (!changes.length) {
    mostrarToast("No hay cambios preparados");
    return;
  }

  const r = await fetch("/api/admin/quote-strategies/amounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": getAdminKey(),
    },
    body: JSON.stringify({ changes }),
  });

  const data = await r.json().catch(() => null);

  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || "No se pudo aplicar configuración");
  }

  for (const key of Object.keys(borradorMotorCotizaciones)) {
    delete borradorMotorCotizaciones[key];
  }

  mostrarToast("✅ Configuración del motor aplicada");

  await cargarPanelEstrategiasCotizacion();
  await cargarComparacionMetodoCotizacion();
}