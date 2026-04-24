"use strict";

// =====================================================
// TARJETAS PRECIOS
// =====================================================
function renderTarjetasPaises(modoEdicion = false) {
  const cont = document.getElementById("tarjetas-paises");
  if (!cont) return;

  cont.innerHTML = "";

  paises.forEach((p) => {
    const datos = datosPaises[p.fiat] || {};
    const compra = datos.compra;
    const venta = datos.venta;

    const card = document.createElement("div");
    card.className = "premium-card rounded-2xl p-5";

    card.innerHTML = `
      <div class="flex items-center justify-between gap-3 mb-4">
        <div>
          <div class="text-sm font-semibold tracking-tight">${p.nombre}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${p.fiat}</div>
        </div>
        <div class="text-2xl">${p.emoji}</div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div>
          <div class="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">Compra</div>
          ${
            modoEdicion
              ? `<input type="number" step="any" data-fi="${p.fiat}" data-tipo="compra" value="${compra ?? ""}" class="input-premium w-full text-center text-xl font-semibold" />`
              : `<div class="text-2xl font-semibold tracking-tight">${formatearTasa(compra) ?? "—"}</div>`
          }
        </div>

        <div>
          <div class="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 mb-2">Venta</div>
          ${
            modoEdicion
              ? `<input type="number" step="any" data-fi="${p.fiat}" data-tipo="venta" value="${venta ?? ""}" class="input-premium w-full text-center text-xl font-semibold" />`
              : `<div class="text-2xl font-semibold tracking-tight">${formatearTasa(venta) ?? "—"}</div>`
          }
        </div>
      </div>
    `;

    cont.appendChild(card);
  });

  setTimeout(() => {
    const inputs = cont.querySelectorAll("input[data-fi]");
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        mostrarAdvertenciaPendiente(true);
        marcarInputPendiente(input);
        renderResumenBorrador();
      });
    });
  }, 0);
}

// =====================================================
// PREVIEW / GUARDADO - PRECIOS
// =====================================================
function leerPreciosDesdeInputs() {
  for (const p of paises) {
    const fiat = p.fiat;
    const compra = parseFloat(document.querySelector(`input[data-fi="${fiat}"][data-tipo="compra"]`)?.value);
    const venta = parseFloat(document.querySelector(`input[data-fi="${fiat}"][data-tipo="venta"]`)?.value);

    if (!datosPaises[fiat]) datosPaises[fiat] = {};

    if (Number.isFinite(compra)) datosPaises[fiat].compra = compra;
    if (Number.isFinite(venta)) datosPaises[fiat].venta = venta;
  }
}

function obtenerDatosPreviewDesdeInputs() {
  const preview = {};

  for (const p of paises) {
    const fiat = p.fiat;

    const compraInput = parseFloat(document.querySelector(`input[data-fi="${fiat}"][data-tipo="compra"]`)?.value);
    const ventaInput = parseFloat(document.querySelector(`input[data-fi="${fiat}"][data-tipo="venta"]`)?.value);

    const compra = Number.isFinite(compraInput) ? compraInput : Number(datosPaises?.[fiat]?.compra);
    const venta = Number.isFinite(ventaInput) ? ventaInput : Number(datosPaises?.[fiat]?.venta);

    preview[fiat] = {
      compra: Number.isFinite(compra) ? compra : null,
      venta: Number.isFinite(venta) ? venta : null,
    };
  }

  return preview;
}