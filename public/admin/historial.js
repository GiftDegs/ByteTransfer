"use strict";

// =====================================================
// HISTORIAL OPERATIVO
// =====================================================
let historialSnapshots = [];
let historialSnapshotSeleccionado = null;
let historialCargado = false;

function formatearFechaHistorial(valor) {
  if (!valor) return "—";

  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatearNumeroHistorial(valor, decimales = 2) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";

  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  });
}

function formatearPctHistorial(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";

  const signo = n > 0 ? "+" : "";
  return `${signo}${n.toFixed(3)}%`;
}

function calcularPromedioHistorial(compra, venta) {
  const c = Number(compra);
  const v = Number(venta);

  if (!Number.isFinite(c) && !Number.isFinite(v)) return null;
  if (Number.isFinite(c) && Number.isFinite(v)) {
    return Number(((c + v) / 2).toFixed(6));
  }

  return Number.isFinite(c) ? c : v;
}

function obtenerPromedioMonedaSnapshot(snapshot, code) {
  return snapshot?.monedas?.[code]?.promedio ?? null;
}

function obtenerLimitePeriodoHistorial() {
  const select = document.getElementById("historial-periodo-select");
  const n = Number(select?.value || 20);

  if (!Number.isFinite(n) || n <= 0) return 20;
  return Math.max(1, Math.min(n, 100));
}

function obtenerSnapshotsPeriodoHistorial() {
  const limite = obtenerLimitePeriodoHistorial();

  return [...(historialSnapshots || [])]
    .slice(0, limite);
}

function renderHistorialResumen() {
  const box = document.getElementById("historial-resumen");
  if (!box) return;

  const ultimo = historialSnapshots[0] || null;
  const total = historialSnapshots.length;

  const cards = [
    {
      label: "Snapshots cargados",
      value: total,
      sub: "Ultimos cortes operativos",
    },
    {
      label: "Ultimo guardado",
      value: ultimo ? formatearFechaHistorial(ultimo.guardado_en) : "—",
      sub: ultimo?.id ? `Snapshot #${ultimo.id}` : "Sin datos",
    },
    {
      label: "VES promedio",
      value: ultimo ? formatearNumeroHistorial(obtenerPromedioMonedaSnapshot(ultimo, "VES"), 2) : "—",
      sub: "Compra/venta promedio",
    },
    {
      label: "Cruces",
      value: ultimo?.totales?.cruces ?? "—",
      sub: "Cruces guardados",
    },
  ];

  box.innerHTML = cards.map((card) => `
    <div class="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/60 dark:bg-white/5 p-4">
      <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">${card.label}</div>
      <div class="text-xl font-semibold mt-2">${card.value}</div>
      <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${card.sub}</div>
    </div>
  `).join("");
}

function renderHistorialLista() {
  const lista = document.getElementById("historial-lista");
  const estado = document.getElementById("historial-estado");
  if (!lista) return;

  if (estado) {
    estado.textContent = historialSnapshots.length
      ? `${historialSnapshots.length} snapshot(s)`
      : "Sin snapshots";
  }

  if (!historialSnapshots.length) {
    lista.innerHTML = `
      <div class="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        No hay snapshots disponibles.
      </div>
    `;
    return;
  }

  lista.innerHTML = historialSnapshots.map((snap, index) => {
    const selected = historialSnapshotSeleccionado?.id === snap.id;
    const ves = obtenerPromedioMonedaSnapshot(snap, "VES");
    const ars = obtenerPromedioMonedaSnapshot(snap, "ARS");
    const cop = obtenerPromedioMonedaSnapshot(snap, "COP");

    return `
      <div class="rounded-2xl border ${
        selected
          ? "border-blue-500/50 bg-blue-500/5"
          : "border-slate-200/60 dark:border-slate-800/80 bg-white/60 dark:bg-white/5"
      } p-4">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <div class="text-sm font-semibold">
              Snapshot #${snap.id}
              ${index === 0 ? `<span class="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">Actual</span>` : ""}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ${formatearFechaHistorial(snap.guardado_en)}
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button class="btn-ghost text-xs" data-historial-detalle="${snap.id}">
              Ver detalle
            </button>
            ${
            index === 0
                ? `
                <button class="btn-ghost text-xs opacity-50 cursor-not-allowed" disabled title="Este ya es el snapshot actual">
                    Snapshot actual
                </button>
                `
                : `
                <button class="btn-ghost text-xs" data-historial-comparar="${snap.id}">
                    Comparar con actual
                </button>
                `
            }
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 mt-4 text-xs">
          <div class="rounded-xl bg-slate-100/70 dark:bg-white/5 px-3 py-2">
            <div class="text-slate-500 dark:text-slate-400">VES prom.</div>
            <div class="font-semibold mt-1">${formatearNumeroHistorial(ves, 2)}</div>
          </div>
          <div class="rounded-xl bg-slate-100/70 dark:bg-white/5 px-3 py-2">
            <div class="text-slate-500 dark:text-slate-400">ARS prom.</div>
            <div class="font-semibold mt-1">${formatearNumeroHistorial(ars, 2)}</div>
          </div>
          <div class="rounded-xl bg-slate-100/70 dark:bg-white/5 px-3 py-2">
            <div class="text-slate-500 dark:text-slate-400">COP prom.</div>
            <div class="font-semibold mt-1">${formatearNumeroHistorial(cop, 2)}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderHistorialDetalleVacio() {
  const detalle = document.getElementById("historial-detalle");
  if (!detalle) return;

  detalle.innerHTML = "Ningún snapshot seleccionado.";
}

function renderHistorialComparacionVacia() {
  const box = document.getElementById("historial-comparacion");
  if (!box) return;

  box.innerHTML = "Sin comparación activa.";
}

async function cargarHistorialSnapshots({ forzar = false } = {}) {
  if (historialCargado && !forzar) return;

  const lista = document.getElementById("historial-lista");
  const estado = document.getElementById("historial-estado");

  if (estado) estado.textContent = "Cargando...";
  if (lista) {
    lista.innerHTML = `
      <div class="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Cargando historial...
      </div>
    `;
  }

  try {
    const res = await fetch("/api/snapshots?limit=20", {
      cache: "no-store",
      headers: {
        "x-admin-key": getAdminKey(),
      },
    });

    if (res.status === 401) {
      clearAdminKey();
      location.reload();
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

        historialSnapshots = await res.json();
        historialCargado = true;

        renderHistorialResumen();
        renderHistorialLista();
        renderHistorialComparacionVacia();
        renderEvolucionMonedaHistorial();
        renderEvolucionCruceHistorial();
        
        if (historialSnapshots.length) {
        await cargarDetalleSnapshot(historialSnapshots[0].id, {
            limpiarComparacion: false,
        });
        } else {
        renderHistorialDetalleVacio();
        }
  } catch (err) {
    console.error("[historial] cargarHistorialSnapshots:", err);
    if (estado) estado.textContent = "Error";
    if (lista) {
      lista.innerHTML = `
        <div class="rounded-2xl border border-red-500/20 p-6 text-center text-sm text-red-600 dark:text-red-400">
          No se pudo cargar el historial.
        </div>
      `;
    }
  }
}

function renderDetalleSnapshot(data) {
  const detalle = document.getElementById("historial-detalle");
  if (!detalle) return;

  const snap = data?.data || {};
  const monedas = ["VES", "ARS", "COP", "PEN", "CLP", "MXN", "BRL"];

  detalle.innerHTML = `
    <div class="space-y-4">
      <div>
        <div class="text-sm font-semibold text-slate-900 dark:text-white">
          Snapshot #${data.id}
        </div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          ${formatearFechaHistorial(data.guardado_en)}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${monedas.map((code) => {
          const item = snap?.[code] || {};
          const promedio = calcularPromedioHistorial(item.compra, item.venta);

          return `
            <div class="rounded-xl bg-slate-100/70 dark:bg-white/5 px-3 py-2">
              <div class="text-xs font-semibold">${code}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Compra: ${formatearNumeroHistorial(item.compra, 4)}
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400">
                Venta: ${formatearNumeroHistorial(item.venta, 4)}
              </div>
              <div class="text-sm font-semibold mt-1">
                Prom: ${formatearNumeroHistorial(promedio, 4)}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="text-xs text-slate-500 dark:text-slate-400">
        Cruces: ${Object.keys(snap.cruces || {}).length} ·
        Márgenes: ${Object.keys(snap.margenesCruce || {}).length}
      </div>
    </div>
  `;
}

async function cargarDetalleSnapshot(id, opciones = {}) {
  try {
    const res = await fetch(`/api/snapshots/${encodeURIComponent(id)}`, {
      cache: "no-store",
      headers: {
        "x-admin-key": getAdminKey(),
      },
    });

    if (res.status === 401) {
      clearAdminKey();
      location.reload();
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    historialSnapshotSeleccionado = data;
    renderHistorialLista();
    renderDetalleSnapshot(data);

    if (opciones.limpiarComparacion !== false) {
    renderHistorialComparacionVacia();
    }
  } catch (err) {
    console.error("[historial] cargarDetalleSnapshot:", err);
    mostrarToast("No se pudo cargar el detalle del snapshot");
  }
}

function renderComparacionSnapshots(data) {
  const box = document.getElementById("historial-comparacion");
  if (!box) return;

  const monedasMovidas = data?.resumen?.monedas?.mas_movidas || [];
  const crucesMovidos = data?.resumen?.cruces?.mas_movidos || [];

  box.innerHTML = `
    <div class="space-y-4">
      <div>
        <div class="text-sm font-semibold text-slate-900 dark:text-white">
          #${data.from?.id} → #${data.to?.id}
        </div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          ${formatearFechaHistorial(data.from?.guardado_en)} → ${formatearFechaHistorial(data.to?.guardado_en)}
        </div>
      </div>

      <div>
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
          Monedas más movidas
        </div>
        <div class="space-y-2">
          ${monedasMovidas.slice(0, 5).map((m) => `
            <div class="rounded-xl bg-slate-100/70 dark:bg-white/5 px-3 py-2">
              <div class="flex justify-between gap-3 text-sm">
                <span class="font-semibold">${m.code}</span>
                <span class="${Number(m.promedio?.pct) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}">
                  ${formatearPctHistorial(m.promedio?.pct)}
                </span>
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ${formatearNumeroHistorial(m.promedio?.anterior, 4)} → ${formatearNumeroHistorial(m.promedio?.nuevo, 4)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <div>
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
          Cruces más movidos
        </div>
        <div class="space-y-2">
          ${crucesMovidos.slice(0, 5).map((c) => `
            <div class="rounded-xl bg-slate-100/70 dark:bg-white/5 px-3 py-2">
              <div class="flex justify-between gap-3 text-sm">
                <span class="font-semibold">${c.key}</span>
                <span class="${Number(c.pct) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}">
                  ${formatearPctHistorial(c.pct)}
                </span>
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ${formatearNumeroHistorial(c.anterior, 6)} → ${formatearNumeroHistorial(c.nuevo, 6)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

async function compararSnapshotConActual(id) {
  const actual = historialSnapshots[0];

  if (!actual || !id || String(actual.id) === String(id)) {
    mostrarToast("Selecciona un snapshot anterior para comparar");
    return;
  }

  try {
    const res = await fetch(`/api/snapshots/compare?from=${encodeURIComponent(id)}&to=${encodeURIComponent(actual.id)}`, {
      cache: "no-store",
      headers: {
        "x-admin-key": getAdminKey(),
      },
    });

    if (res.status === 401) {
      clearAdminKey();
      location.reload();
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    renderComparacionSnapshots(data);
  } catch (err) {
    console.error("[historial] compararSnapshotConActual:", err);
    mostrarToast("No se pudo comparar el snapshot");
  }
}

function obtenerSerieMonedaHistorial(code) {
  return obtenerSnapshotsPeriodoHistorial()
    .slice()
    .reverse()
    .map((snap) => ({
      id: snap.id,
      fecha: snap.guardado_en,
      valor: obtenerPromedioMonedaSnapshot(snap, code),
    }))
    .filter((p) => Number.isFinite(Number(p.valor)));
}

function calcularStatsSerieHistorial(serie = []) {
  if (!serie.length) {
    return {
      inicio: null,
      actual: null,
      cambioPct: null,
      max: null,
      min: null,
    };
  }

  const valores = serie.map((p) => Number(p.valor)).filter(Number.isFinite);
  const inicio = valores[0];
  const actual = valores[valores.length - 1];

  return {
    inicio,
    actual,
    cambioPct: inicio ? ((actual - inicio) / inicio) * 100 : null,
    max: Math.max(...valores),
    min: Math.min(...valores),
  };
}

function renderStatsMonedaHistorial(code, serie) {
  const box = document.getElementById("historial-moneda-stats");
  if (!box) return;

  const stats = calcularStatsSerieHistorial(serie);

  const cards = [
    {
      label: "Inicio",
      value: formatearNumeroHistorial(stats.inicio, 4),
      sub: "Primer snapshot",
    },
    {
      label: "Actual",
      value: formatearNumeroHistorial(stats.actual, 4),
      sub: "Último snapshot",
    },
    {
      label: "Cambio",
      value: formatearPctHistorial(stats.cambioPct),
      sub: "Variación total",
      tone: Number(stats.cambioPct) >= 0 ? "up" : "down",
    },
    {
      label: "Máximo",
      value: formatearNumeroHistorial(stats.max, 4),
      sub: "Punto más alto",
    },
    {
      label: "Mínimo",
      value: formatearNumeroHistorial(stats.min, 4),
      sub: "Punto más bajo",
    },
  ];

  box.innerHTML = cards.map((card) => {
    const toneClass =
      card.tone === "up"
        ? "text-green-600 dark:text-green-400"
        : card.tone === "down"
          ? "text-red-600 dark:text-red-400"
          : "text-slate-900 dark:text-white";

    return `
      <div class="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/60 dark:bg-white/5 p-4">
        <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">${card.label}</div>
        <div class="text-lg font-semibold mt-2 ${toneClass}">${card.value}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${card.sub}</div>
      </div>
    `;
  }).join("");
}

function renderGraficoMonedaHistorial(code, serie) {
  const box = document.getElementById("historial-moneda-chart");
  if (!box) return;

  if (!serie.length) {
    box.innerHTML = `
      <div class="h-[220px] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No hay datos suficientes para graficar ${code}.
      </div>
    `;
    return;
  }

  if (serie.length === 1) {
    box.innerHTML = `
      <div class="h-[220px] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Solo hay un snapshot para ${code}. Se necesitan al menos dos para ver evolución.
      </div>
    `;
    return;
  }

  const width = 760;
  const height = 220;
  const paddingX = 38;
  const paddingY = 28;

  const valores = serie.map((p) => Number(p.valor));
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;

  const puntos = serie.map((p, index) => {
    const x = paddingX + (index / Math.max(1, serie.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((Number(p.valor) - min) / rango) * (height - paddingY * 2);

    return {
      ...p,
      x,
      y,
    };
  });

  const path = puntos
    .map((p, index) => `${index === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const ultimo = puntos[puntos.length - 1];
  const primero = puntos[0];

  box.innerHTML = `
    <div class="w-full overflow-x-auto">
      <svg viewBox="0 0 ${width} ${height}" class="w-full min-w-[620px] h-[220px]" role="img" aria-label="Evolución histórica de ${code}">
        <line x1="${paddingX}" y1="${paddingY}" x2="${paddingX}" y2="${height - paddingY}" class="stroke-slate-300 dark:stroke-slate-700" stroke-width="1" />
        <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" class="stroke-slate-300 dark:stroke-slate-700" stroke-width="1" />

        <text x="${paddingX}" y="16" class="fill-slate-500 dark:fill-slate-400" font-size="11">
          Max ${formatearNumeroHistorial(max, 4)}
        </text>
        <text x="${paddingX}" y="${height - 6}" class="fill-slate-500 dark:fill-slate-400" font-size="11">
          Min ${formatearNumeroHistorial(min, 4)}
        </text>

        <path d="${path}" fill="none" class="stroke-blue-600 dark:stroke-blue-400" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

        ${puntos.map((p) => `
          <circle cx="${p.x}" cy="${p.y}" r="4" class="fill-white dark:fill-slate-950 stroke-blue-600 dark:stroke-blue-400" stroke-width="2">
            <title>Snapshot #${p.id}: ${formatearNumeroHistorial(p.valor, 6)}</title>
          </circle>
        `).join("")}

        <text x="${primero.x}" y="${height - 10}" text-anchor="start" class="fill-slate-500 dark:fill-slate-400" font-size="11">
          #${primero.id}
        </text>
        <text x="${ultimo.x}" y="${height - 10}" text-anchor="end" class="fill-slate-500 dark:fill-slate-400" font-size="11">
          #${ultimo.id}
        </text>
      </svg>
    </div>
  `;
}

function renderEvolucionMonedaHistorial() {
  const select = document.getElementById("historial-moneda-select");
  const code = select?.value || "VES";
  const serie = obtenerSerieMonedaHistorial(code);

  renderStatsMonedaHistorial(code, serie);
  renderGraficoMonedaHistorial(code, serie);
}

function formatearNombreCruceHistorial(clave = "") {
  const [origen, destino] = String(clave).split("-");
  if (!origen || !destino) return clave || "—";
  return `${origen} → ${destino}`;
}

function obtenerSerieCruceHistorial(clave) {
  return obtenerSnapshotsPeriodoHistorial()
    .slice()
    .reverse()
    .map((snap) => ({
      id: snap.id,
      fecha: snap.guardado_en,
      valor: snap?.cruces?.[clave] ?? snap?.data?.cruces?.[clave] ?? null,
    }))
    .filter((p) => Number.isFinite(Number(p.valor)));
}

function calcularStatsCruceHistorial(serie = []) {
  if (!serie.length) {
    return {
      inicio: null,
      actual: null,
      cambioPct: null,
      max: null,
      min: null,
    };
  }

  const valores = serie.map((p) => Number(p.valor)).filter(Number.isFinite);
  const inicio = valores[0];
  const actual = valores[valores.length - 1];

  return {
    inicio,
    actual,
    cambioPct: inicio ? ((actual - inicio) / inicio) * 100 : null,
    max: Math.max(...valores),
    min: Math.min(...valores),
  };
}

function renderStatsCruceHistorial(clave, serie) {
  const box = document.getElementById("historial-cruce-stats");
  if (!box) return;

  const stats = calcularStatsCruceHistorial(serie);

  const cards = [
    {
      label: "Inicio",
      value: formatearNumeroHistorial(stats.inicio, 6),
      sub: "Primer snapshot",
    },
    {
      label: "Actual",
      value: formatearNumeroHistorial(stats.actual, 6),
      sub: "Último snapshot",
    },
    {
      label: "Cambio",
      value: formatearPctHistorial(stats.cambioPct),
      sub: "Variación total",
      tone: Number(stats.cambioPct) >= 0 ? "up" : "down",
    },
    {
      label: "Máximo",
      value: formatearNumeroHistorial(stats.max, 6),
      sub: "Punto más alto",
    },
    {
      label: "Mínimo",
      value: formatearNumeroHistorial(stats.min, 6),
      sub: "Punto más bajo",
    },
  ];

  box.innerHTML = cards.map((card) => {
    const toneClass =
      card.tone === "up"
        ? "text-green-600 dark:text-green-400"
        : card.tone === "down"
          ? "text-red-600 dark:text-red-400"
          : "text-slate-900 dark:text-white";

    return `
      <div class="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/60 dark:bg-white/5 p-4">
        <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">${card.label}</div>
        <div class="text-lg font-semibold mt-2 ${toneClass}">${card.value}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${card.sub}</div>
      </div>
    `;
  }).join("");
}

function renderGraficoCruceHistorial(clave, serie) {
  const box = document.getElementById("historial-cruce-chart");
  if (!box) return;

  const nombre = formatearNombreCruceHistorial(clave);

  if (!serie.length) {
    box.innerHTML = `
      <div class="h-[220px] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No hay datos suficientes para graficar ${nombre}.
      </div>
    `;
    return;
  }

  if (serie.length === 1) {
    box.innerHTML = `
      <div class="h-[220px] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Solo hay un snapshot para ${nombre}. Se necesitan al menos dos para ver evolución.
      </div>
    `;
    return;
  }

  const width = 760;
  const height = 220;
  const paddingX = 38;
  const paddingY = 28;

  const valores = serie.map((p) => Number(p.valor));
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;

  const puntos = serie.map((p, index) => {
    const x = paddingX + (index / Math.max(1, serie.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((Number(p.valor) - min) / rango) * (height - paddingY * 2);

    return {
      ...p,
      x,
      y,
    };
  });

  const path = puntos
    .map((p, index) => `${index === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const ultimo = puntos[puntos.length - 1];
  const primero = puntos[0];

  box.innerHTML = `
    <div class="w-full overflow-x-auto">
      <svg viewBox="0 0 ${width} ${height}" class="w-full min-w-[620px] h-[220px]" role="img" aria-label="Evolución histórica de ${nombre}">
        <line x1="${paddingX}" y1="${paddingY}" x2="${paddingX}" y2="${height - paddingY}" class="stroke-slate-300 dark:stroke-slate-700" stroke-width="1" />
        <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" class="stroke-slate-300 dark:stroke-slate-700" stroke-width="1" />

        <text x="${paddingX}" y="16" class="fill-slate-500 dark:fill-slate-400" font-size="11">
          Max ${formatearNumeroHistorial(max, 6)}
        </text>
        <text x="${paddingX}" y="${height - 6}" class="fill-slate-500 dark:fill-slate-400" font-size="11">
          Min ${formatearNumeroHistorial(min, 6)}
        </text>

        <path d="${path}" fill="none" class="stroke-violet-600 dark:stroke-violet-400" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

        ${puntos.map((p) => `
          <circle cx="${p.x}" cy="${p.y}" r="4" class="fill-white dark:fill-slate-950 stroke-violet-600 dark:stroke-violet-400" stroke-width="2">
            <title>Snapshot #${p.id}: ${formatearNumeroHistorial(p.valor, 6)}</title>
          </circle>
        `).join("")}

        <text x="${primero.x}" y="${height - 10}" text-anchor="start" class="fill-slate-500 dark:fill-slate-400" font-size="11">
          #${primero.id}
        </text>
        <text x="${ultimo.x}" y="${height - 10}" text-anchor="end" class="fill-slate-500 dark:fill-slate-400" font-size="11">
          #${ultimo.id}
        </text>
      </svg>
    </div>
  `;
}

function renderEvolucionCruceHistorial() {
  const select = document.getElementById("historial-cruce-select");
  const clave = select?.value || "COP-VES";
  const serie = obtenerSerieCruceHistorial(clave);

  renderStatsCruceHistorial(clave, serie);
  renderGraficoCruceHistorial(clave, serie);
}

function registrarEventosHistorial() {
  document.getElementById("btn-historial-recargar")?.addEventListener("click", () => {
    historialCargado = false;
    cargarHistorialSnapshots({ forzar: true });
  });

  document.getElementById("historial-lista")?.addEventListener("click", (ev) => {
    const btnDetalle = ev.target.closest("[data-historial-detalle]");
    if (btnDetalle) {
      cargarDetalleSnapshot(btnDetalle.dataset.historialDetalle);
      return;
    }

    const btnComparar = ev.target.closest("[data-historial-comparar]");
    if (btnComparar) {
      compararSnapshotConActual(btnComparar.dataset.historialComparar);
    }
  });

  document.getElementById("historial-moneda-select")?.addEventListener("change", () => {
      renderEvolucionMonedaHistorial();
  });

  document.getElementById("historial-cruce-select")?.addEventListener("change", () => {
      renderEvolucionCruceHistorial();
  });

  document.getElementById("historial-periodo-select")?.addEventListener("change", () => {
      renderEvolucionMonedaHistorial();
      renderEvolucionCruceHistorial();
  });

}

document.addEventListener("DOMContentLoaded", () => {
  registrarEventosHistorial();
});