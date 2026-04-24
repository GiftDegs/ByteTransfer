"use strict";

// =====================================================
// UTILIDADES UI
// =====================================================
function ensureToast() {
  if (document.getElementById("toastMensaje")) return;

  const div = document.createElement("div");
  div.id = "toastMensaje";
  div.className =
    "fixed top-4 right-4 z-[999] hidden bg-slate-950 text-white px-4 py-2 rounded-2xl shadow-2xl text-sm";
  document.body.appendChild(div);
}

function mostrarToast(msg) {
  ensureToast();
  const el = document.getElementById("toastMensaje");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  el.style.opacity = "1";
  el.style.transform = "scale(1)";
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "scale(0.95)";
    setTimeout(() => {
      el.classList.add("hidden");
      el.textContent = "";
    }, 250);
  }, 2600);
}

function setLoaderStep(etapa, porcentaje = 0, detalle = "") {
  const etapaEl = document.getElementById("loader-etapa");
  const porcentajeEl = document.getElementById("loader-porcentaje");
  const barraEl = document.getElementById("loader-barra");
  const detalleEl = document.getElementById("loader-detalle");

  const pct = Math.max(0, Math.min(100, Number(porcentaje) || 0));

  if (etapaEl) etapaEl.textContent = etapa || "Cargando...";
  if (porcentajeEl) porcentajeEl.textContent = `${pct}%`;
  if (barraEl) barraEl.style.width = `${pct}%`;
  if (detalleEl) detalleEl.textContent = detalle || "";
}

function setLoaderError(etapa, detalle = "") {
  const etapaEl = document.getElementById("loader-etapa");
  const porcentajeEl = document.getElementById("loader-porcentaje");
  const barraEl = document.getElementById("loader-barra");
  const detalleEl = document.getElementById("loader-detalle");

  if (etapaEl) etapaEl.textContent = `❌ ${etapa || "Error de carga"}`;
  if (porcentajeEl) porcentajeEl.textContent = "Error";
  if (barraEl) {
    barraEl.style.width = "100%";
    barraEl.classList.remove("bg-brandBlue");
    barraEl.classList.add("bg-red-600");
  }
  if (detalleEl) detalleEl.textContent = detalle || "Revisa consola o recarga la página.";
}

function formatearTasa(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return +n.toFixed(2);
}

function formatearTasaCruce(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n >= 10) return +n.toFixed(1);
  if (n >= 1) return +n.toFixed(2);
  if (n >= 0.01) return +n.toFixed(3);
  if (n >= 0.001) return +n.toFixed(4);
  if (n >= 0.00099) return +n.toFixed(5);
  return +n.toFixed(6);
}

function pintarDelta(el, marketVal, snapVal, labelSnapshot) {
  if (!el) return;

  const m = Number(marketVal);
  const s = Number(snapVal);

  if (!Number.isFinite(m)) {
    el.textContent = "—";
    el.title = "";
    return;
  }

  const mInt = Math.round(m);

  if (!Number.isFinite(s) || s === 0) {
    el.textContent = String(mInt);
    el.title = labelSnapshot ? `${labelSnapshot}: —` : "";
    return;
  }

  const sInt = Math.round(s);
  const dAbs = m - s;
  const dPct = (dAbs / s) * 100;

  const cls =
    dPct > 0 ? "text-green-600" :
    dPct < 0 ? "text-red-600" :
    "text-blue-600";

  const signAbs = dAbs > 0 ? `+${Math.round(dAbs)}` : `${Math.round(dAbs)}`;
  const signPct = dPct > 0 ? `+${dPct.toFixed(2)}` : `${dPct.toFixed(2)}`;

  el.innerHTML = `
    <div class="leading-none">${mInt}</div>
    <div class="mt-1 text-xs ${cls} font-semibold tabular-nums">
      ${signAbs} (${signPct}%)
    </div>
  `;

  el.title = labelSnapshot ? `${labelSnapshot}: ${sInt}` : `Snapshot: ${sInt}`;
}

function iconoCambio(n, p) {
  if (p == null || !Number.isFinite(p)) return "•";
  if (n > p) return "▲";
  if (n < p) return "▼";
  return "•";
}

function claseCambio(n, p) {
  if (p == null || !Number.isFinite(p)) return "text-blue-600";
  if (n > p) return "text-green-600";
  if (n < p) return "text-red-600";
  return "text-blue-600";
}

function marcarInputPendiente(input) {
  if (!input) return;
  input.classList.add("ring-2", "ring-blue-200", "border-brandBlue");
}

function limpiarInputPendiente(input) {
  if (!input) return;
  input.classList.remove("ring-2", "ring-blue-200", "border-brandBlue");
}

function limpiarTodosLosPendientes() {
  document.querySelectorAll("input[data-fi], #ref-bcv-usd, #ref-bcv-eur").forEach((el) => {
    limpiarInputPendiente(el);
  });
}