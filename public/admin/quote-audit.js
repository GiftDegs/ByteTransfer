"use strict";

// =====================================================
// QUOTE AUDIT / REFERENCIAS TECNICAS DEL MOTOR
// =====================================================

async function obtenerReferenciasExternas() {
  const r = await fetch("/api/debug/references", {
    headers: {
      "x-admin-key": getAdminKey(),
    },
    cache: "no-store",
  });

  if (!r.ok) throw new Error(`HTTP ${r.status}`);

  return await r.json();
}

async function obtenerAuditoriaCotizaciones() {
  const res = await fetch("/api/debug/quotes", {
    headers: {
      "x-admin-key": getAdminKey(),
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return await res.json();
}

function renderAuditoriaCotizaciones(data) {
  const box = document.getElementById("quote-audit-box");
  const title = document.getElementById("quote-audit-title");
  const subtitle = document.getElementById("quote-audit-subtitle");
  const grid = document.getElementById("quote-audit-grid");

  if (!box || !grid) return;

  const results = data?.results || {};
  const summary = data?.audit_summary || {};
  const warnings = summary?.warnings || [];

  const confidence = summary?.confidence || "unknown";

  if (title) {
    title.textContent =
      confidence === "high"
        ? "Motor de precios estable"
        : confidence === "medium"
          ? "Motor de precios en observación"
          : "Motor de precios requiere revisión";
  }

  if (subtitle) {
    subtitle.textContent =
      warnings.length === 0
        ? "El motor de precios opera con datos confiables."
        : `${warnings.length} advertencia(s) detectada(s) en las cotizaciones.`;
  }

  const cards = Object.entries(results).map(([code, item]) => {
    const buy = item?.buy || {};
    const sell = item?.sell || {};
    const audit = item?.audit || {};

    const buyPrice = Number.isFinite(Number(buy.price))
      ? Number(buy.price).toFixed(4)
      : "—";

    const sellPrice = Number.isFinite(Number(sell.price))
      ? Number(sell.price).toFixed(4)
      : "—";

    const spread = Number.isFinite(Number(audit.spread_pct))
      ? `${Number(audit.spread_pct).toFixed(2)}%`
      : "—";

    const conf = audit.confidence || "unknown";

    const confClass =
      conf === "high"
        ? "text-emerald-600 dark:text-emerald-400"
        : conf === "medium"
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400";

    const warningsList = Array.isArray(audit.warnings) ? audit.warnings : [];

    return `
      <div class="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/70 dark:bg-white/5 p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">${code}</div>
            <div class="mt-1 text-sm font-semibold ${confClass}">
              ${conf === "high" ? "Alta confianza" : conf === "medium" ? "Confianza media" : "Revisar"}
            </div>
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400">
            Spread ${spread}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div>
            <div class="text-slate-500 dark:text-slate-400">Compra</div>
            <div class="font-semibold">${buyPrice}</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-500 mt-1">
              ${buy.provider || "—"} · ${buy.source || "—"}
            </div>
          </div>
          <div>
            <div class="text-slate-500 dark:text-slate-400">Venta</div>
            <div class="font-semibold">${sellPrice}</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-500 mt-1">
              ${sell.provider || "—"} · ${sell.source || "—"}
            </div>
          </div>
        </div>

        ${
          warningsList.length
            ? `<div class="mt-3 text-xs text-amber-600 dark:text-amber-400">${warningsList.join(" · ")}</div>`
            : ""
        }
      </div>
    `;
  });

  grid.innerHTML = cards.join("");
}

function renderReferenciasExternas(refs) {
  const grid = document.getElementById("quote-reference-grid");
  if (!grid) return;

  const results = refs?.results || {};
  const entries = Object.entries(results);

  if (!entries.length) {
    grid.innerHTML = `
      <div class="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/70 dark:bg-white/5 p-4 text-sm text-slate-500 dark:text-slate-400">
        No hay referencias externas disponibles.
      </div>
    `;
    return;
  }

  grid.innerHTML = entries
    .map(([key, ref]) => {
      const price = Number.isFinite(Number(ref.price))
        ? Number(ref.price).toFixed(6)
        : "—";

      const stale = !!ref.stale;
      const fallback = !!ref.fallback;

      const estado = stale || fallback ? "Revisar" : "OK";
      const estadoClass =
        stale || fallback
          ? "text-amber-600 dark:text-amber-400"
          : "text-emerald-600 dark:text-emerald-400";

      return `
        <div class="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/70 dark:bg-white/5 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">${key}</div>
              <div class="text-xl font-semibold mt-1">${price}</div>
            </div>
            <div class="text-xs font-semibold ${estadoClass}">
              ${estado}
            </div>
          </div>

          <div class="mt-3 text-xs text-slate-500 dark:text-slate-400">
            ${ref.provider || ref.source || "—"}
            ${ref.fallback_reason ? ` · ${ref.fallback_reason}` : ""}
          </div>
        </div>
      `;
    })
    .join("");
}