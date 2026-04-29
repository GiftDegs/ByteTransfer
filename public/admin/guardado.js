"use strict";

// =====================================================
// PREVIEW / GUARDADO
// =====================================================
function aplicarCambiosEnPantalla({ mostrarToastOk = true } = {}) {
  const crucesActualesPrevios = { ...(crucesRenderActuales || {}) };

  leerPreciosDesdeInputs();
  margenesCruce = asegurarMapaCompletoMargenes(5, borradorMargenesCruce || {});

  if (Object.keys(crucesActualesPrevios).length) {
    crucesAntesVisibles = crucesActualesPrevios;
  } else if (Object.keys(crucesBaseHistorica || {}).length) {
    crucesAntesVisibles = { ...(crucesBaseHistorica || {}) };
  }

  crucesRenderActuales = calcularTodosLosCruces(datosPaises, margenesCruce);

  escribirCruces();
  renderResumenBorrador();
  mostrarAdvertenciaPendiente(true);

  if (mostrarToastOk) {
    mostrarToast("✅ Vista previa lista");
  }
}

// =====================================================
// RESUMEN DE CAMBIOS
// =====================================================
let timerResumenCambios = null;

function cerrarResumenCambios() {
  const modal = document.getElementById("modal-resumen-cambios");
  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");

  if (timerResumenCambios) {
    clearTimeout(timerResumenCambios);
    timerResumenCambios = null;
  }
}

function calcularVariacionPct(anterior, nuevo) {
  const a = Number(anterior);
  const n = Number(nuevo);
  if (!Number.isFinite(a) || !Number.isFinite(n) || a === 0) return null;
  return ((n - a) / a) * 100;
}

function normalizarNumeroComparable(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function normalizarMargenComparable(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? +n.toFixed(4) : null;
}

function sincronizarReferenciasDesdeInputs() {
  const inputBcvUsd = parseFloat(document.getElementById("ref-bcv-usd")?.value);
  const inputBcvEur = parseFloat(document.getElementById("ref-bcv-eur")?.value);

  if (!referenciasExternas) referenciasExternas = {};
  if (!referenciasExternas.bcv) referenciasExternas.bcv = {};

  if (Number.isFinite(inputBcvUsd)) {
    referenciasExternas.bcv.usd = inputBcvUsd;
  }

  if (Number.isFinite(inputBcvEur)) {
    referenciasExternas.bcv.eur = inputBcvEur;
  }

  if (Number.isFinite(inputBcvUsd) || Number.isFinite(inputBcvEur)) {
    referenciasExternas.bcv.manual = true;
  }
}

function construirBaseComparableActual() {
  const datos = {};
  for (const p of paises) {
    const fiat = p.fiat;
    datos[fiat] = {
      compra: normalizarNumeroComparable(datosPaises?.[fiat]?.compra),
      venta: normalizarNumeroComparable(datosPaises?.[fiat]?.venta),
    };
  }

  const refs = {
    bcv: {
      usd: normalizarNumeroComparable(referenciasExternas?.bcv?.usd),
      eur: normalizarNumeroComparable(referenciasExternas?.bcv?.eur),
      manual: !!referenciasExternas?.bcv?.manual,
    },
    usdt_ves: {
      mid: normalizarNumeroComparable(referenciasExternas?.usdt_ves?.mid),
    },
  };

  return {
    datos,
    cruces: crucesRenderActuales || {},
    margenesCruce: asegurarMapaCompletoMargenes(5, margenesCruce || {}),
    referencias: refs,
  };
}

function construirBaseComparablePrevia() {
  const datos = {};

  for (const p of paises) {
    const sp = snapshotPrevio?.[p.fiat] || {};
    datos[p.fiat] = {
      compra: normalizarNumeroComparable(sp.compra),
      venta: normalizarNumeroComparable(sp.venta),
    };
  }

  const refs = {
    bcv: {
      usd: normalizarNumeroComparable(snapshotPrevio?.referencias?.bcv?.usd),
      eur: normalizarNumeroComparable(snapshotPrevio?.referencias?.bcv?.eur),
      manual: !!snapshotPrevio?.referencias?.bcv?.manual,
    },
    usdt_ves: {
      mid: normalizarNumeroComparable(snapshotPrevio?.referencias?.usdt_ves?.mid),
    },
  };

  return {
    datos,
    cruces: snapshotPrevio?.cruces || {},
    margenesCruce: asegurarMapaCompletoMargenes(5, snapshotPrevio?.margenesCruce || {}),
    referencias: refs,
  };
}

function obtenerMetadataMotorCambioPrecio(fiat, campo) {
  const code = String(fiat || "").toUpperCase();
  const keyCampo = String(campo || "").toLowerCase();

  return metadataCotizacionesMotor?.[code]?.[keyCampo] || null;
}

function formatearResumenMotorPrecio(meta) {
  if (!meta) return "";
  
  if (meta?.provider === "ptax") {
  return "PTAX · sin anuncios P2P";
}

  const audit = meta.audit || {};
  const aggregation = audit.aggregation === "median"
    ? "mediana"
    : audit.aggregation === "average"
      ? "promedio"
      : audit.aggregation || "método no informado";

  const usados = audit.used_count ?? audit.usedCount ?? null;
  const crudos = audit.raw_count ?? audit.rawCount ?? null;

  const anuncios =
    usados != null && crudos != null
      ? `${usados}/${crudos} anuncios`
      : "";

  const bancos = Array.isArray(audit.payTypes) && audit.payTypes.length
    ? audit.payTypes.join(", ")
    : "sin filtro de banco";

  const monto = Number.isFinite(Number(audit.transAmount))
    ? `consulta Binance: ${Number(audit.transAmount).toLocaleString("es-AR")}`
    : null;

  return [
    aggregation,
    anuncios,
    bancos,
    monto,
  ].filter(Boolean).join(" · ");
}

function obtenerCambiosDatos(baseActual, basePrevia) {
  const cambios = [];

  for (const p of paises) {
    const fiat = p.fiat;
    const actual = baseActual?.datos?.[fiat] || {};
    const previo = basePrevia?.datos?.[fiat] || {};

    for (const campo of ["compra", "venta"]) {
      const anterior = normalizarNumeroComparable(previo[campo]);
      const nuevo = normalizarNumeroComparable(actual[campo]);

      if (anterior !== nuevo) {
        const motorMeta = obtenerMetadataMotorCambioPrecio(fiat, campo);
        const motorResumen = formatearResumenMotorPrecio(motorMeta);

        cambios.push({
          tipo: "precio",
          grupo: "Precios",
          fiat,
          entidad: fiat,
          campo,
          anterior: anterior ?? "vacío",
          nuevo: nuevo ?? "vacío",
          motorMeta,
          motorResumen,
        });
      }
    }
  }

  return cambios;
}

function obtenerCambiosReferencias(baseActual, basePrevia) {
  const cambios = [];

  const referenciasAComparar = [
    {
      label: "BCV USD",
      campo: "usd",
      anterior: basePrevia?.referencias?.bcv?.usd,
      nuevo: baseActual?.referencias?.bcv?.usd,
    },
    {
      label: "BCV EUR",
      campo: "eur",
      anterior: basePrevia?.referencias?.bcv?.eur,
      nuevo: baseActual?.referencias?.bcv?.eur,
    },
    {
      label: "USDT VES",
      campo: "mid",
      anterior: basePrevia?.referencias?.usdt_ves?.mid,
      nuevo: baseActual?.referencias?.usdt_ves?.mid,
    },
  ];

  for (const ref of referenciasAComparar) {
    const anterior = normalizarNumeroComparable(ref.anterior);
    const nuevo = normalizarNumeroComparable(ref.nuevo);

    if (anterior !== nuevo) {
      cambios.push({
        tipo: "referencia",
        grupo: "Referencias",
        fiat: ref.label,
        entidad: ref.label,
        campo: ref.campo,
        anterior: anterior ?? "vacío",
        nuevo: nuevo ?? "vacío",
      });
    }
  }

  const manualAnterior = !!basePrevia?.referencias?.bcv?.manual;
  const manualNuevo = !!baseActual?.referencias?.bcv?.manual;

  if (manualAnterior !== manualNuevo) {
    cambios.push({
      tipo: "referencia",
      grupo: "Referencias",
      fiat: "BCV manual",
      entidad: "BCV manual",
      campo: "manual",
      anterior: manualAnterior ? "activo" : "inactivo",
      nuevo: manualNuevo ? "activo" : "inactivo",
    });
  }

  return cambios;
}

function obtenerCambiosMargenes(baseActual, basePrevia) {
  const cambios = [];

  const actual = asegurarMapaCompletoMargenes(5, baseActual?.margenesCruce || {});
  const previo = asegurarMapaCompletoMargenes(5, basePrevia?.margenesCruce || {});

  const claves = new Set([
    ...Object.keys(actual || {}),
    ...Object.keys(previo || {}),
  ]);

  for (const clave of claves) {
    const anterior = normalizarMargenComparable(previo[clave]);
    const nuevo = normalizarMargenComparable(actual[clave]);

    if (anterior !== nuevo) {
      cambios.push({
        tipo: "margen",
        grupo: "Márgenes",
        fiat: clave,
        entidad: clave,
        campo: "margen",
        anterior: anterior ?? "vacío",
        nuevo: nuevo ?? "vacío",
      });
    }
  }

  return cambios;
}

function obtenerResumenCambios() {
  const baseActual = construirBaseComparableActual();
  const basePrevia = construirBaseComparablePrevia();

  return [
    ...obtenerCambiosDatos(baseActual, basePrevia),
    ...obtenerCambiosReferencias(baseActual, basePrevia),
    ...obtenerCambiosMargenes(baseActual, basePrevia),
  ];
}

function resumirCambios(cambios = []) {
  const paisesAfectados = new Set();
  let cambiosPrecios = 0;
  let cambiosReferencias = 0;
  let cambiosMargenes = 0;
  let cambiosOperacion = 0;
  let cambiosCruces = 0;
  let cambiosSistema = 0;

  for (const cambio of cambios) {
    if (cambio.tipo === "precio") {
      cambiosPrecios++;
      if (cambio.fiat) paisesAfectados.add(cambio.fiat);
    } else if (cambio.tipo === "referencia") {
      cambiosReferencias++;
    } else if (cambio.tipo === "margen") {
      cambiosMargenes++;
    } else if (cambio.tipo === "operacion") {
      cambiosOperacion++;
    } else if (cambio.tipo === "cruce") {
      cambiosCruces++;
    } else if (cambio.tipo === "sistema") {
      cambiosSistema++;
    }
  }

  return {
    totalCambios: cambios.length,
    paisesAfectados: paisesAfectados.size,
    cambiosPrecios,
    cambiosReferencias,
    cambiosMargenes,
    cambiosOperacion,
    cambiosCruces,
    cambiosSistema,
  };
}

function calcularDuracionResumenCambios(cambios = [], opts = {}) {
  const total = Array.isArray(cambios) ? cambios.length : 0;
  const tieneAdvertencias = !!opts.tieneAdvertencias;
  const tieneBloqueos = !!opts.tieneBloqueos;

  if (tieneBloqueos) return 0;

  const base = 2200;
  const porCambio = 850;
  const extraAdvertencias = tieneAdvertencias ? 1800 : 0;
  const max = 12000;

  return Math.min(base + total * porCambio + extraAdvertencias, max);
}

function esCruceEspecialVisualResumen(cambio) {
  return cambio?.tipo === "cruce" && cambio?.origen === "COP" && cambio?.destino === "VES";
}

function obtenerClaseNuevoValorResumen(cambio) {
  const anterior = Number(cambio?.anterior);
  const nuevo = Number(cambio?.nuevo);

  if (!Number.isFinite(anterior) || !Number.isFinite(nuevo)) {
    return "text-slate-900 dark:text-white";
  }

  if (nuevo === anterior) {
    return "text-slate-900 dark:text-white";
  }

  const subio = nuevo > anterior;
  const invertido = esCruceEspecialVisualResumen(cambio);
  const positivo = invertido ? !subio : subio;

  return positivo
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
}

function mostrarResumenCambios(cambios, opciones = {}) {
  const modal = document.getElementById("modal-resumen-cambios");
  const lista = document.getElementById("resumen-cambios-lista");

  if (!modal || !lista || !Array.isArray(cambios) || !cambios.length) return;

  const resumen = resumirCambios(cambios);
  const advertencias = Array.isArray(opciones.advertencias) ? opciones.advertencias : [];
  const bloqueos = Array.isArray(opciones.bloqueos) ? opciones.bloqueos : [];
  const autoClose = opciones.autoClose !== false;

  const cambiosPrecios = cambios.filter((c) => c.tipo === "precio");
  const cambiosReferencias = cambios.filter((c) => c.tipo === "referencia");
  const cambiosMargenes = cambios.filter((c) => c.tipo === "margen");
  const cambiosOperacion = cambios.filter((c) => c.tipo === "operacion");
  const cambiosSistema = cambios.filter((c) => c.tipo === "sistema");
  const cambiosCruces = cambios.filter((c) => c.tipo === "cruce");

  const crucesHaciaVenezuela = cambiosCruces.filter((c) => c.subtipo === "hacia_venezuela");
  const crucesDesdeVenezuela = cambiosCruces.filter((c) => c.subtipo === "desde_venezuela");
  const crucesOtros = cambiosCruces.filter((c) => c.subtipo === "otros");

  lista.innerHTML = "";

  const header = document.createElement("div");
  header.className = "premium-card rounded-2xl px-4 py-3 mb-3";
  header.innerHTML = `
    <div class="space-y-2">
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span class="font-semibold">Cambios detectados: ${resumen.totalCambios}</span>
        <span class="opacity-60">•</span>
        <span>Países afectados: ${resumen.paisesAfectados}</span>
      </div>
      <div class="text-xs text-slate-500 dark:text-slate-400">
        Precios: ${resumen.cambiosPrecios || 0} ·
        Referencias: ${resumen.cambiosReferencias || 0} ·
        Márgenes: ${resumen.cambiosMargenes || 0} ·
        Operación pública: ${resumen.cambiosOperacion || 0} ·
        Sistema: ${resumen.cambiosSistema || 0} ·
        Cruces: ${resumen.cambiosCruces || 0}
      </div>
    </div>
  `;
  lista.appendChild(header);

  if (bloqueos.length) {
    const boxBloqueos = document.createElement("div");
    boxBloqueos.className = "premium-card rounded-2xl px-4 py-3 mb-3 border border-red-500/20";
    boxBloqueos.innerHTML = `
      <div class="font-semibold text-sm text-red-600 mb-2">Bloqueos</div>
      <ul class="space-y-1 text-sm text-slate-700 dark:text-slate-200">
        ${bloqueos.map((b) => `<li>• ${b}</li>`).join("")}
      </ul>
    `;
    lista.appendChild(boxBloqueos);
  }

  if (advertencias.length) {
    const boxAdvertencias = document.createElement("div");
    boxAdvertencias.className = "premium-card rounded-2xl px-4 py-3 mb-3 border border-amber-500/20";
    boxAdvertencias.innerHTML = `
      <div class="font-semibold text-sm text-amber-600 mb-2">Advertencias</div>
      <ul class="space-y-1 text-sm text-slate-700 dark:text-slate-200">
        ${advertencias.map((a) => `<li>• ${a}</li>`).join("")}
      </ul>
    `;
    lista.appendChild(boxAdvertencias);
  }

  function agruparPorEntidad(items) {
    const grupos = {};
    for (const item of items) {
      const clave = item.fiat || item.entidad || "Otro";
      if (!grupos[clave]) grupos[clave] = [];
      grupos[clave].push(item);
    }
    return grupos;
  }

  function renderItems(items, limite = null) {
    if (!items.length) return "";

    const visibles = limite ? items.slice(0, limite) : items;
    const restantes = limite && items.length > limite ? items.length - limite : 0;

    return `
      <div class="space-y-2">
        ${visibles.map((cambio) => {
          const anterior = cambio.anterior ?? "vacío";
          const nuevo = cambio.nuevo ?? "vacío";
          const claseNuevo = obtenerClaseNuevoValorResumen(cambio);

          return `
            <div class="rounded-xl border border-slate-200/60 dark:border-slate-700/60 px-3 py-2">
              <div class="text-xs font-semibold text-slate-900 dark:text-white">
                ${cambio.entidad} · ${cambio.campo}
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ${cambio.grupo}
              </div>
                <div class="text-sm text-slate-700 dark:text-slate-200 mt-1 break-words">
                  <span class="font-mono">${anterior}</span>
                  <span class="mx-2 opacity-60">→</span>
                  <span class="font-mono font-semibold ${claseNuevo}">${nuevo}</span>
                </div>

                ${
                  cambio.tipo === "precio" && cambio.motorResumen
                    ? `
                      <div class="mt-2 rounded-lg border border-blue-500/10 bg-blue-500/5 px-2.5 py-2 text-xs text-slate-600 dark:text-slate-300">
                        <span class="font-semibold text-blue-700 dark:text-blue-300">Motor:</span>
                        ${cambio.motorResumen}
                      </div>
                    `
                    : ""
                }
            </div>
          `;
        }).join("")}
        ${restantes > 0 ? `
          <div class="text-xs text-slate-500 dark:text-slate-400">
            Y ${restantes} cambio(s) más…
          </div>
        ` : ""}
      </div>
    `;
  }

  function renderSeccion(titulo, items, opts = {}) {
    if (!items.length) return "";

    let contenido = "";

    if (opts.agruparPorEntidad) {
      const grupos = agruparPorEntidad(items);
      contenido = Object.entries(grupos).map(([entidad, cambiosEntidad]) => `
        <div class="rounded-xl border border-slate-200/50 dark:border-slate-700/50 px-3 py-3">
          <div class="text-xs font-semibold text-slate-900 dark:text-white mb-2">
            ${entidad} (${cambiosEntidad.length})
          </div>
          ${renderItems(cambiosEntidad)}
        </div>
      `).join("");
    } else {
      contenido = renderItems(items, opts.limite || null);
    }

    const bloque = document.createElement("div");
    bloque.className = "premium-card rounded-2xl px-4 py-3 mb-3";
    bloque.innerHTML = `
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
        ${titulo} (${items.length})
      </div>
      <div class="space-y-2">
        ${contenido}
      </div>
    `;
    lista.appendChild(bloque);
  }

  renderSeccion("Precios", cambiosPrecios, { agruparPorEntidad: true });
  renderSeccion("Referencias", cambiosReferencias);
  renderSeccion("Márgenes", cambiosMargenes, { limite: 20 });
  renderSeccion("Operación pública", cambiosOperacion);
  renderSeccion("Sistema", cambiosSistema);

  renderSeccion("Cruces · Hacia Venezuela", crucesHaciaVenezuela, { limite: 10 });
  renderSeccion("Cruces · Desde Venezuela", crucesDesdeVenezuela, { limite: 10 });
  renderSeccion("Cruces · Otros", crucesOtros, { limite: 10 });

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  if (timerResumenCambios) {
    clearTimeout(timerResumenCambios);
    timerResumenCambios = null;
  }

  if (autoClose) {
    const duracion = calcularDuracionResumenCambios(cambios, {
      tieneAdvertencias: advertencias.length > 0,
      tieneBloqueos: bloqueos.length > 0,
    });

    if (duracion > 0) {
      timerResumenCambios = setTimeout(() => {
        cerrarResumenCambios();
      }, duracion);
    }
  }
}

// =====================================================
// VALIDACIONES / ANALISIS DE GUARDADO
// =====================================================
function validarDatosAntesDeGuardar() {
  const bloqueos = [];
  const advertencias = [];

  for (const p of paises) {
    const fiat = p.fiat;
    const datos = datosPaises?.[fiat];

    if (!datos) {
      bloqueos.push(`Falta configurar ${fiat}.`);
      continue;
    }

    const compra = Number(datos.compra);
    const venta = Number(datos.venta);

    if (!Number.isFinite(compra) || compra <= 0) {
      bloqueos.push(`Compra inválida en ${fiat}.`);
    }

    if (!Number.isFinite(venta) || venta <= 0) {
      bloqueos.push(`Venta inválida en ${fiat}.`);
    }
  }

  const usd = normalizarNumeroComparable(referenciasExternas?.bcv?.usd);
  const eur = normalizarNumeroComparable(referenciasExternas?.bcv?.eur);

  if (referenciasExternas?.bcv?.manual) {
    if (usd == null) bloqueos.push("BCV USD manual inválido.");
    if (eur == null) bloqueos.push("BCV EUR manual inválido.");
  }

  return { bloqueos, advertencias };
}

function detectarAdvertenciasPorCambios(cambios = []) {
  const advertencias = [];

  for (const cambio of cambios) {
    if (cambio.tipo !== "precio") continue;

    const pct = calcularVariacionPct(cambio.anterior, cambio.nuevo);
    if (!Number.isFinite(pct)) continue;

    const absPct = Math.abs(pct);

    if (absPct >= 15) {
      advertencias.push(
        `${cambio.entidad} ${cambio.campo} cambió ${pct > 0 ? "+" : ""}${pct.toFixed(2)}%.`
      );
    }
  }

  if (cambios.length >= 10) {
    advertencias.push(`Hay ${cambios.length} cambios en este guardado. Revísalos con cuidado.`);
  }

  return advertencias;
}

function limpiarQuoteMetaParaSnapshot(meta = {}) {
  const limpio = {};

  for (const p of paises) {
    const fiat = p.fiat;
    const item = meta?.[fiat];

    if (!item || typeof item !== "object") continue;

    limpio[fiat] = {};

    for (const campo of ["compra", "venta"]) {
      const sideMeta = item?.[campo];
      if (!sideMeta) continue;

      const audit = sideMeta.audit || {};

      const provider = sideMeta.provider || null;
      const esPtax = provider === "ptax";

      limpio[fiat][campo] = {
        fiat,
        campo,
        tradeType: sideMeta.tradeType || (campo === "compra" ? "BUY" : "SELL"),
        precio: Number.isFinite(Number(sideMeta.precio))
          ? Number(sideMeta.precio)
          : null,
        provider,
        source: sideMeta.source || null,
        stale: !!sideMeta.stale,
        fallback: !!sideMeta.fallback,
        fallback_reason: sideMeta.fallback_reason || null,
        aggregation: esPtax ? null : audit.aggregation || null,
        raw_count: esPtax
          ? null
          : Number.isFinite(Number(audit.raw_count))
            ? Number(audit.raw_count)
            : null,
        used_count: esPtax
          ? null
          : Number.isFinite(Number(audit.used_count))
            ? Number(audit.used_count)
            : null,
        trimLowest: esPtax
          ? null
          : Number.isFinite(Number(audit.trimLowest))
            ? Number(audit.trimLowest)
            : 0,
        trimHighest: esPtax
          ? null
          : Number.isFinite(Number(audit.trimHighest))
            ? Number(audit.trimHighest)
            : 0,
        transAmount: esPtax
          ? null
          : Number.isFinite(Number(audit.transAmount))
            ? Number(audit.transAmount)
            : null,
        payTypes: esPtax
          ? []
          : Array.isArray(audit.payTypes)
            ? audit.payTypes.map(String)
            : [],
        captured_at: sideMeta.captured_at || new Date().toISOString(),
      };
    }

    if (!Object.keys(limpio[fiat]).length) {
      delete limpio[fiat];
    }
  }

  return limpio;
}

function obtenerQuoteMetaSnapshot() {
  const metaActual = limpiarQuoteMetaParaSnapshot(metadataCotizacionesMotor || {});
  const metaPrevia = snapshotPrevio?.quoteMeta || {};

  return {
    ...(metaPrevia || {}),
    ...(metaActual || {}),
    updated_at: new Date().toISOString(),
  };
}

function obtenerSystemConfigActualComparable() {
  return {
    pollingSeconds: Number.isFinite(Number(pollingMs))
      ? Math.round(Number(pollingMs) / 1000)
      : 60,
  };
}

function obtenerSystemConfigPrevioComparable() {
  const cfg = snapshotPrevio?.systemConfig || {};

  return {
    pollingSeconds: Number.isFinite(Number(cfg?.pollingSeconds))
      ? Math.round(Number(cfg.pollingSeconds))
      : 60,
  };
}

function obtenerCambiosSistema() {
  const actual = obtenerSystemConfigActualComparable();
  const previo = obtenerSystemConfigPrevioComparable();

  const cambios = [];

  if (actual.pollingSeconds !== previo.pollingSeconds) {
    cambios.push({
      tipo: "sistema",
      grupo: "Sistema",
      entidad: "Polling",
      campo: "intervalo",
      anterior: `${previo.pollingSeconds}s`,
      nuevo: `${actual.pollingSeconds}s`,
    });
  }

  return cambios;
}

function construirSnapshotAGuardar() {
  const ahoraIso = new Date().toISOString();
  const publicConfig = obtenerPublicConfigActualComparable();
  const systemConfig = obtenerSystemConfigActualComparable();
  const quoteMeta = obtenerQuoteMetaSnapshot();

  return {
    ...datosPaises,
    cruces: calcularTodosLosCruces(
      datosPaises,
      asegurarMapaCompletoMargenes(5, margenesCruce || {})
    ),
    margenesCruce,
    referencias: referenciasExternas,
    publicConfig,
    systemConfig,
    quoteMeta,
    timestamp: ahoraIso,
  };
}

function obtenerPublicConfigActualComparable() {
  try {
    const cfg = leerOperacionPublicaDesdeUI();

    return {
      calculatorState: cfg?.calculatorState || "open",
      message: (cfg?.message || "").trim(),
      weeklySchedule: cfg?.weeklySchedule || {},
    };
  } catch {
    return {
      calculatorState: "open",
      message: "",
      weeklySchedule: {},
    };
  }
}

function obtenerPublicConfigPrevioComparable() {
  const cfg = snapshotPrevio?.publicConfig || {};

  return {
    calculatorState: cfg?.calculatorState || "open",
    message: (cfg?.message || "").trim(),
    weeklySchedule: cfg?.weeklySchedule || {},
  };
}

function obtenerCambiosOperacionPublica() {
  const actual = obtenerPublicConfigActualComparable();
  const previo = obtenerPublicConfigPrevioComparable();

  const cambios = [];

  if (actual.calculatorState !== previo.calculatorState) {
    cambios.push({
      tipo: "operacion",
      grupo: "Operación pública",
      entidad: "Calculadora pública",
      campo: "estado",
      anterior: previo.calculatorState,
      nuevo: actual.calculatorState,
    });
  }

  if (actual.message !== previo.message) {
    cambios.push({
      tipo: "operacion",
      grupo: "Operación pública",
      entidad: "Mensaje público",
      campo: "mensaje",
      anterior: previo.message || "vacío",
      nuevo: actual.message || "vacío",
    });
  }

  const dias = [
    ["monday", "Lunes"],
    ["tuesday", "Martes"],
    ["wednesday", "Miércoles"],
    ["thursday", "Jueves"],
    ["friday", "Viernes"],
    ["saturday", "Sábado"],
    ["sunday", "Domingo"],
  ];

  for (const [key, label] of dias) {
    const a = actual.weeklySchedule?.[key] || {};
    const p = previo.weeklySchedule?.[key] || {};

    const activoA = !!a.active;
    const activoP = !!p.active;

    if (activoA !== activoP) {
      cambios.push({
        tipo: "operacion",
        grupo: "Operación pública",
        entidad: label,
        campo: "activo",
        anterior: activoP ? "sí" : "no",
        nuevo: activoA ? "sí" : "no",
      });
    }

    const rangoA = `${a.from || "--"} → ${a.to || "--"}`;
    const rangoP = `${p.from || "--"} → ${p.to || "--"}`;

    if (rangoA !== rangoP) {
      cambios.push({
        tipo: "operacion",
        grupo: "Operación pública",
        entidad: label,
        campo: "horario",
        anterior: rangoP,
        nuevo: rangoA,
      });
    }
  }

  return cambios;
}

function parsearClaveCruce(clave = "") {
  const [origen, destino] = String(clave).split("-");
  return { origen: origen || "", destino: destino || "" };
}

function normalizarCruceComparable(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;

  if (n >= 10) return +n.toFixed(1);
  if (n >= 1) return +n.toFixed(2);
  if (n >= 0.01) return +n.toFixed(3);
  if (n >= 0.001) return +n.toFixed(4);
  if (n >= 0.00099) return +n.toFixed(5);
  return +n.toFixed(6);
}

function obtenerCambiosCrucesImpactados() {
  const actual = crucesRenderActuales || {};
  const previo = snapshotPrevio?.cruces || {};
  const claves = new Set([
    ...Object.keys(actual || {}),
    ...Object.keys(previo || {}),
  ]);

  const cambios = [];

  for (const clave of claves) {
    const anterior = normalizarCruceComparable(previo[clave]);
    const nuevo = normalizarCruceComparable(actual[clave]);

    if (anterior === nuevo) continue;

    const { origen, destino } = parsearClaveCruce(clave);

    let subtipo = "otros";
    if (destino === "VES") subtipo = "hacia_venezuela";
    else if (origen === "VES") subtipo = "desde_venezuela";

    cambios.push({
      tipo: "cruce",
      subtipo,
      grupo: "Cruces impactados",
      entidad: `${origen} → ${destino}`,
      campo: "tasa",
      anterior: anterior ?? "vacío",
      nuevo: nuevo ?? "vacío",
      origen,
      destino,
      clave,
    });
  }

  return cambios;
}

function analizarGuardado() {
  leerPreciosDesdeInputs();
  sincronizarReferenciasDesdeInputs();
  margenesCruce = asegurarMapaCompletoMargenes(5, borradorMargenesCruce || {});

    crucesRenderActuales = calcularTodosLosCruces(datosPaises, margenesCruce);

    escribirCruces();

  const baseActual = construirBaseComparableActual();
  const basePrevia = construirBaseComparablePrevia();
  const cambios = [
    ...obtenerCambiosDatos(baseActual, basePrevia),
    ...obtenerCambiosReferencias(baseActual, basePrevia),
    ...obtenerCambiosMargenes(baseActual, basePrevia),
    ...obtenerCambiosOperacionPublica(),
    ...obtenerCambiosSistema(),
    ...obtenerCambiosCrucesImpactados(),
  ];

  const { bloqueos, advertencias } = validarDatosAntesDeGuardar();
  const advertenciasCambios = detectarAdvertenciasPorCambios(cambios);

  const advertenciasFinales = [...advertencias, ...advertenciasCambios];
  const resumen = resumirCambios(cambios);
  const hayCambios = cambios.length > 0;

  return {
    hayCambios,
    cambios,
    resumen,
    bloqueos,
    advertencias: advertenciasFinales,
    snapshotAGuardar: construirSnapshotAGuardar(),
    baseActual,
    basePrevia,
  };
}

// =====================================================
// GUARDADO / CAMBIOS
// =====================================================
function restaurarBorradorCompleto() {
  datosPaises = {};
  for (const p of paises) {
    const sp = snapshotPrevio?.[p.fiat] || {};
    datosPaises[p.fiat] = {
      compra: Number.isFinite(sp.compra) ? sp.compra : null,
      venta: Number.isFinite(sp.venta) ? sp.venta : null,
    };
  }

  referenciasExternas = snapshotPrevio?.referencias
    ? JSON.parse(JSON.stringify(snapshotPrevio.referencias))
    : referenciasExternas;

  margenesCruce = asegurarMapaCompletoMargenes(5, snapshotPrevio?.margenesCruce || {});
  resetearBorradorMargenesDesdeAplicado();
  limpiarBorradorEdicionMasiva();

  renderReferencias();
  renderTarjetasPaises(modoEdicionActivo);
  renderPerfilesMargenes();
  renderGestorMasivoMargenes();

  crucesBaseHistorica = { ...(snapshotPrevio?.cruces || {}) };
  crucesRenderActuales = calcularTodosLosCruces(datosPaises, margenesCruce);
  crucesAntesVisibles = { ...(snapshotCrucesAntesVisibles || crucesBaseHistorica || {}) };

  fijarBaseMonitoreoCruces(
    snapshotPrevio?.cruces || {},
    snapshotPrevio?.margenesCruce || {}
  );

  renderResumenBorrador();
  escribirCruces();
  renderMonitoreo();
  mostrarAdvertenciaPendiente(false);
  limpiarTodosLosPendientes();

  mostrarToast("✅ Borrador cancelado");
}