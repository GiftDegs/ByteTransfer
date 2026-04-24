"use strict";

// =====================================================
// MÁRGENES
// =====================================================
function crearMapaMargenes(valorBase = 5) {
  const mapa = {};
  for (const origenObj of paises) {
    for (const destinoObj of paises) {
      const origen = origenObj.fiat;
      const destino = destinoObj.fiat;
      if (origen === destino) continue;
      mapa[`${origen}-${destino}`] = Number(valorBase);
    }
  }
  return mapa;
}

function asegurarMapaCompletoMargenes(valorFallback = 5, origenMapa = null) {
  const mapaBase = crearMapaMargenes(valorFallback);
  const fuente = origenMapa || margenesCruce || {};

  for (const [clave, valor] of Object.entries(fuente)) {
    if (Number.isFinite(Number(valor))) {
      mapaBase[clave] = Number(valor);
    }
  }

  return mapaBase;
}

function obtenerMargenAplicable(origen, destino) {
  const clave = `${origen}-${destino}`;
  const valorCruce = margenesCruce?.[clave];
  if (Number.isFinite(Number(valorCruce))) {
    return Number(valorCruce);
  }
  return 5;
}

function resetearBorradorMargenesDesdeAplicado() {
  borradorMargenesCruce = asegurarMapaCompletoMargenes(5, margenesCruce || {});
}

function contarCrucesModificadosBorrador() {
  const baseAplicada = asegurarMapaCompletoMargenes(5, margenesCruce || {});
  const baseBorrador = asegurarMapaCompletoMargenes(5, borradorMargenesCruce || {});
  let total = 0;

  for (const clave of Object.keys(baseBorrador)) {
    if (Number(baseBorrador[clave]) !== Number(baseAplicada[clave])) {
      total++;
    }
  }

  return total;
}

function obtenerDeltaGlobalBorrador() {
  const baseAplicada = asegurarMapaCompletoMargenes(5, margenesCruce || {});
  const baseBorrador = asegurarMapaCompletoMargenes(5, borradorMargenesCruce || {});
  let suma = 0;
  let total = 0;

  for (const clave of Object.keys(baseBorrador)) {
    const a = Number(baseAplicada[clave]);
    const b = Number(baseBorrador[clave]);

    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;

    suma += (b - a);
    total++;
  }

  if (!total) return 0;
  return Number((suma / total).toFixed(2));
}

function renderResumenBorrador() {
  const texto = document.getElementById("resumen-borrador-texto");
  const badge = document.getElementById("resumen-borrador-badge");

  if (!texto || !badge) return;

  try {
    const analisis = analizarGuardado();
    const resumen = analisis.resumen || {
      totalCambios: 0,
      cambiosPrecios: 0,
      cambiosReferencias: 0,
      cambiosMargenes: 0,
      cambiosOperacion: 0,
      cambiosCruces: 0,
      paisesAfectados: 0,
    };

    const bloqueos = analisis.bloqueos || [];
    const advertencias = analisis.advertencias || [];
    const cambios = Array.isArray(analisis.cambios) ? analisis.cambios : [];

    if (!analisis.hayCambios) {
      texto.innerHTML = `
        <div class="text-sm text-slate-600 dark:text-slate-300">
          Sin cambios preparados.
        </div>
      `;
      badge.textContent = "Sin borrador";
      badge.className =
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-900/5 dark:bg-white/10";
      return;
    }

    const cambiosPrecios = cambios.filter((c) => c.tipo === "precio");
    const cambiosReferencias = cambios.filter((c) => c.tipo === "referencia");
    const cambiosMargenes = cambios.filter((c) => c.tipo === "margen");
    const cambiosOperacion = cambios.filter((c) => c.tipo === "operacion");
    const cambiosSistema = cambios.filter((c) => c.tipo === "sistema");
    const cambiosCruces = cambios.filter((c) => c.tipo === "cruce");

    const paisesPrecios = [...new Set(cambiosPrecios.map((c) => c.fiat).filter(Boolean))];
    const refsTocadas = [...new Set(cambiosReferencias.map((c) => c.entidad).filter(Boolean))];

    const lineas = [];

    if (cambiosPrecios.length) {
      lineas.push(`
        <div class="text-xs text-slate-700 dark:text-slate-200">
          <span class="font-semibold">Precios:</span>
          ${cambiosPrecios.length} cambio(s) en ${paisesPrecios.length} país(es)
          ${paisesPrecios.length ? `· ${paisesPrecios.join(", ")}` : ""}
        </div>
      `);
    }

    if (cambiosReferencias.length) {
      lineas.push(`
        <div class="text-xs text-slate-700 dark:text-slate-200">
          <span class="font-semibold">Referencias:</span>
          ${cambiosReferencias.length} cambio(s)
          ${refsTocadas.length ? `· ${refsTocadas.join(", ")}` : ""}
        </div>
      `);
    }

    if (cambiosMargenes.length) {
      lineas.push(`
        <div class="text-xs text-slate-700 dark:text-slate-200">
          <span class="font-semibold">Márgenes:</span>
          ${cambiosMargenes.length} cruce(s) tocado(s)
        </div>
      `);
    }

    if (cambiosOperacion.length) {
      lineas.push(`
        <div class="text-xs text-slate-700 dark:text-slate-200">
          <span class="font-semibold">Operación pública:</span>
          ${cambiosOperacion.length} cambio(s)
        </div>
      `);
    }

    if (cambiosSistema.length) {
  lineas.push(`
    <div class="text-xs text-slate-700 dark:text-slate-200">
      <span class="font-semibold">Sistema:</span>
      ${cambiosSistema.length} cambio(s)
    </div>
  `);
    }

    if (cambiosCruces.length) {
      const haciaVes = cambiosCruces.filter((c) => c.subtipo === "hacia_venezuela").length;
      const desdeVes = cambiosCruces.filter((c) => c.subtipo === "desde_venezuela").length;

      lineas.push(`
        <div class="text-xs text-slate-700 dark:text-slate-200">
          <span class="font-semibold">Cruces impactados:</span>
          ${cambiosCruces.length} total
          · hacia VES: ${haciaVes}
          · desde VES: ${desdeVes}
        </div>
      `);
    }

    const resumenSuperior = `
      <div class="space-y-2">
        <div class="text-sm font-semibold text-slate-900 dark:text-white">
          ${resumen.totalCambios} cambio(s) preparados
        </div>
        <div class="text-xs text-slate-500 dark:text-slate-400">
        ${[
        cambiosPrecios.length ? "Precios" : null,
        cambiosReferencias.length ? "Referencias" : null,
        cambiosMargenes.length ? "Márgenes" : null,
        cambiosOperacion.length ? "Operación pública" : null,
        cambiosSistema.length ? "Sistema" : null,
        cambiosCruces.length ? "Cruces" : null,
        ].filter(Boolean).join(" · ")}
        </div>
      </div>
    `;

    let estadoHtml = "";
    if (bloqueos.length) {
      estadoHtml = `
        <div class="mt-3 rounded-xl border border-red-500/20 px-3 py-2 bg-red-500/5">
          <div class="text-xs font-semibold text-red-600">
            ${bloqueos.length} bloqueo(s). Corrige antes de guardar.
          </div>
        </div>
      `;
      badge.textContent = "Revisión requerida";
      badge.className =
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/15";
    } else if (advertencias.length) {
      estadoHtml = `
        <div class="mt-3 rounded-xl border border-amber-500/20 px-3 py-2 bg-amber-500/5">
          <div class="text-xs font-semibold text-amber-600">
            ${advertencias.length} advertencia(s). Revisa antes de guardar.
          </div>
        </div>
      `;
      badge.textContent = "Revisar";
      badge.className =
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/15";
    } else {
      estadoHtml = `
        <div class="mt-3 rounded-xl border border-emerald-500/20 px-3 py-2 bg-emerald-500/5">
          <div class="text-xs font-semibold text-emerald-600">
            Listo para guardar.
          </div>
        </div>
      `;
      badge.textContent = "Listo para guardar";
      badge.className =
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/15";
    }

    texto.innerHTML = `
      ${resumenSuperior}
      ${estadoHtml}
      <div class="mt-3 space-y-2">
        ${lineas.join("")}
      </div>
    `;
  } catch {
    texto.innerHTML = `
      <div class="text-sm text-slate-600 dark:text-slate-300">
        Preparando borrador...
      </div>
    `;
    badge.textContent = "Borrador";
    badge.className =
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-900/5 dark:bg-white/10";
  }
}