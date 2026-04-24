"use strict";

// =====================================================
// OPERACIÓN PÚBLICA
// =====================================================
async function guardarOperacionPublicaSeparada() {
  const publicConfig = leerOperacionPublicaDesdeUI();

  const snapshotBase = {
    ...snapshotPrevio,
    publicConfig,
    timestamp: new Date().toISOString(),
  };

  const ok = await guardarSnapshot(snapshotBase);
  if (!ok) return false;

  await cargarSnapshot();
  renderEstadoOperacionPublicaActual();
  mostrarToast("✅ Operación pública aplicada");
  return true;
}

function obtenerPublicConfigDesdeSnapshot() {
  return snapshotPrevio?.publicConfig || {
    calculatorState: "open",
    message: "",
    weeklySchedule: {
      monday: { active: true, from: "11:00", to: "22:00" },
      tuesday: { active: true, from: "11:00", to: "22:00" },
      wednesday: { active: true, from: "11:00", to: "22:00" },
      thursday: { active: true, from: "11:00", to: "22:00" },
      friday: { active: true, from: "11:00", to: "22:00" },
      saturday: { active: true, from: "11:00", to: "19:00" },
      sunday: { active: false, from: "", to: "" },
    },
  };
}

function cargarOperacionPublica() {
  const cfg = obtenerPublicConfigDesdeSnapshot();

  const estado = document.getElementById("config-calculadora-estado");
  const mensaje = document.getElementById("config-calculadora-mensaje");

  if (estado) estado.value = cfg.calculatorState || "open";
  if (mensaje) mensaje.value = cfg.message || "";

  const filas = document.querySelectorAll("#config-horarios-body tr");
  const keys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  filas.forEach((tr, idx) => {
    const key = keys[idx];
    const item = cfg.weeklySchedule?.[key] || { active: false, from: "", to: "" };

    const checkbox = tr.querySelector('input[type="checkbox"]');
    const times = tr.querySelectorAll('input[type="time"]');

    if (checkbox) checkbox.checked = !!item.active;
    if (times[0]) times[0].value = item.from || "";
    if (times[1]) times[1].value = item.to || "";
  });
}

function leerOperacionPublicaDesdeUI() {
  const estado = document.getElementById("config-calculadora-estado")?.value || "open";
  const mensaje = document.getElementById("config-calculadora-mensaje")?.value || "";

  const filas = document.querySelectorAll("#config-horarios-body tr");
  const keys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const weeklySchedule = {};

  filas.forEach((tr, idx) => {
    const key = keys[idx];
    const checkbox = tr.querySelector('input[type="checkbox"]');
    const times = tr.querySelectorAll('input[type="time"]');

    weeklySchedule[key] = {
      active: !!checkbox?.checked,
      from: times[0]?.value || "",
      to: times[1]?.value || "",
    };
  });

  return {
    calculatorState: estado,
    message: mensaje.trim(),
    weeklySchedule,
  };
}

function renderEstadoOperacionPublicaActual() {
  const el = document.getElementById("config-operacion-estado-actual");
  if (!el) return;

  const cfg = snapshotPrevio?.publicConfig || null;

  if (!cfg) {
    el.textContent = "Usando configuración por defecto";
    return;
  }

  const estado = cfg.calculatorState || "open";
  const mensaje = cfg.message?.trim();

  let texto = estado === "closed" ? "Cerrada" : "Abierta";

  if (mensaje) {
    texto += ` • ${mensaje}`;
  }

  el.textContent = texto;
}

function obtenerZonaUsuario() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
  } catch {
    return "Local";
  }
}

function renderInfoZonaHoraria() {
  const el = document.getElementById("config-zona-info");
  if (!el) return;

  const zonaLocal = obtenerZonaUsuario();

  el.innerHTML = `
    <div class="space-y-1 text-sm">
      <div><strong>Horario del sistema:</strong> Argentina (UTC-03:00)</div>
      <div><strong>Tu zona actual:</strong> ${zonaLocal}</div>
      <div class="text-slate-500 dark:text-slate-400">
        Ejemplo: 11:00 AR = 10:00 VE
      </div>
    </div>
  `;
}

function bindOperacionPublicaDraftListeners() {
const refrescarRevision = () => {
  try {
    mostrarAdvertenciaPendiente(true);
    refrescarRevisionDebounced();
    refrescarEstadoGuardadoDebounced();
  } catch {}
};

  document.getElementById("config-calculadora-estado")?.addEventListener("change", refrescarRevision);
  document.getElementById("config-calculadora-mensaje")?.addEventListener("input", refrescarRevision);

  document.querySelectorAll("#config-horarios-body input").forEach((el) => {
    const tipo = (el.type || "").toLowerCase();
    const evento = tipo === "checkbox" ? "change" : "input";
    el.addEventListener(evento, refrescarRevision);
  });
}