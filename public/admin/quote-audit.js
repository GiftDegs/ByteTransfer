"use strict";

// =====================================================
// QUOTE AUDIT / REFERENCIAS TÉCNICAS DEL MOTOR
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

function formatearNumeroAudit(valor, decimales = 4) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";

  return n.toLocaleString("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

function formatearPctAudit(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function normalizarProveedorAudit(provider, source) {
  const p = String(provider || source || "").toLowerCase();

  if (p === "binance") return "Binance P2P";
  if (p === "ptax") return "PTAX";
  if (p === "bcv") return "BCV";
  if (p === "derived") return "Derivado";

  return provider || source || "—";
}

function obtenerTemaSemaforoAudit(confidence) {
  if (confidence === "high") {
    return {
      estado: "estable",
      badge: "Estable",
      titulo: "Motor de precios estable",
      subtitulo: "El motor de precios opera con datos confiables.",
      causa: "Las cotizaciones activas tienen buena cobertura y no presentan advertencias relevantes.",
      impacto: "Los precios operativos pueden usarse como base del panel sin ajustes técnicos.",
      accion: "Puedes continuar operando y revisar solo si cambia la confianza del motor.",
      wrapper: "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10",
      pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500",
    };
  }

  if (confidence === "medium") {
    return {
      estado: "observacion",
      badge: "Observación",
      titulo: "Motor de precios en observación",
      subtitulo: "Hay señales moderadas que conviene revisar.",
      causa: "Una o más cotizaciones tienen menor cobertura, fallback o advertencias técnicas.",
      impacto: "El panel puede seguir funcionando, pero algunos precios requieren lectura cuidadosa.",
      accion: "Revisa las monedas marcadas antes de guardar o publicar tasas sensibles.",
      wrapper: "border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10",
      pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
      text: "text-amber-700 dark:text-amber-300",
      dot: "bg-amber-500",
    };
  }

  return {
    estado: "revisar",
    badge: "Revisar",
    titulo: "Motor de precios requiere revisión",
    subtitulo: "Hay datos incompletos o señales de baja confianza.",
    causa: "El motor detectó fallas, datos insuficientes o referencias en fallback.",
    impacto: "No conviene guardar ni operar fuerte sin revisar la fuente afectada.",
    accion: "Revisa configuración, métodos, montos operativos y proveedor antes de continuar.",
    wrapper: "border-red-500/20 bg-red-500/5 dark:bg-red-500/10",
    pill: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  };
}

function obtenerTemaMonedaAudit(confidence) {
  if (confidence === "high") return obtenerTemaSemaforoAudit("high");
  if (confidence === "medium") return obtenerTemaSemaforoAudit("medium");
  return obtenerTemaSemaforoAudit("low");
}

function renderTarjetaLecturaAudit(label, texto) {
  return `
    <div class="rounded-2xl bg-white/75 dark:bg-white/[0.055] border border-white/70 dark:border-white/10 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.035)]">
      <div class="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        ${label}
      </div>
      <div class="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        ${texto}
      </div>
    </div>
  `;
}

function renderMiniCotizacionAudit(label, quote) {
  const price = formatearNumeroAudit(quote?.price, 4);
  const provider = normalizarProveedorAudit(quote?.provider, quote?.source);

  const used = Number(quote?.used_count);
  const raw = Number(quote?.raw_count);

  const conteo =
    Number.isFinite(used) && Number.isFinite(raw)
      ? `${used}/${raw}`
      : "—";

  return `
    <div class="rounded-2xl bg-white/70 dark:bg-white/[0.045] border border-slate-200/70 dark:border-white/10 p-3">
      <div class="flex items-center justify-between gap-2">
        <div class="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          ${label}
        </div>
        <div class="text-[11px] text-slate-400 dark:text-slate-500">
          ${conteo}
        </div>
      </div>

      <div class="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
        ${price}
      </div>

      <div class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
        ${provider}
      </div>
    </div>
  `;
}

function renderAuditoriaCotizaciones(data) {
  const title = document.getElementById("quote-audit-title");
  const subtitle = document.getElementById("quote-audit-subtitle");
  const badge = document.getElementById("quote-audit-badge");
  const grid = document.getElementById("quote-audit-grid");
  const warningsBox = document.getElementById("quote-audit-warnings");

  if (!grid) return;

  const results = data?.results || {};
  const summary = data?.audit_summary || {};
  const warnings = Array.isArray(summary?.warnings) ? summary.warnings : [];
  const confidence = summary?.confidence || "unknown";
  const temaGlobal = obtenerTemaSemaforoAudit(confidence);

  const entradas = Object.entries(results);
  const total = entradas.length;
  const altas = entradas.filter(([, item]) => item?.audit?.confidence === "high").length;
  const medias = entradas.filter(([, item]) => item?.audit?.confidence === "medium").length;
  const bajas = Math.max(0, total - altas - medias);

  if (title) title.textContent = temaGlobal.titulo;
  if (subtitle) title && (subtitle.textContent = temaGlobal.subtitulo);

  if (badge) {
    badge.className = `inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${temaGlobal.pill}`;
    badge.innerHTML = `
      <span class="h-2 w-2 rounded-full ${temaGlobal.dot}"></span>
      ${temaGlobal.badge}
    `;
  }

  grid.innerHTML = `
    <div class="xl:col-span-4 rounded-3xl border ${temaGlobal.wrapper} p-5">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div class="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Análisis operativo
          </div>
          <div class="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            ${temaGlobal.titulo}
          </div>
        </div>

        <div class="inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${temaGlobal.pill}">
          <span class="h-2 w-2 rounded-full ${temaGlobal.dot}"></span>
          ${temaGlobal.badge}
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-5">
        ${renderTarjetaLecturaAudit("Causa", temaGlobal.causa)}
        ${renderTarjetaLecturaAudit("Impacto", temaGlobal.impacto)}
        ${renderTarjetaLecturaAudit("Acción sugerida", temaGlobal.accion)}
      </div>

      <div class="mt-5 flex flex-wrap gap-2 text-xs">
        <span class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/70 dark:bg-white/5 border border-white/70 dark:border-white/10 text-slate-600 dark:text-slate-300">
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          ${altas} alta confianza
        </span>

        <span class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/70 dark:bg-white/5 border border-white/70 dark:border-white/10 text-slate-600 dark:text-slate-300">
          <span class="h-2 w-2 rounded-full bg-amber-500"></span>
          ${medias} observación
        </span>

        <span class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/70 dark:bg-white/5 border border-white/70 dark:border-white/10 text-slate-600 dark:text-slate-300">
          <span class="h-2 w-2 rounded-full bg-red-500"></span>
          ${bajas} revisar
        </span>
      </div>
    </div>

    ${entradas
      .map(([code, item]) => {
        const audit = item?.audit || {};
        const tema = obtenerTemaMonedaAudit(audit.confidence);
        const warningsList = Array.isArray(audit.warnings) ? audit.warnings : [];
        const spread = formatearPctAudit(audit.spread_pct);

        return `
          <div class="rounded-3xl border ${tema.wrapper} p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full ${tema.dot}"></span>
                  <div class="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    ${code}
                  </div>
                </div>

                <div class="mt-2 text-sm font-semibold ${tema.text}">
                  ${tema.badge}
                </div>
              </div>

              <div class="text-right">
                <div class="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Spread
                </div>
                <div class="mt-1 text-sm font-semibold ${tema.text}">
                  ${spread}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              ${renderMiniCotizacionAudit("Compra", item?.buy)}
              ${renderMiniCotizacionAudit("Venta", item?.sell)}
            </div>

            ${
              warningsList.length
                ? `
                  <div class="mt-3 rounded-2xl border border-amber-500/15 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                    ${warningsList.join(" · ")}
                  </div>
                `
                : ""
            }
          </div>
        `;
      })
      .join("")}
  `;

  if (warningsBox) {
    warningsBox.innerHTML = warnings.length
      ? `
        <div class="rounded-3xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 p-4">
          <div class="text-[11px] uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
            Advertencias del motor
          </div>
          <div class="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-2">
            ${warnings
              .map(
                (w) => `
                  <div class="rounded-2xl bg-white/75 dark:bg-white/[0.055] border border-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                    ${w}
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      `
      : "";
  }
}

function renderReferenciasExternas(refs) {
  const grid = document.getElementById("quote-reference-grid");
  if (!grid) return;

  const results = refs?.results || {};
  const entries = Object.entries(results);

  if (!entries.length) {
    grid.innerHTML = `
      <div class="md:col-span-3 rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5 text-sm text-slate-500 dark:text-slate-400">
        No hay referencias externas disponibles.
      </div>
    `;
    return;
  }

  grid.innerHTML = entries
    .map(([key, ref]) => {
      const price = formatearNumeroAudit(ref?.price, 6);
      const revisar = !!ref?.stale || !!ref?.fallback;
      const tema = revisar ? obtenerTemaSemaforoAudit("medium") : obtenerTemaSemaforoAudit("high");

      return `
        <div class="rounded-3xl border ${tema.wrapper} p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="h-2.5 w-2.5 rounded-full ${tema.dot}"></span>
                <div class="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  ${key}
                </div>
              </div>

              <div class="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                ${price}
              </div>
            </div>

            <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${tema.pill}">
              ${revisar ? "Revisar" : "OK"}
            </span>
          </div>

          <div class="mt-4 text-xs text-slate-500 dark:text-slate-400">
            ${normalizarProveedorAudit(ref?.provider, ref?.source)}
            ${ref?.fallback_reason ? ` · ${ref.fallback_reason}` : ""}
          </div>
        </div>
      `;
    })
    .join("");
}