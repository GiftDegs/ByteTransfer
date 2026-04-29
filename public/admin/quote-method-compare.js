"use strict";

// =====================================================
// QUOTE METHOD COMPARE
// =====================================================

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