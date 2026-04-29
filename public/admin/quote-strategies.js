"use strict";

// =====================================================
// QUOTE STRATEGIES / CONFIGURACION DEL MOTOR
// =====================================================

 async function obtenerEstrategiasCotizacion() {
  const r = await fetch("/api/debug/quote-strategies", {
    headers: {
      "x-admin-key": getAdminKey(),
    },
    cache: "no-store",
  });

  if (!r.ok) throw new Error("No se pudo cargar configuración del motor");
  return r.json();
}

const borradorPaytypesMotor = {};
const borradorAvanzadoMotor = {};

async function obtenerCatalogoMetodosPago() {
  const r = await fetch("/api/admin/paytypes/catalog", {
    headers: {
      "x-admin-key": getAdminKey(),
    },
    cache: "no-store",
  });

  if (!r.ok) throw new Error("No se pudo cargar catálogo de métodos");
  return r.json();
}

function obtenerBinanceStrategyDesdeLado(strategy) {
  if (!strategy) return null;
  if (strategy.provider === "binance") return strategy;

  if (Array.isArray(strategy.providers)) {
    return strategy.providers.find((p) => p.provider === "binance") || null;
  }

  return null;
}

function renderControlAvanzadoMotor(code, side, strategyOriginal) {
  const strategy = obtenerBinanceStrategyDesdeLado(strategyOriginal);

  if (!strategy) {
    return `
      <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5 p-4">
        <div class="text-sm font-semibold">${side === "buy" ? "Compra" : "Venta"}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Este lado no usa Binance P2P directo.
        </div>
      </div>
    `;
  }

  const key = `${code}.${side}`;
  const draft = borradorAvanzadoMotor[key] || {};

  const rows = draft.rows ?? strategy.rows ?? 20;
  const aggregation = draft.aggregation ?? strategy.aggregation ?? "average";
  const trimLowest = draft.trimLowest ?? strategy.trimLowest ?? 0;
  const trimHighest = draft.trimHighest ?? strategy.trimHighest ?? 0;

  const preparado = !!borradorAvanzadoMotor[key];

  return `
    <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-semibold">
            ${side === "buy" ? "Compra" : "Venta"}
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ajusta cómo se calcula esta cotización.
          </div>
        </div>

        ${
          preparado
            ? `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/15">
                Cambio preparado
              </span>`
            : ""
        }
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <label class="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Anuncios
          <select
            class="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            data-advanced-field="rows"
            data-code="${code}"
            data-side="${side}"
          >
            ${[20, 30, 50, 80, 100]
              .map(
                (n) => `
                  <option value="${n}" ${Number(rows) === n ? "selected" : ""}>
                    ${n} anuncios
                  </option>
                `
              )
              .join("")}
          </select>
        </label>

        <label class="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Método
          <select
            class="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            data-advanced-field="aggregation"
            data-code="${code}"
            data-side="${side}"
          >
            <option value="average" ${aggregation === "average" ? "selected" : ""}>
              Promedio
            </option>
            <option value="median" ${aggregation === "median" ? "selected" : ""}>
              Mediana
            </option>
          </select>
        </label>

        <label class="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Excluir más bajos
          <input
            type="number"
            min="0"
            max="10"
            step="1"
            value="${Number(trimLowest) || 0}"
            class="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            data-advanced-field="trimLowest"
            data-code="${code}"
            data-side="${side}"
          />
        </label>

        <label class="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Excluir más altos
          <input
            type="number"
            min="0"
            max="10"
            step="1"
            value="${Number(trimHighest) || 0}"
            class="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
            data-advanced-field="trimHighest"
            data-code="${code}"
            data-side="${side}"
          />
        </label>
      </div>

      <div class="flex flex-wrap gap-2 mt-4">
        <button
          class="btn-primary text-sm"
          data-apply-advanced="1"
          data-code="${code}"
          data-side="${side}"
        >
          Aplicar cálculo
        </button>

        <button
          class="btn-ghost text-sm"
          data-advanced-preset="50-median"
          data-code="${code}"
          data-side="${side}"
        >
          50 + mediana
        </button>

        <button
          class="btn-ghost text-sm"
          data-advanced-preset="20-average"
          data-code="${code}"
          data-side="${side}"
        >
          20 + promedio
        </button>
      </div>
    </div>
  `;
}

function registrarEventosAvanzadosMotor() {
  document.querySelectorAll("[data-advanced-field]").forEach((el) => {
    if (el.dataset.bound === "1") return;
    el.dataset.bound = "1";

    el.addEventListener("change", () => {
      const code = el.dataset.code;
      const side = el.dataset.side;
      const field = el.dataset.advancedField;

      if (!code || !side || !field) return;

      const key = `${code}.${side}`;
      const prev = borradorAvanzadoMotor[key] || {
        code,
        side,
      };

      let value = el.value;

      if (["rows", "trimLowest", "trimHighest"].includes(field)) {
        value = Number(value);
      }

      borradorAvanzadoMotor[key] = {
        ...prev,
        [field]: value,
      };

      cargarPanelEstrategiasCotizacion();
    });
  });

  document.querySelectorAll("[data-advanced-preset]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", () => {
      const code = btn.dataset.code;
      const side = btn.dataset.side;
      const preset = btn.dataset.advancedPreset;

      if (!code || !side) return;

      const key = `${code}.${side}`;

      if (preset === "50-median") {
        borradorAvanzadoMotor[key] = {
          code,
          side,
          rows: 50,
          aggregation: "median",
          trimLowest: 0,
          trimHighest: 0,
        };
      }

      if (preset === "20-average") {
        borradorAvanzadoMotor[key] = {
          code,
          side,
          rows: 20,
          aggregation: "average",
          trimLowest: 0,
          trimHighest: 0,
        };
      }

      cargarPanelEstrategiasCotizacion();
    });
  });

  document.querySelectorAll("[data-apply-advanced]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", async () => {
      const code = btn.dataset.code;
      const side = btn.dataset.side;

      if (!code || !side) return;

      try {
        await aplicarAvanzadoMotor(code, side);
      } catch (e) {
        console.error("❌ aplicar cálculo avanzado:", e);
        mostrarToast(`❌ ${e.message}`);
      }
    });
  });
}

async function aplicarAvanzadoMotor(code, side) {
  const key = `${code}.${side}`;
  const change = borradorAvanzadoMotor[key];

  if (!change) {
    mostrarToast("No hay cambios preparados para este cálculo");
    return;
  }

  const r = await fetch("/api/admin/quote-strategies/advanced", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": getAdminKey(),
    },
    body: JSON.stringify({
      changes: [
        {
          code,
          side,
          rows: Number(change.rows),
          aggregation: change.aggregation,
          trimLowest: Number(change.trimLowest || 0),
          trimHighest: Number(change.trimHighest || 0),
        },
      ],
    }),
  });

  const data = await r.json().catch(() => null);

  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || "No se pudo aplicar configuración avanzada");
  }

  delete borradorAvanzadoMotor[key];

  mostrarToast("✅ Cálculo actualizado");
  await cargarPanelEstrategiasCotizacion();
  await cargarComparacionMetodoCotizacion();
}

function obtenerPaytypesActualesMotor(cfg) {
  const buy = obtenerBinanceStrategyDesdeLado(cfg?.buy);
  const sell = obtenerBinanceStrategyDesdeLado(cfg?.sell);

  const set = new Set();

  if (Array.isArray(buy?.payTypes)) {
    buy.payTypes.forEach((x) => set.add(String(x)));
  }

  if (Array.isArray(sell?.payTypes)) {
    sell.payTypes.forEach((x) => set.add(String(x)));
  }

  return Array.from(set);
}

function obtenerClaseRankingMetodo(label) {
  if (label === "Dominante") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25";
  }

  if (label === "Popular") {
    return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25";
  }

  if (label === "Presente") {
    return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20";
  }

  return "bg-white/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-black/5 dark:border-white/10";
}

function renderSelectorMetodosPagoMotor(code, cfg, catalogData) {
  const catalog = catalogData?.catalog?.currencies?.[code];
  const methodsObj = catalog?.methods || {};
  const ordered = Array.isArray(catalog?.methods_ordered)
    ? catalog.methods_ordered
    : Object.keys(methodsObj);

  const actuales = borradorPaytypesMotor[code]?.payTypes || obtenerPaytypesActualesMotor(cfg);
  const selected = new Set(actuales.map(String));

  const esBinance =
    obtenerBinanceStrategyDesdeLado(cfg?.buy) ||
    obtenerBinanceStrategyDesdeLado(cfg?.sell);

  if (!esBinance) {
    return `
      <div class="mt-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
        <div class="text-sm font-semibold">Métodos de pago</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Esta moneda no usa Binance P2P directo.
        </div>
      </div>
    `;
  }

  if (!ordered.length) {
    return `
      <div class="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div class="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              Sin métodos detectados
            </div>
            <div class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Escanea esta moneda para descubrir bancos y métodos disponibles.
            </div>
          </div>

          <button
            class="btn-ghost text-sm"
            data-scan-paytypes="1"
            data-code="${code}"
          >
            Escanear métodos
          </button>
        </div>
      </div>
    `;
  }

  const chips = ordered
    .map((id) => methodsObj[id])
    .filter(Boolean)
    .map((method) => {
      const active = selected.has(method.identifier);
      const rankClass = obtenerClaseRankingMetodo(method.rank_label);
      const activeClass = active
        ? "ring-2 ring-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
        : rankClass;

      return `
<button
  type="button"
  class="rounded-full border px-3 py-2 text-xs font-semibold transition hover:scale-[1.01] ${activeClass}"
  data-paytype-chip="1"
  data-code="${code}"
  data-paytype="${method.identifier}"
  data-rank-label="${method.rank_label || "Ocasional"}"
>
          <span>${method.name}</span>
          <span class="opacity-70 ml-1">· ${method.rank_label || "Ocasional"}</span>
        </button>
      `;
    })
    .join("");

  const resumenSeleccion = selected.size
    ? `${selected.size} método(s) seleccionado(s)`
    : "Sin filtro de método: Binance buscará sin limitar bancos.";

  const preparado = !!borradorPaytypesMotor[code];

  return `
    <div class="mt-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <div class="text-sm font-semibold">Métodos de pago</div>
            ${
              preparado
                ? `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/15">
                    Cambio preparado
                  </span>`
                : ""
            }
          </div>

          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ${resumenSeleccion}
          </div>
        </div>

<div class="flex flex-wrap gap-2">
  <button
    class="btn-primary text-sm"
    data-apply-paytypes="1"
    data-code="${code}"
  >
    Aplicar métodos
  </button>

  <button
    class="btn-ghost text-sm"
    data-select-rank-paytypes="1"
    data-rank-mode="dominantes"
    data-code="${code}"
  >
    Solo dominantes
  </button>

  <button
    class="btn-ghost text-sm"
    data-select-rank-paytypes="1"
    data-rank-mode="populares"
    data-code="${code}"
  >
    Populares
  </button>

  <button
    class="btn-ghost text-sm"
    data-clear-paytypes="1"
    data-code="${code}"
  >
    Sin filtro
  </button>

  <button
    class="btn-ghost text-sm"
    data-scan-paytypes="1"
    data-code="${code}"
  >
    Escanear
  </button>
</div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        ${chips}
      </div>

      <div class="text-xs text-slate-500 dark:text-slate-400 mt-3">
        Los métodos elegidos se aplican a compra y venta de ${code}.
      </div>
    </div>
  `;
}

function registrarEventosPaytypesMotor() {
  document.querySelectorAll("[data-paytype-chip]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", () => {
      const code = btn.dataset.code;
      const paytype = btn.dataset.paytype;
      if (!code || !paytype) return;

      const actuales = new Set(
        (borradorPaytypesMotor[code]?.payTypes || obtenerPaytypesDesdeDOM(code)).map(String)
      );

      if (actuales.has(paytype)) {
        actuales.delete(paytype);
      } else {
        actuales.add(paytype);
      }

      borradorPaytypesMotor[code] = {
        code,
        payTypes: Array.from(actuales),
      };

      cargarPanelEstrategiasCotizacion();
    });
  });

document.querySelectorAll("[data-select-rank-paytypes]").forEach((btn) => {
  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", () => {
    const code = btn.dataset.code;
    const mode = btn.dataset.rankMode;

    if (!code) return;

    const selected = [];

    document
      .querySelectorAll(`[data-paytype-chip][data-code="${code}"]`)
      .forEach((chip) => {
        const paytype = chip.dataset.paytype;
        const rank = chip.dataset.rankLabel;

        if (!paytype) return;

        if (mode === "dominantes" && rank === "Dominante") {
          selected.push(paytype);
        }

        if (
          mode === "populares" &&
          ["Dominante", "Popular", "Presente"].includes(rank)
        ) {
          selected.push(paytype);
        }
      });

    borradorPaytypesMotor[code] = {
      code,
      payTypes: selected,
    };

    cargarPanelEstrategiasCotizacion();
  });
});

  document.querySelectorAll("[data-clear-paytypes]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", () => {
      const code = btn.dataset.code;
      if (!code) return;

      borradorPaytypesMotor[code] = {
        code,
        payTypes: [],
      };

      cargarPanelEstrategiasCotizacion();
    });
  });

  document.querySelectorAll("[data-apply-paytypes]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", async () => {
      const code = btn.dataset.code;
      if (!code) return;

      try {
        await aplicarPaytypesMotor(code);
      } catch (e) {
        console.error("❌ aplicar métodos:", e);
        mostrarToast(`❌ ${e.message}`);
      }
    });
  });

  document.querySelectorAll("[data-scan-paytypes]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", async () => {
      const code = btn.dataset.code;
      if (!code) return;

      try {
        btn.disabled = true;
        btn.textContent = "Escaneando...";
        await escanearPaytypesMotor(code);
      } catch (e) {
        console.error("❌ escanear métodos:", e);
        mostrarToast(`❌ ${e.message}`);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function obtenerPaytypesDesdeDOM(code) {
  const activos = [];

  document
    .querySelectorAll(`[data-paytype-chip][data-code="${code}"]`)
    .forEach((btn) => {
      const paytype = btn.dataset.paytype;
      const estaActivo =
        btn.className.includes("ring-blue") ||
        btn.className.includes("text-blue-700") ||
        btn.className.includes("dark:text-blue-300");

      if (paytype && estaActivo) activos.push(paytype);
    });

  return activos;
}

async function aplicarPaytypesMotor(code) {
  const change = borradorPaytypesMotor[code];

  if (!change) {
    mostrarToast("No hay cambios preparados para esta moneda");
    return;
  }

  const r = await fetch("/api/admin/quote-strategies/paytypes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": getAdminKey(),
    },
    body: JSON.stringify({
      changes: [
        {
          code,
          payTypes: Array.isArray(change.payTypes) ? change.payTypes : [],
        },
      ],
    }),
  });

  const data = await r.json().catch(() => null);

  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || "No se pudieron aplicar métodos");
  }

  delete borradorPaytypesMotor[code];

  mostrarToast("✅ Métodos aplicados");
  await cargarPanelEstrategiasCotizacion();
  await cargarComparacionMetodoCotizacion();
}

async function escanearPaytypesMotor(code) {
  const r = await fetch(`/api/admin/paytypes/scan/${encodeURIComponent(code)}?rows=80`, {
    method: "POST",
    headers: {
      "x-admin-key": getAdminKey(),
    },
  });

  const data = await r.json().catch(() => null);

  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || "No se pudo escanear métodos");
  }

  mostrarToast(`✅ Métodos actualizados para ${code}`);
  await cargarPanelEstrategiasCotizacion();
}

function describirOperacionDerived(strategy) {
  if (!strategy) return "Cálculo interno";

  if (strategy.operation === "multiply") {
    return `Calculado desde ${strategy.from} con ajuste operativo`;
  }

  if (strategy.operation === "divide") {
    return `Calculado desde ${strategy.from} por división operativa`;
  }

  if (strategy.operation === "add") {
    return `Calculado desde ${strategy.from} sumando ajuste`;
  }

  if (strategy.operation === "subtract") {
    return `Calculado desde ${strategy.from} restando ajuste`;
  }

  return `Calculado desde ${strategy.from || "otra referencia"}`;
}

function describirEstrategiaLado(strategy) {
  if (!strategy) return "Sin configuración";

  const lista = Array.isArray(strategy.providers) ? strategy.providers : [strategy];

  return lista
    .map((item, idx) => {
      const prefijo = idx === 0 ? "Principal" : `Respaldo ${idx}`;

        if (item.provider === "binance") {
          const metodo =
            item.aggregation === "median"
              ? "mediana"
              : "promedio";

          const extremos =
            Number(item.trimLowest || 0) || Number(item.trimHighest || 0)
              ? ` Excluye extremos: ${item.trimLowest || 0} más bajo(s) y ${item.trimHighest || 0} más alto(s).`
              : " Sin exclusión de extremos.";

          let monto = " Sin filtro de monto.";

          if (item.amountMode === "usdt" && Number.isFinite(Number(item.amountUsdt))) {
            monto = ` Monto operativo: ${Number(item.amountUsdt).toLocaleString("es-AR")} USDT. El sistema lo convierte automáticamente a moneda local al consultar Binance.`;
          } else if (Number.isFinite(Number(item.transAmount))) {
            monto = ` Monto de consulta fijo: ${Number(item.transAmount).toLocaleString("es-AR")} en moneda local.`;
          }

          return `${prefijo}: Mercado P2P. Usa ${item.rows || 20} anuncios y calcula por ${metodo}.${extremos}${monto}`;
        }

      if (item.provider === "ptax") {
        return `${prefijo}: Referencia oficial BRL.`;
      }

      if (item.provider === "snapshot") {
        return `${prefijo}: Base guardada del día.`;
      }

      if (item.provider === "derived") {
        return `${prefijo}: ${describirOperacionDerived(item)}.`;
      }

      return `${prefijo}: Fuente externa.`;
    })
    .join(" ");
}

function renderEstrategiasCotizacion(data, quotesData = null, catalogData = null) {
  const grid = document.getElementById("quote-strategies-grid");
  if (!grid) return;

  const strategies = data?.strategies || {};
  const entries = Object.entries(strategies);

  if (!entries.length) {
    grid.innerHTML = `
      <div class="premium-card rounded-2xl p-4 text-sm text-slate-500 dark:text-slate-400">
        No hay estrategias configuradas.
      </div>
    `;
    return;
  }

  grid.innerHTML = entries
    .map(([code, cfg]) => {
      const quote = quotesData?.results?.[code] || null;

const resumenConsulta = quote
  ? `
    <div class="mt-4 rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4">
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Última consulta operativa
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
        ${["buy", "sell"].map((side) => {
        const item = quote?.[side];

        if (!item || item.provider !== "binance") {
          const fuenteNoP2P =
            item?.provider === "ptax"
              ? "PTAX · sin anuncios P2P"
              : "No usa consulta P2P directa.";

          const detalleNoP2P =
            item?.provider === "ptax"
              ? "Referencia oficial BRL del Banco Central de Brasil."
              : "";

          return `
            <div class="rounded-xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3">
              <div class="text-xs text-slate-500 dark:text-slate-400">
                ${traducirLadoCotizacion(side)}
              </div>
              <div class="font-medium mt-1">
                ${fuenteNoP2P}
              </div>
              ${
                detalleNoP2P
                  ? `<div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${detalleNoP2P}</div>`
                  : ""
              }
            </div>
          `;
        }

          const amountUsdt = Number.isFinite(Number(item.amountUsdt))
            ? `${Number(item.amountUsdt).toLocaleString("es-AR")} USDT`
            : "Sin monto operativo";

          const transAmount = Number.isFinite(Number(item.transAmount))
            ? formatearMontoLocalMotor(code, item.transAmount)
            : "—";

          const probePrice = Number.isFinite(Number(item.probePrice))
            ? Number(item.probePrice).toFixed(6)
            : "—";

          return `
            <div class="rounded-xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3">
              <div class="text-xs text-slate-500 dark:text-slate-400">
                ${traducirLadoCotizacion(side)}
              </div>

              <div class="font-semibold mt-1">
                ${amountUsdt} → ${transAmount} ${code}
              </div>

              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Referencia rápida usada: ${probePrice}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `
  : "";

      return `
        <div class="premium-card rounded-2xl p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-lg font-semibold">${code}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configuración actual del motor
              </div>
            </div>
          </div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
  ${renderControlMontoMotor(code, "buy", cfg.buy)}
  ${renderControlMontoMotor(code, "sell", cfg.sell)}
</div>

<div class="mt-5">
  <div class="text-sm font-semibold mb-3">Ajustes de cálculo</div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    ${renderControlAvanzadoMotor(code, "buy", cfg.buy)}
    ${renderControlAvanzadoMotor(code, "sell", cfg.sell)}
  </div>
</div>

${renderSelectorMetodosPagoMotor(code, cfg, catalogData)}

${resumenConsulta}
        </div>
      `;
    })
    .join("");

registrarEventosMontoMotor();
registrarEventosAvanzadosMotor();
registrarEventosPaytypesMotor();
renderResumenBorrador();
}

async function cargarPanelEstrategiasCotizacion() {
  try {
const [strategiesData, quotesData, catalogData] = await Promise.all([
  obtenerEstrategiasCotizacion(),
  obtenerAuditoriaCotizaciones(),
  obtenerCatalogoMetodosPago(),
]);

renderEstrategiasCotizacion(strategiesData, quotesData, catalogData);
  } catch (e) {
    const grid = document.getElementById("quote-strategies-grid");
    if (grid) {
      grid.innerHTML = `
        <div class="premium-card rounded-2xl p-4 text-sm text-red-600 dark:text-red-300">
          No se pudo cargar la configuración del motor.
        </div>
      `;
    }
  }
}

function formatearMontoLocalMotor(code, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  const sinDecimales = ["VES", "ARS", "COP", "CLP", "MXN"];
  const decimales = sinDecimales.includes(code) ? 0 : 2;

  return n.toLocaleString("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

const borradorMotorCotizaciones = {};

function obtenerPrimerProviderBinance(strategy) {
  if (!strategy) return null;
  if (strategy.provider === "binance") return strategy;

  if (Array.isArray(strategy.providers)) {
    return strategy.providers.find((p) => p.provider === "binance") || null;
  }

  return null;
}

function obtenerMontoUsdtEstrategia(strategy) {
  const binance = obtenerPrimerProviderBinance(strategy);
  if (!binance) return null;

  if (binance.amountMode === "usdt" && Number.isFinite(Number(binance.amountUsdt))) {
    return Number(binance.amountUsdt);
  }

  return null;
}

function renderControlMontoMotor(code, side, strategy) {
  const label = side === "buy" ? "Compra" : "Venta";
  const monto = obtenerMontoUsdtEstrategia(strategy);
  const descripcion = describirEstrategiaLado(strategy);
  const esP2P = monto != null;

  if (!esP2P) {
    return `
      <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          ${label}
        </div>

        <div class="text-sm mt-2 text-slate-700 dark:text-slate-200 leading-relaxed">
          ${descripcion}
        </div>

        <div class="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Este lado no usa monto operativo USDT.
        </div>
      </div>
    `;
  }

  const key = `${code}.${side}`;
  const preparado = borradorMotorCotizaciones[key];
  const valorMostrado = preparado?.amountUsdt ?? monto;

  return `
    <div class="rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4">
      <div class="flex items-center justify-between gap-3">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          ${label}
        </div>

        ${
          preparado
            ? `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/15">
                Cambio preparado
              </span>`
            : ""
        }
      </div>

      <div class="text-sm mt-2 text-slate-700 dark:text-slate-200 leading-relaxed">
        ${descripcion}
      </div>

      <div class="mt-4">
        <label class="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 block mb-2">
          Monto operativo
        </label>

        <div class="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="any"
            value="${valorMostrado}"
            data-motor-amount-input="1"
            data-code="${code}"
            data-side="${side}"
            class="input-premium w-full"
            placeholder="Sin filtro"
          />

          <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">
            USDT
          </span>
        </div>

        <div class="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Binance lo recibirá convertido a moneda local al consultar precios.
        </div>
      </div>
    </div>
  `;
}

function registrarEventosMontoMotor() {
  document.querySelectorAll("[data-motor-amount-input]").forEach((input) => {
    if (input.dataset.bound === "1") return;
    input.dataset.bound = "1";

    input.addEventListener("change", () => {
      const code = input.dataset.code;
      const side = input.dataset.side;
      const key = `${code}.${side}`;
      const n = Number(input.value);

      if (!Number.isFinite(n) || n <= 0) {
        delete borradorMotorCotizaciones[key];
      } else {
        borradorMotorCotizaciones[key] = {
          code,
          side,
          amountMode: "usdt",
          amountUsdt: n,
        };
      }

      renderResumenBorradorMotor();
    });
  });
}

function renderResumenBorradorMotor() {
  let box = document.getElementById("quote-engine-draft-summary");

  const panel = document.getElementById("quote-strategies-grid");
  if (!panel) return;

  if (!box) {
    box = document.createElement("div");
    box.id = "quote-engine-draft-summary";
    box.className = "mt-5";
    panel.parentElement.appendChild(box);
  }

  const cambios = Object.values(borradorMotorCotizaciones);

  if (!cambios.length) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `
    <div class="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div class="text-sm font-semibold text-blue-800 dark:text-blue-200">
            Cambios preparados en el motor
          </div>
          <div class="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Estos cambios todavía no se guardan ni afectan el cálculo real.
          </div>
        </div>

<div class="flex items-center gap-2">
  <button id="btn-aplicar-borrador-motor" class="btn-primary text-sm">
    Aplicar configuración
  </button>

  <button id="btn-limpiar-borrador-motor" class="btn-ghost text-sm">
    Limpiar cambios
  </button>
</div>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        ${cambios
          .map(
            (c) => `
              <div class="rounded-2xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 p-3 text-sm">
                <div class="font-semibold">
                  ${c.code} · ${traducirLadoCotizacion(c.side)}
                </div>
                <div class="text-slate-600 dark:text-slate-300 mt-1">
                  Nuevo monto operativo: ${Number(c.amountUsdt).toLocaleString("es-AR")} USDT
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  document.getElementById("btn-limpiar-borrador-motor")?.addEventListener("click", async () => {
    for (const key of Object.keys(borradorMotorCotizaciones)) {
      delete borradorMotorCotizaciones[key];
    }

    await cargarPanelEstrategiasCotizacion();
  });

  document.getElementById("btn-aplicar-borrador-motor")?.addEventListener("click", async () => {
  try {
    await aplicarBorradorMotorCotizaciones();
  } catch (e) {
    console.error("❌ aplicar motor:", e);
    mostrarToast(`❌ ${e.message}`);
  }
});
}

async function aplicarBorradorMotorCotizaciones() {
  const changes = Object.values(borradorMotorCotizaciones);

  if (!changes.length) {
    mostrarToast("No hay cambios preparados");
    return;
  }

  const r = await fetch("/api/admin/quote-strategies/amounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": getAdminKey(),
    },
    body: JSON.stringify({ changes }),
  });

  const data = await r.json().catch(() => null);

  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || "No se pudo aplicar configuración");
  }

  for (const key of Object.keys(borradorMotorCotizaciones)) {
    delete borradorMotorCotizaciones[key];
  }

  mostrarToast("✅ Configuración del motor aplicada");

  await cargarPanelEstrategiasCotizacion();
  await cargarComparacionMetodoCotizacion();
}
