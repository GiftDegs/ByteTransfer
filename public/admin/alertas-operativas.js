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