"use strict";

// =====================================================
// NAVEGACIÓN
// =====================================================
function activarVistaPrincipal(tab) {
  vistaPrincipalActiva = tab;

  const vistas = {
    monitoreo: document.getElementById("vista-monitoreo"),
    configuracion: document.getElementById("vista-configuracion"),
    cruces: document.getElementById("vista-cruces"),
    monedas: document.getElementById("vista-monedas"),
    historial: document.getElementById("vista-historial"),
  };

  Object.entries(vistas).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("hidden", k !== tab);
  });

  const map = {
    monitoreo: "tab-main-monitoreo",
    configuracion: "tab-main-configuracion",
    cruces: "tab-main-cruces",
    monedas: "tab-main-monedas",
    historial: "tab-main-historial",
  };

  Object.entries(map).forEach(([k, id]) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    const activo = k === tab;
    btn.className = activo
      ? "tab-chip px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900"
      : "tab-chip px-4 py-2.5 rounded-xl text-sm font-medium bg-transparent text-slate-600 dark:text-slate-300";
  });
}

function activarConfigTab(tab) {
  configTabActiva = tab;

  const panels = {
    precios: document.getElementById("config-panel-precios"),
    margenes: document.getElementById("config-panel-margenes"),
    sistema: document.getElementById("config-panel-sistema"),
    operacion: document.getElementById("config-panel-operacion"),
  };

  Object.entries(panels).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("hidden", k !== tab);
  });

  const map = {
    precios: "tab-config-precios",
    margenes: "tab-config-margenes",
    sistema: "tab-config-sistema",
    operacion: "tab-config-operacion",
  };

  Object.entries(map).forEach(([k, id]) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    const activo = k === tab;
    btn.className = activo
      ? "subtab-chip px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900"
      : "subtab-chip px-4 py-2.5 rounded-xl text-sm font-medium bg-transparent text-slate-600 dark:text-slate-300";
  });
}