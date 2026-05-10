// main.js — ByteTransfer Admin Premium v2
"use strict";

console.log("✅ Admin premium cargado");

// =====================================================
// ESTADO
// =====================================================
let paises = [
  { fiat: "VES", nombre: "Venezuela", flag: "VE", emoji: "VE" },
  { fiat: "ARS", nombre: "Argentina", flag: "AR", emoji: "AR" },
  { fiat: "COP", nombre: "Colombia", flag: "CO", emoji: "CO" },
  { fiat: "PEN", nombre: "Perú", flag: "PE", emoji: "PE" },
  { fiat: "CLP", nombre: "Chile", flag: "CL", emoji: "CL" },
  { fiat: "MXN", nombre: "México", flag: "MX", emoji: "MX" },
  { fiat: "BRL", nombre: "Brasil", flag: "BR", emoji: "BR" },
];

function normalizarMonedaConfig(c) {
  return {
    fiat: String(c.code || c.fiat || "").toUpperCase(),
    nombre: c.name || c.nombre || c.code || "",
    flag: c.flag || "",
    emoji: c.flag || c.code || "",
    active: c.active !== false,
    order: Number(c.order) || 999,
    supportsBuy: c.supportsBuy !== false,
    supportsSell: c.supportsSell !== false,
  };
}

async function cargarMonedasConfiguradas() {
  try {
    const res = await fetch("/api/currencies", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const lista = Array.isArray(json?.currencies) ? json.currencies : [];

    const normalizadas = lista
      .map(normalizarMonedaConfig)
      .filter((c) => c.fiat && c.active)
      .sort((a, b) => a.order - b.order);

    if (normalizadas.length) {
      paises = normalizadas;
      console.log("✅ Monedas cargadas desde backend:", paises.map((p) => p.fiat));
    }
  } catch (e) {
    console.warn("⚠️ No se pudieron cargar monedas desde backend. Usando fallback local:", e.message);
  }
}

const reglasVisualesCruces = {
  "COP-VES": {
    invertForCustomer: true,
    label: "COP → VES",
    detalle: "Vista comercial Colombia",
  },
};

function obtenerReglaVisualCruce(origen, destino) {
  return reglasVisualesCruces?.[`${origen}-${destino}`] || null;
}

function obtenerTasaVisibleCruce(origen, destino, tasaInterna) {
  const n = Number(tasaInterna);
  if (!Number.isFinite(n) || n <= 0) return null;

  const regla = obtenerReglaVisualCruce(origen, destino);

  if (regla?.invertForCustomer) {
    return 1 / n;
  }

  return n;
}

function obtenerEtiquetaVisualCruce(origen, destino) {
  const regla = obtenerReglaVisualCruce(origen, destino);
  return regla?.label || `${origen} → ${destino}`;
}

let referenciasExternas = null;
let datosPaises = {};
let metadataCotizacionesMotor = {};
let snapshotPrevio = {};
let crucesAnteriores = {};
let modoEdicionActivo = false;

let margenesCruce = {};
let borradorMargenesCruce = {};
let limiteCrucesVisible = 24;
let crucesRenderActuales = {};
let crucesAntesVisibles = {};
let snapshotCrucesAntesVisibles = {};
let crucesBaseHistorica = {};
let baseMonitoreoCruces = {};
let baseMonitoreoMargenes = {};

const STORAGE_KEY_PERFILES = "BT_PERFILES_MARGENES";
let perfilesMargenes = {};

let filtroPais = null;
let rolVista = "origen";

let llamadasPendientes = 0;
let timerAdvertencia = null;

let mercadoPaises = {};
let referenciasMercado = null;
let pollingActivo = true;
let pollingInterval = null;
let pollingMs = 180000;
let ultimoTick = null;

let filtroMasivoOrigen = "";
let filtroMasivoDestino = "";
let borradorEdicionMasiva = {};

let vistaPrincipalActiva = "monitoreo";
let configTabActiva = "precios";
let guardadoEnCurso = false;
let timerBotonGuardadoOk = null;
let ultimoResumenGuardado = null;
let timerBotonUltimosCambiosPremium = null;
let timerTopbarHumana = null;
let timerResumenBorradorDebounce = null;
let timerEstadoGuardadoDebounce = null;

// =====================================================
// TOPBAR / CAMBIOS
// =====================================================
function mostrarAdvertenciaPendiente(mostrar = true) {
  const adv = document.getElementById("advertencia-pendiente");
  if (adv) adv.classList.toggle("hidden", !mostrar);

  actualizarBotonCancelarBorrador();
  actualizarTopbar();
  actualizarEstadoGuardadoUI();
}

function fijarBaseMonitoreoCruces(crucesBase = {}, margenesBase = {}) {
  baseMonitoreoCruces = { ...(crucesBase || {}) };
  baseMonitoreoMargenes = { ...(margenesBase || {}) };
}

function actualizarTopbar() {
  const ultima = document.getElementById("ultima-actualizacion");

  if (ultima) {
    const fechaBase = snapshotPrevio?.guardado_en || snapshotPrevio?.timestamp || null;

    if (fechaBase) {
      const relativo = obtenerTextoTiempoRelativo(fechaBase);
      const exacto = formatearFechaHoraCorta(fechaBase);

      ultima.textContent = relativo;
      ultima.title = `Último guardado: ${exacto}`;
    } else {
      ultima.textContent = "—";
      ultima.title = "";
    }
  }

  actualizarEstadoGuardadoUI();
}

function hayCambiosDePreciosEnInputs() {
  for (const p of paises) {
    const fiat = p.fiat;
    const compraInput = parseFloat(
      document.querySelector(`input[data-fi="${fiat}"][data-tipo="compra"]`)?.value
    );
    const ventaInput = parseFloat(
      document.querySelector(`input[data-fi="${fiat}"][data-tipo="venta"]`)?.value
    );

    const compraActual = Number(datosPaises?.[fiat]?.compra);
    const ventaActual = Number(datosPaises?.[fiat]?.venta);

    if (Number.isFinite(compraInput) && compraInput !== compraActual) return true;
    if (Number.isFinite(ventaInput) && ventaInput !== ventaActual) return true;
  }
  return false;
}

function obtenerEstadoGuardadoUI() {
  try {
    const analisis = analizarGuardado();

    if (analisis.bloqueos.length) {
      return {
        estado: "revision",
        texto: "Revisión requerida",
        hayCambios: analisis.hayCambios,
        bloqueos: analisis.bloqueos.length,
        advertencias: analisis.advertencias.length,
      };
    }

    if (analisis.hayCambios) {
      return {
        estado: "pendiente",
        texto: "Cambios pendientes",
        hayCambios: true,
        bloqueos: 0,
        advertencias: analisis.advertencias.length,
      };
    }

    return {
      estado: "guardado",
      texto: "Todo guardado",
      hayCambios: false,
      bloqueos: 0,
      advertencias: 0,
    };
  } catch {
    return {
      estado: "pendiente",
      texto: "Cambios pendientes",
      hayCambios: true,
      bloqueos: 0,
      advertencias: 0,
    };
  }
}

function actualizarEstadoGuardadoUI() {
  const badgeEstado = document.getElementById("badge-estado-global");
  const btnGuardar = document.getElementById("btn-guardar-ajustes");
  const adv = document.getElementById("advertencia-pendiente");

  if (guardadoEnCurso) {
    if (adv) adv.classList.remove("hidden");

    if (badgeEstado) {
      badgeEstado.textContent = "Guardando...";
      badgeEstado.className =
        "inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/15";
    }

    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.textContent = "Guardando...";
      btnGuardar.classList.remove("opacity-60");
    }

    actualizarBotonCancelarBorrador();
    return;
  }

  const estado = obtenerEstadoGuardadoUI();

  if (estado.hayCambios) {
    ocultarBotonUltimosCambios();
  }

  if (adv) {
    adv.classList.toggle("hidden", estado.estado === "guardado");
  }

  if (badgeEstado) {
    if (estado.estado === "revision") {
      badgeEstado.textContent = "Revisión requerida";
      badgeEstado.className =
        "inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/15";
    } else if (estado.estado === "pendiente") {
      badgeEstado.textContent = "Cambios pendientes";
      badgeEstado.className =
        "inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/15";
    } else {
      badgeEstado.textContent = "Todo guardado";
      badgeEstado.className =
        "inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/15";
    }
  }

  if (btnGuardar) {
    btnGuardar.disabled = !estado.hayCambios;

    if (estado.estado === "revision") {
      btnGuardar.textContent = "Revisión requerida";
      btnGuardar.classList.remove("opacity-60");
    } else if (estado.estado === "pendiente") {
      btnGuardar.textContent = "Guardar cambios";
      btnGuardar.classList.remove("opacity-60");
    } else {
      btnGuardar.textContent = "Guardar cambios";
      btnGuardar.classList.add("opacity-60");
    }
  }
}

function actualizarBotonCancelarBorrador() {
  const btnCancelar = document.getElementById("btn-cancelar-borrador");
  const adv = document.getElementById("advertencia-pendiente");
  if (!btnCancelar) return;

  if (guardadoEnCurso) {
    btnCancelar.disabled = true;
    btnCancelar.classList.add("hidden", "opacity-60");
    return;
  }

  const hayPendienteVisible = !!adv && !adv.classList.contains("hidden");

  if (hayPendienteVisible) {
    btnCancelar.disabled = false;
    btnCancelar.classList.remove("hidden", "opacity-60");
  } else {
    btnCancelar.disabled = true;
    btnCancelar.classList.add("hidden", "opacity-60");
  }
}

function limpiarTimerBotonGuardadoOk() {
  if (timerBotonGuardadoOk) {
    clearTimeout(timerBotonGuardadoOk);
    timerBotonGuardadoOk = null;
  }
}

function setEstadoBotonGuardar(tipo = "normal") {
  const btnGuardar = document.getElementById("btn-guardar-ajustes");
  if (!btnGuardar) return;

  limpiarTimerBotonGuardadoOk();

  if (tipo === "guardando") {
    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardando...";
    btnGuardar.classList.remove("opacity-60");
    return;
  }

  if (tipo === "guardado") {
    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardado ✓";
    btnGuardar.classList.remove("opacity-60");

    timerBotonGuardadoOk = setTimeout(() => {
      actualizarEstadoGuardadoUI();
    }, 1400);
    return;
  }

  actualizarEstadoGuardadoUI();
}

function ensureBotonUltimosCambios() {
  let btn = document.getElementById("btn-ver-ultimos-cambios");
  if (btn) return btn;

  const btnGuardar = document.getElementById("btn-guardar-ajustes");
  if (!btnGuardar || !btnGuardar.parentElement) return null;

  btn = document.createElement("button");
  btn.id = "btn-ver-ultimos-cambios";
  btn.type = "button";
  btn.textContent = "Ver últimos cambios";
  btn.className =
    "hidden ml-2 inline-flex items-center justify-center gap-2 text-center px-3 py-2 min-w-[230px] rounded-xl text-xs font-medium bg-slate-900/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-900/10 dark:hover:bg-white/15 transition-all duration-300";

  btn.addEventListener("click", () => {
    if (!ultimoResumenGuardado?.cambios?.length) {
      mostrarToast("⚠️ No hay un resumen guardado reciente");
      return;
    }

    mostrarResumenCambios(ultimoResumenGuardado.cambios, {
      advertencias: ultimoResumenGuardado.advertencias || [],
      bloqueos: [],
      autoClose: false,
    });
  });

  btnGuardar.insertAdjacentElement("afterend", btn);
  return btn;
}

function mostrarBotonUltimosCambios() {
  const btn = ensureBotonUltimosCambios();
  if (!btn) return;

  if (timerBotonUltimosCambiosPremium) {
    clearTimeout(timerBotonUltimosCambiosPremium);
    timerBotonUltimosCambiosPremium = null;
  }

  const hora = formatearHoraCorta(ultimoResumenGuardado?.guardadoEn);

  btn.innerHTML = hora
    ? `<span aria-hidden="true">✓</span><span>Ver últimos cambios · ${hora}</span>`
    : `<span aria-hidden="true">✓</span><span>Ver últimos cambios</span>`;

  limpiarEstadoPremiumBotonUltimosCambios();
  btn.classList.remove("hidden");

  btn.classList.remove(
    "bg-slate-900/5",
    "dark:bg-white/10",
    "text-slate-700",
    "dark:text-slate-200",
    "border-slate-200/70",
    "dark:border-slate-700/70"
  );

  btn.classList.add(
    "bg-emerald-500/10",
    "text-emerald-700",
    "dark:text-emerald-300",
    "border-emerald-500/20"
  );

  timerBotonUltimosCambiosPremium = setTimeout(() => {
    if (!btn.classList.contains("hidden")) {
      btn.classList.remove(
        "bg-emerald-500/10",
        "text-emerald-700",
        "dark:text-emerald-300",
        "border-emerald-500/20"
      );

      btn.classList.add(
        "bg-slate-900/5",
        "dark:bg-white/10",
        "text-slate-700",
        "dark:text-slate-200",
        "border-slate-200/70",
        "dark:border-slate-700/70"
      );
    }

    timerBotonUltimosCambiosPremium = null;
  }, 2600);
}

function limpiarEstadoPremiumBotonUltimosCambios() {
  const btn = document.getElementById("btn-ver-ultimos-cambios");
  if (!btn) return;

  btn.className =
    "hidden ml-2 inline-flex items-center justify-center gap-2 text-center px-3 py-2 min-w-[230px] rounded-xl text-xs font-medium bg-slate-900/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-900/10 dark:hover:bg-white/15 transition-all duration-300";
}

function ocultarBotonUltimosCambios() {
  const btn = document.getElementById("btn-ver-ultimos-cambios");
  if (!btn) return;

  if (timerBotonUltimosCambiosPremium) {
    clearTimeout(timerBotonUltimosCambiosPremium);
    timerBotonUltimosCambiosPremium = null;
  }

  limpiarEstadoPremiumBotonUltimosCambios();
  btn.classList.add("hidden");
}

function formatearFechaHoraCorta(fechaIso) {
  if (!fechaIso) return "—";

  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "—";

  return fecha.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obtenerTextoTiempoRelativo(fechaIso) {
  if (!fechaIso) return "—";

  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "—";

  const ahora = new Date();
  const diffMs = ahora - fecha;
  const diffSeg = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSeg / 60);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffSeg < 10) return "Guardado hace unos segundos";
  if (diffSeg < 60) return `Guardado hace ${diffSeg} seg`;
  if (diffMin < 60) return `Guardado hace ${diffMin} min`;
  if (diffHoras < 24) return `Hoy a las ${formatearHoraCorta(fechaIso)}`;
  if (diffDias === 1) return `Ayer a las ${formatearHoraCorta(fechaIso)}`;

  return formatearFechaHoraCorta(fechaIso);
}

function formatearHoraCorta(fechaIso) {
  if (!fechaIso) return "";

  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "";

  return fecha.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function iniciarRefrescoTopbarHumana() {
  if (timerTopbarHumana) {
    clearInterval(timerTopbarHumana);
    timerTopbarHumana = null;
  }

  timerTopbarHumana = setInterval(() => {
    actualizarTopbar();
  }, 30000);
}

function refrescarRevisionDebounced(delay = 120) {
  if (timerResumenBorradorDebounce) {
    clearTimeout(timerResumenBorradorDebounce);
    timerResumenBorradorDebounce = null;
  }

  timerResumenBorradorDebounce = setTimeout(() => {
    renderResumenBorrador();
    timerResumenBorradorDebounce = null;
  }, delay);
}

function refrescarEstadoGuardadoDebounced(delay = 120) {
  if (timerEstadoGuardadoDebounce) {
    clearTimeout(timerEstadoGuardadoDebounce);
    timerEstadoGuardadoDebounce = null;
  }

  timerEstadoGuardadoDebounce = setTimeout(() => {
    actualizarEstadoGuardadoUI();
    timerEstadoGuardadoDebounce = null;
  }, delay);
}