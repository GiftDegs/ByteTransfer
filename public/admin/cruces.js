"use strict";

// =====================================================
// CRUCES
// =====================================================
function calcularTodosLosCruces(baseDatos = datosPaises, baseMargenes = margenesCruce) {
  const resultado = {};

  for (const origenObj of paises) {
    for (const destinoObj of paises) {
      const origen = origenObj.fiat;
      const destino = destinoObj.fiat;

      if (origen === destino) continue;

      const o = baseDatos?.[origen];
      const d = baseDatos?.[destino];

      if (!o || !d) continue;
      if (!Number.isFinite(Number(o.compra)) || Number(o.compra) <= 0) continue;
      if (!Number.isFinite(Number(d.venta)) || Number(d.venta) <= 0) continue;

      const clave = `${origen}-${destino}`;

      const ajuste = Number.isFinite(Number(baseMargenes?.[clave]))
        ? Number(baseMargenes[clave])
        : 5;

      const tasaBase = Number(d.venta) / Number(o.compra);
      const factor = 1 - ajuste / 100;

            const tasaFinal = parseFloat((tasaBase * factor).toFixed(6));
            resultado[clave] = tasaFinal;
          }
        }

  return resultado;
}

function esCruceEspecialVisual(origen, destino) {
  return origen === "COP" && destino === "VES";
}

function obtenerCambioVisualCruce(origen, destino, actual, anterior) {
  const a = Number(actual);
  const b = Number(anterior);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return {
      color: "text-blue-600",
      icono: "•",
    };
  }

  if (a === b) {
    return {
      color: "text-blue-600",
      icono: "•",
    };
  }

  const subio = a > b;
  const invertido = esCruceEspecialVisual(origen, destino);

  const positivo = invertido ? !subio : subio;

  return {
    color: positivo ? "text-green-600" : "text-red-600",
    icono: positivo ? "▲" : "▼",
  };
}

function escribirCruces() {
  const cont = document.getElementById("cruces-container");
  const header = document.getElementById("cruce-encabezado");
  if (!cont) return;

  cont.innerHTML = "";
  cont.className = "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4";

  const activos = new Set(paises.map((p) => p.fiat));

  if (header) {
    header.textContent = filtroPais
      ? (rolVista === "origen"
          ? `Mostrando cruces desde ${filtroPais}`
          : `Mostrando cruces hacia ${filtroPais}`)
      : "Mostrando todos los cruces";
  }

  let renderizados = 0;

  activos.forEach((origen) => {
    activos.forEach((destino) => {
      if (origen === destino) return;

      const o = datosPaises[origen];
      const d = datosPaises[destino];
      if (!o || !d || !o.compra || !d.venta) return;

      if (filtroPais) {
        if (rolVista === "origen" && origen !== filtroPais) return;
        if (rolVista === "destino" && destino !== filtroPais) return;
      }

      const ajuste = obtenerMargenAplicable(origen, destino);
      const clave = `${origen}-${destino}`;
      const tasaFinal = crucesRenderActuales?.[clave];

      if (!Number.isFinite(tasaFinal)) return;

      const anterior =
        crucesAntesVisibles?.[clave] ??
        crucesBaseHistorica?.[clave] ??
        null;

      const tasaVisible = obtenerTasaVisibleCruce(origen, destino, tasaFinal);
      const anteriorVisible = Number.isFinite(Number(anterior))
        ? obtenerTasaVisibleCruce(origen, destino, anterior)
        : null;

      const visual = obtenerCambioVisualCruce(origen, destino, tasaVisible, anteriorVisible);
      const color = visual.color;
      const cambio = visual.icono;

      const tasaAnteriorTxt = Number.isFinite(Number(anteriorVisible))
        ? formatearTasaCruce(anteriorVisible)
        : "—";

      const tasaNuevaTxt = formatearTasaCruce(tasaVisible);
      const etiquetaCruce = obtenerEtiquetaVisualCruce(origen, destino);

      const card = document.createElement("div");
      card.className = "premium-card rounded-2xl p-4";

      card.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="text-xs font-medium text-slate-500 dark:text-slate-400">${etiquetaCruce}</div>
          <div class="text-xs ${color}">${cambio}</div>
        </div>

        <div class="mt-2 text-2xl font-semibold tracking-tight ${color}">
          ${tasaNuevaTxt}
        </div>

        <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Antes: <span class="font-medium">${tasaAnteriorTxt}</span>
        </div>

        <div class="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Margen: ${Number(ajuste).toFixed(2)}%
        </div>
      `;

      if (renderizados < limiteCrucesVisible) {
        cont.appendChild(card);
        renderizados++;
      }
    });
  });
}

// =====================================================
// FILTROS CRUCES
// =====================================================
function initSelectorPaisesCruces() {
  const select = document.getElementById("select-pais-cruces");
  if (!select) return;

  select.innerHTML = `<option value="">Todos</option>`;

  paises.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.fiat;
    opt.textContent = `${p.nombre} (${p.fiat})`;
    select.appendChild(opt);
  });

  select.value = filtroPais || "";

  select.addEventListener("change", () => {
    filtroPais = select.value || null;

    const label = document.getElementById("pais-seleccionado");
    if (label) {
      label.innerText = filtroPais || "Todos";
    }

    escribirCruces();
  });
}

function resetFiltros() {
  filtroPais = null;
  rolVista = "origen";

  const select = document.getElementById("select-pais-cruces");
  if (select) select.value = "";

  escribirCruces();

  const tabO = document.getElementById("tab-origen");
  const tabD = document.getElementById("tab-destino");
  if (tabO) tabO.className = "subtab-chip px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900";
  if (tabD) tabD.className = "subtab-chip px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300";
}