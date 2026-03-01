// main.js — Panel Admin ByteTransfer (con monitoreo + drawer configurar)
// ------------------------------------------------------
"use strict";

console.log("✅ Admin cargado");

// ===== Admin Key (simple) =====
function getAdminKey() {
  return sessionStorage.getItem("BT_ADMIN_KEY") || ""; // mejor que localStorage
}
function setAdminKey(key) {
  sessionStorage.setItem("BT_ADMIN_KEY", key);
}
function clearAdminKey() {
  sessionStorage.removeItem("BT_ADMIN_KEY");
}

function ensureAuthModal() {
  if (document.getElementById("bt-auth-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "bt-auth-overlay";
  overlay.className =
    "fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4";

  overlay.innerHTML = `
    <div class="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
<div class="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-700 text-white">
  <div class="flex items-start justify-between gap-4">
    <div>
      <div class="text-lg font-bold">ByteTransfer Admin</div>
      <div class="text-sm opacity-90 mt-1">Ingresa tu clave para continuar</div>
    </div>

    <img
      src="/logo.png"
      alt="ByteTransfer"
      class="h-10 w-10 rounded-xl bg-white/10 p-1.5 object-contain"
    />
  </div>
</div>

      <div class="p-6">
        <label class="text-sm font-semibold text-gray-700">Admin Key</label>
<div class="mt-2 relative">
  <input id="bt-auth-key" type="password"
    class="w-full pr-12 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="••••••••••••••" autocomplete="current-password" />

  <button id="bt-auth-toggle"
    type="button"
    class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 text-gray-600"
    aria-label="Mostrar clave"
    title="Mostrar clave">
    <!-- Icono ojo (SVG) -->
    <svg id="bt-eye-open" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
      <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
    </svg>

    <!-- Icono ojo tachado (SVG) -->
    <svg id="bt-eye-closed" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" class="hidden">
      <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        d="M3 3l18 18"/>
      <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 1.42-.36"/>
      <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        d="M9.88 5.09A10.3 10.3 0 0 1 12 5c6.5 0 10 7 10 7a17.5 17.5 0 0 1-4.2 5.1"/>
      <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        d="M6.11 6.11C3.8 8 2 12 2 12s3.5 7 10 7c1.1 0 2.1-.17 3.02-.49"/>
    </svg>
  </button>
</div>

        <div id="bt-auth-error" class="mt-3 text-sm text-red-600 hidden"></div>

        <div class="mt-5 flex items-center justify-between gap-3">
          <button id="bt-auth-clear"
            class="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50">
            Limpiar
          </button>
          <button id="bt-auth-submit"
            class="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800">
            Entrar
          </button>
        </div>

        <div class="mt-4 text-xs text-gray-500">
          Tip: si cambias la key en Render, tendrás que volver a ingresar aquí.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // acciones
  overlay.querySelector("#bt-auth-clear").addEventListener("click", () => {
    overlay.querySelector("#bt-auth-key").value = "";
    hideAuthError();
  });

overlay.querySelector("#bt-auth-key").addEventListener("keydown", (e) => {
  if (e.key === "Enter") overlay.querySelector("#bt-auth-submit").click();
});

// Toggle mostrar/ocultar clave
const input = overlay.querySelector("#bt-auth-key");
const toggle = overlay.querySelector("#bt-auth-toggle");
const eyeOpen = overlay.querySelector("#bt-eye-open");
const eyeClosed = overlay.querySelector("#bt-eye-closed");

toggle.addEventListener("click", () => {
  const showing = input.type === "text";
  input.type = showing ? "password" : "text";

  eyeOpen.classList.toggle("hidden", showing);    // 👈 ojo abierto cuando NO está mostrando? NO.
  eyeClosed.classList.toggle("hidden", !showing); // 👈 ojo cerrado cuando sí está mostrando? NO.

  // Vamos a dejarlo coherente:
});

}

function showAuthError(msg) {
  const el = document.getElementById("bt-auth-error");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}
function hideAuthError() {
  const el = document.getElementById("bt-auth-error");
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
}

function lockUI() {
  ensureAuthModal();
  document.getElementById("bt-auth-overlay").classList.remove("hidden");
}
function unlockUI() {
  const ov = document.getElementById("bt-auth-overlay");
  if (ov) ov.classList.add("hidden");
}

async function verifyAdminKey(key) {
  const res = await fetch("/api/admin/verify", {
    method: "GET",
    headers: { "x-admin-key": key },
    cache: "no-store",
  });

  if (res.ok) return { ok: true };

  const j = await res.json().catch(() => null);
  return { ok: false, status: res.status, error: j?.error || `HTTP ${res.status}` };
}

async function requireAdminAccess() {
  lockUI();

  // si ya hay key guardada en session, intentamos
  const existing = getAdminKey();
  if (existing) {
    const v = await verifyAdminKey(existing);
    if (v.ok) {
      unlockUI();
      return true;
    }
    clearAdminKey();
  }

  // enganchar botón entrar
  const btn = document.getElementById("bt-auth-submit");
  const input = document.getElementById("bt-auth-key");

  return await new Promise((resolve) => {
    btn.addEventListener("click", async () => {
      hideAuthError();
      const key = (input.value || "").trim();
      if (!key) return showAuthError("Ingresa la clave.");

      btn.disabled = true;
      btn.textContent = "Verificando...";

      const v = await verifyAdminKey(key);

      btn.disabled = false;
      btn.textContent = "Entrar";

      if (!v.ok) {
        if (v.status === 503) return showAuthError("Admin deshabilitado: falta configurar ADMIN_KEY en el servidor.");
        return showAuthError("Clave incorrecta.");
      }

      setAdminKey(key);
      unlockUI();
      resolve(true);
    }, { once: false });
  });
}

// -------------------------
// Configuración y estado
// -------------------------
const paises = [
  { fiat: "ARS", nombre: "Argentina", emoji: "🇦🇷" },
  { fiat: "COP", nombre: "Colombia",  emoji: "🇨🇴" },
  { fiat: "MXN", nombre: "México",    emoji: "🇲🇽" },
  { fiat: "PEN", nombre: "Perú",      emoji: "🇵🇪" },
  { fiat: "CLP", nombre: "Chile",     emoji: "🇨🇱" },
  { fiat: "BRL", nombre: "Brasil",    emoji: "🇧🇷" },
  { fiat: "VES", nombre: "Venezuela", emoji: "🇻🇪" }
];

const ajustesPorDefecto = { ARS: 8, COP: 8, MXN: 15, PEN: 7, CLP: 7, BRL: 8, VES: 4 };

// Estado configuración (snapshot)
let referenciasExternas = null;
let datosPaises = {};          // { ARS:{compra,venta,ajuste}, ... } (lo que editas y guardas)
let snapshotPrevio = {};       // snapshot cargado de /api/snapshot
let crucesAnteriores = {};     // histórico previo para variación en UI
let modoEdicionActivo = false;

let filtroPais = null;         // ej. "ARS" para filtrar (config)
let rolVista = "origen";       // "origen" | "destino" (config)

let llamadasPendientes = 0;
let timerAdvertencia = null;

// Estado monitoreo (NO toca snapshot)
let mercadoPaises = {};        // { ARS:{compra,venta}, ... } (solo lectura)
let referenciasMercado = null; // referencias actuales del mercado (solo lectura)
let pollingActivo = true;
let pollingInterval = null;
let ultimoTick = null;

// Monitoreo - cruces
let monRolVista = "origen";
let monBuscar = "";

// -------------------------
// Utilidades (UI/format)
// -------------------------
function ensureToast() {
  if (document.getElementById("toastMensaje")) return;

  const div = document.createElement("div");
  div.id = "toastMensaje";
  div.className =
    "fixed top-4 right-4 z-[999] hidden bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg text-sm";
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

function formatearTasa(v) {
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

  // Si no hay datos completos, solo pinta el valor market
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
  const dAbsInt = Math.round(dAbs);
  const dPct = (dAbs / s) * 100;

  const cls =
    dPct > 0 ? "text-green-600" :
    dPct < 0 ? "text-red-600" :
    "text-blue-600";

  const signAbs = dAbsInt > 0 ? `+${dAbsInt}` : `${dAbsInt}`;
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
  if (p == null || !Number.isFinite(p)) return "⏺";
  if (n > p) return "🔼";
  if (n < p) return "🔽";
  return "⏺";
}

function claseCambio(n, p) {
  if (p == null || !Number.isFinite(p)) return "text-blue-600";
  if (n > p) return "text-green-600";
  if (n < p) return "text-red-600";
  return "text-blue-600";
}

function mostrarAdvertenciaPendiente(mostrar = true) {
  const adv = document.getElementById("advertencia-pendiente");
  if (adv) adv.classList.toggle("hidden", !mostrar);
}

function manejarFinDeLlamadas() {
  if (llamadasPendientes === 0) {
    if (timerAdvertencia) clearTimeout(timerAdvertencia);
    timerAdvertencia = setTimeout(() => {
      mostrarAdvertenciaPendiente(true);
    }, 250);
  }
}

// -------------------------
// Referencias (BCV / USDT-VES)
// -------------------------
async function obtenerReferencias() {
  const res = await fetch("/api/referencias", { cache: "no-store" });
  if (!res.ok) throw new Error("No referencias");
  return await res.json();
}

function setRefValue(el, val) {
  if (!el) return;
  const v = (val ?? "");
  if (el.tagName === "INPUT") {
    el.value = v === "—" ? "" : v;
    if (!v) el.placeholder = "—";
  } else {
    el.textContent = v || "—";
  }
}

function renderReferencias() {
  if (!referenciasExternas) return;

  const usdEl = document.getElementById("ref-bcv-usd");
  const eurEl = document.getElementById("ref-bcv-eur");
  const usdtEl = document.getElementById("ref-usdt-ves");
  const fechaEl = document.getElementById("ref-fecha");

  setRefValue(usdEl, referenciasExternas.bcv?.usd ?? "—");
  setRefValue(eurEl, referenciasExternas.bcv?.eur ?? "—");
  if (usdtEl) usdtEl.textContent = referenciasExternas.usdt_ves?.mid ?? "—";

  if (fechaEl) {
    const base = referenciasExternas.actualizado_en
      ? `Actualizado: ${new Date(referenciasExternas.actualizado_en).toLocaleString()}`
      : "—";

    const manual = referenciasExternas?.bcv?.manual ? " • BCV: MANUAL" : "";
    fechaEl.textContent = base + manual;
  }
}


// -------------------------
// Carga/guardado de snapshot
// -------------------------
async function cargarSnapshot() {
  try {
    const res = await fetch("/api/snapshot", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    snapshotPrevio = json || {};

    // Copiamos países existentes y aseguramos estructura
    datosPaises = {};
    for (const p of paises) {
      const sp = snapshotPrevio[p.fiat] || {};
      datosPaises[p.fiat] = {
        compra: Number.isFinite(sp.compra) ? sp.compra : null,
        venta:  Number.isFinite(sp.venta)  ? sp.venta  : null,
        ajuste: Number.isFinite(sp.ajuste) ? sp.ajuste : (sp.ajuste ?? ajustesPorDefecto[p.fiat])
      };
    }

    // Cruces anteriores
    crucesAnteriores = snapshotPrevio.cruces || {};

    // Referencias guardadas dentro del snapshot (si existen)
    referenciasExternas = snapshotPrevio.referencias || null;
    renderReferencias();

    // UI timestamp
    if (json.timestamp) {
      const f = new Date(json.timestamp);
      const el = document.getElementById("ultima-actualizacion");
      if (el) el.textContent = `🕒 Última actualización: ${f.toLocaleString()}`;

      const monSnap = document.getElementById("mon-snapshot-time");
      if (monSnap) monSnap.textContent = `Snapshot: ${f.toLocaleString()}`;
    }
  } catch (err) {
    console.error("❌ cargarSnapshot", err);
    mostrarToast("❌ No se pudo cargar el snapshot");
  }
}

async function guardarSnapshot(datos) {
  try {
    const body = { ...datos, cruces: crucesAnteriores };
    const res = await fetch("/api/guardar-snapshot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": getAdminKey(),
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      mostrarToast(`❌ No se guardó: ${errJson?.error || "Error"}`);
      return false;
    }
    return true;
  } catch (err) {
    mostrarToast("❌ Error de red al guardar");
    return false;
  }
}

// -------------------------
// Binance (para configurar y para monitoreo)
// -------------------------
async function fetchPrecio(fiat, tipo) {
  // BRL con fallback estático (opcional)
  if (fiat === "BRL") return tipo === "BUY" ? 5.74 : 5.49;

  const USDT_LIMITE_VES = 150;
  const precios = [];
  try {
    // Caso particular: VES SELL basado en BUY (ajuste pequeño para spread)
    if (tipo === "SELL" && fiat === "VES") {
      const precioCompra = await fetchPrecio(fiat, "BUY");
      if (!precioCompra) return null;
      return parseFloat((precioCompra * 0.9975).toFixed(6));
    }

    const res = await fetch("/api/binance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fiat, tradeType: tipo, rows: 100 })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const comerciales = j.data || [];

    for (const item of comerciales) {
      const adv = item?.adv;
      if (!adv) continue;

      const precio = parseFloat(adv.price);
      const minVES = parseFloat(adv.minSingleTransAmount) || Infinity;
      const permitido = !adv.isAdvBanned;

      if (!precio || !permitido) continue;

      if (fiat === "VES" && tipo === "SELL") {
        const usdtNecesario = minVES / precio;
        if (usdtNecesario > USDT_LIMITE_VES) continue;
      }

      precios.push(precio);
      if (precios.length === 20) break; // top 20 válidos
    }

    if (!precios.length) return null;
    const promedio = precios.reduce((a, b) => a + b, 0) / precios.length;
    return parseFloat(promedio.toFixed(6));
  } catch (e) {
    console.error("❌ fetchPrecio:", fiat, tipo, e.message || e);
    return null;
  }
}

// -------------------------
// Render tarjetas (configurar)
// -------------------------
function renderTarjetasPaises(modoEdicion = false) {
  const cont = document.getElementById("tarjetas-paises");
  if (!cont) return;

  // si existe tabla vieja, la removemos (por migraciones anteriores)
  const tablaAntigua = document.getElementById("tabla-paises-body")?.parentElement?.parentElement;
  if (tablaAntigua) tablaAntigua.remove();

  cont.innerHTML = "";

  const renderInput = (valor, color, tipo, fiat) => {
    const claseColor = color === "green" ? "text-green-900" : "text-red-900";
    const texto = formatearTasa(valor);
    if (!modoEdicion) {
      return `<div class="mt-1 font-bold text-xl sm:text-2xl leading-tight ${claseColor} break-words truncate max-w-full">${texto}</div>`;
    }
    return `
      <input type="number"
        step="any"
        data-fi="${fiat}"
        data-tipo="${tipo}"
        value="${valor ?? ""}"
        class="w-full px-2 py-1 mt-1 border border-gray-300 rounded-md text-center text-black bg-white ${claseColor}
               text-sm truncate focus:outline-none focus:ring-2 focus:ring-blue-400" />
    `;
  };

  paises.forEach(p => {
    const datos = datosPaises[p.fiat] || {};
    const compra = datos.compra;
    const venta  = datos.venta;
    const ajuste = datos.ajuste ?? ajustesPorDefecto[p.fiat];
    const emoji = p.emoji || "🌐";

    const tarjeta = document.createElement("div");
    tarjeta.className = "backdrop-card text-gray-900 p-3 sm:p-4 flex flex-col justify-between min-h-[140px]";

    tarjeta.innerHTML = `
      <div>
        <h3 class="text-sm font-semibold tracking-wide mb-2">${emoji} ${p.nombre} (${p.fiat})</h3>
        <div class="flex flex-col gap-2">
          <div class="flex-1 bg-green-100 border border-green-300 rounded-md p-2 text-center text-xs">
            <h4 class="text-[11px] font-medium text-green-700">Compra</h4>
            ${renderInput(compra, "green", "compra", p.fiat)}
          </div>
          <div class="flex-1 bg-red-100 border border-red-300 rounded-md p-2 text-center text-xs">
            <h4 class="text-[11px] font-medium text-red-700">Venta</h4>
            ${renderInput(venta, "red", "venta", p.fiat)}
          </div>
        </div>
      </div>
      <div class="mt-2 text-[11px] text-black-700 flex justify-between items-center">
        <span>Ajuste (%)</span>
        ${
          modoEdicion
            ? `<input type="number"
                 step="any"
                 data-fi="${p.fiat}"
                 data-tipo="ajuste"
                 value="${ajuste}"
                 class="w-24 text-center font-semibold text-sm px-2 py-1.5 rounded-md border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />`
            : `<div class="w-12 text-right font-semibold text-gray-800">${ajuste} %</div>`
        }
      </div>
    `;
    cont.appendChild(tarjeta);
  });

  // listeners de inputs creados (activar advertencia)
  setTimeout(() => {
    const inputs = cont.querySelectorAll("input[data-fi]");
    inputs.forEach(input => {
      input.addEventListener("input", () => mostrarAdvertenciaPendiente(true));
    });
  }, 0);
}

// -------------------------
// Cálculo de cruces (configurar) usando datosPaises
// -------------------------
function escribirCruces() {
  const cont = document.getElementById("cruces-container");
  const header = document.getElementById("cruce-encabezado");
  if (!cont) return;

  cont.innerHTML = "";
  cont.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5";

  const activos = new Set(paises.map(p => p.fiat));
  if (header) {
    header.textContent = filtroPais
      ? (rolVista === "origen" ? `Mostrando cruces desde ${filtroPais}` : `Mostrando cruces hacia ${filtroPais}`)
      : "Mostrando todos los cruces";
  }

  activos.forEach(origen => {
    activos.forEach(destino => {
      if (origen === destino) return;

      const o = datosPaises[origen];
      const d = datosPaises[destino];
      if (!o || !d || !o.compra || !d.venta) return;

      const ajuste = Number.isFinite(o.ajuste) ? o.ajuste : ajustesPorDefecto[origen];
      datosPaises[origen].ajuste = ajuste;

      let tasaBase = (destino === "VES" && origen === "COP")
        ? 1 / (d.venta / o.compra)
        : d.venta / o.compra;

      const factor =
        (origen === "COP" && destino === "VES")
          ? (1 + ajuste / 100)
          : (1 - ajuste / 100);

      const tasaFinal = parseFloat((tasaBase * factor).toFixed(6));

      const clave = `${origen}-${destino}`;
      const anterior = crucesAnteriores[clave];
      crucesAnteriores[clave] = tasaFinal;

      if (filtroPais) {
        if (rolVista === "origen" && origen !== filtroPais) return;
        if (rolVista === "destino" && destino !== filtroPais) return;
      }

      const color = claseCambio(tasaFinal, anterior);
      const emoji = iconoCambio(tasaFinal, anterior);
      const flagOrigen  = paises.find(p => p.fiat === origen)?.emoji || "";
      const flagDestino = paises.find(p => p.fiat === destino)?.emoji || "";

      const card = document.createElement("div");
      card.className = "relative backdrop-card p-3 text-sm sm:text-base transition-transform duration-200 hover:scale-[1.01]";
      card.innerHTML = `
        <span class="absolute top-2 right-2 text-xs sm:text-sm opacity-70 ${color} select-none pointer-events-none">${emoji}</span>

        <div class="flex justify-center">
          <h4 class="text-xs sm:text-sm font-semibold text-center">
            <span class="inline-flex items-center gap-1">
              <span>${flagOrigen}</span><span class="font-medium">${origen}</span>
              <span class="text-gray-400">→</span>
              <span>${flagDestino}</span><span class="font-medium">${destino}</span>
            </span>
          </h4>
        </div>

        <div class="mt-2 text-center">
          <span class="block font-mono tabular-nums ${color} text-2xl sm:text-3xl font-extrabold leading-tight break-all">
            ${formatearTasa(tasaFinal)}
          </span>
        </div>

        <div class="mt-2 grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-gray-600">
          <div class="flex items-center gap-1 min-w-0 whitespace-nowrap">
            <span class="text-gray-500">Tasa base</span>:
            <span class="font-mono tabular-nums truncate max-w-[100px] sm:max-w-[140px]">${formatearTasa(tasaBase)}</span>
          </div>
          <div class="text-right whitespace-nowrap">
            <span class="text-gray-500">Ajuste</span>: ${ajuste}%
          </div>
        </div>
      `;
      cont.appendChild(card);
    });
  });
}

// -------------------------
// Popover y filtros (configurar)
// -------------------------
function openPopover() {
  const pop = document.getElementById("popover-paises");
  const btn = document.getElementById("btn-seleccionar-pais");
  if (!pop || !btn) return;
  const rect = btn.getBoundingClientRect();
  pop.style.top = `${rect.bottom + 4}px`;
  pop.style.left = `${rect.left}px`;
  pop.classList.remove("hidden");
}

function closePopover() {
  const pop = document.getElementById("popover-paises");
  if (pop) pop.classList.add("hidden");
}

function resetFiltros() {
  filtroPais = null;
  rolVista = "origen";
  const label = document.getElementById("pais-seleccionado");
  if (label) label.innerText = "Todos";
  const tabO = document.getElementById("tab-origen");
  const tabD = document.getElementById("tab-destino");
  if (tabO) tabO.className = "px-4 py-2 bg-white text-blue-600 font-semibold";
  if (tabD) tabD.className = "px-4 py-2 bg-gray-100 text-gray-600";
  escribirCruces();
}

function initPopover() {
  const ul = document.getElementById("lista-paises");
  if (!ul) return;

  ul.innerHTML = "";
  paises.forEach(p => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "w-full text-left p-3 hover:bg-blue-50";
    btn.innerText = `${p.nombre} (${p.fiat})`;
    btn.dataset.fi = p.fiat;
    btn.addEventListener("click", () => {
      filtroPais = p.fiat;
      const label = document.getElementById("pais-seleccionado");
      if (label) label.innerText = p.nombre;
      closePopover();
      escribirCruces();
    });
    li.appendChild(btn);
    ul.appendChild(li);
  });

  document.addEventListener("click", e => {
    const pop = document.getElementById("popover-paises");
    const btn = document.getElementById("btn-seleccionar-pais");
    if (!pop || !btn) return;
    if (!pop.contains(e.target) && !btn.contains(e.target)) closePopover();
  });
}

// ======================================================
// MONITOREO (NO guarda / NO modifica datosPaises)
// ======================================================
async function obtenerMercadoLive() {
  const resultado = {};
  for (const p of paises) {
    const fiat = p.fiat;
    const compra = await fetchPrecio(fiat, "BUY");
    const venta = await fetchPrecio(fiat, "SELL");
    resultado[fiat] = { compra, venta };
  }
  mercadoPaises = resultado;

  try {
    referenciasMercado = await obtenerReferencias();
  } catch {
    referenciasMercado = null;
  }

  ultimoTick = new Date();
  const monMarket = document.getElementById("mon-market-time");
  if (monMarket) monMarket.textContent = `Market: ${ultimoTick.toLocaleString()}`;

  return resultado;
}

function renderMonitoreo() {
  // Referencias (monitoreo)
const snapRefs = snapshotPrevio?.referencias || null;

// BCV USD/EUR
{
  const usdEl = document.getElementById("mon-bcv-usd");
  const eurEl = document.getElementById("mon-bcv-eur");

  const marketUsd = referenciasMercado?.bcv?.usd ?? null;
  const marketEur = referenciasMercado?.bcv?.eur ?? null;

  const snapUsd = snapRefs?.bcv?.usd ?? null;
  const snapEur = snapRefs?.bcv?.eur ?? null;

  pintarDelta(usdEl, marketUsd, snapUsd, "Snapshot BCV USD");
  pintarDelta(eurEl, marketEur, snapEur, "Snapshot BCV EUR");
}

// USDT → VES
{
  const usdtEl = document.getElementById("mon-usdt-ves");

  const marketUsdtVes = referenciasMercado?.usdt_ves?.mid ?? null;
  const snapUsdtVes = snapRefs?.usdt_ves?.mid ?? null;

  pintarDelta(usdtEl, marketUsdtVes, snapUsdtVes, "Snapshot USDT→VES");
}

  const refFecha = document.getElementById("mon-ref-fecha");
  if (refFecha) {
    refFecha.textContent = referenciasMercado?.actualizado_en
      ? `Refs: ${new Date(referenciasMercado.actualizado_en).toLocaleString()}`
      : "—";
  }

  // Grid monedas (comparación snapshot vs market)
  const cont = document.getElementById("mon-grid-monedas");
  if (!cont) return;
  cont.innerHTML = "";

  let top = { fiat: null, delta: 0, snap: null, market: null };

  for (const p of paises) {
    const s = snapshotPrevio?.[p.fiat];
    const m = mercadoPaises?.[p.fiat];
    if (!s || !m) continue;

    const sC = Number(s.compra);
    const sV = Number(s.venta);
    const mC = Number(m.compra);
    const mV = Number(m.venta);

    if (!Number.isFinite(sC) || !Number.isFinite(sV) || !Number.isFinite(mC) || !Number.isFinite(mV)) continue;

    const midSnap = (sC + sV) / 2;
    const midMarket = (mC + mV) / 2;
    const deltaPct = ((midMarket - midSnap) / midSnap) * 100;

    if (Math.abs(deltaPct) > Math.abs(top.delta)) {
      top = { fiat: p.fiat, delta: deltaPct, snap: midSnap, market: midMarket };
    }

    const card = document.createElement("div");
    card.className = "backdrop-card p-3 text-sm";
    const cls = deltaPct > 0 ? "text-green-600" : deltaPct < 0 ? "text-red-600" : "";
    card.innerHTML = `
      <div class="font-semibold">${p.emoji} ${p.fiat}</div>
      <div class="mt-1 text-xs opacity-70">Snapshot</div>
      <div class="font-mono">${Math.round(midSnap)}</div>
      <div class="mt-1 text-xs opacity-70">Market</div>
      <div class="font-mono">${Math.round(midMarket)}</div>
      <div class="mt-2 font-semibold ${cls}">
        ${deltaPct.toFixed(2)} %
      </div>
    `;
    cont.appendChild(card);
  }

  // Estado global + recomendación (basado en riesgo de margen)
  const estado = document.getElementById("mon-estado");
  const rec = document.getElementById("mon-recomendacion");
  const recSub = document.getElementById("mon-recomendacion-sub");
  const topMov = document.getElementById("mon-top-mov");
  const topMovSub = document.getElementById("mon-top-mov-sub");

  // Reglas de negocio:
  // - PEN/CLP suelen trabajarse con ganancia mínima 6%  -> caída crítica ≈ 1.5%
  // - resto mínimo 8%                                  -> caída crítica ≈ 3.5%
  // - subidas no molestan salvo "absurdo" >= +10%
  // Margen mínimo por ORIGEN (cuando esa moneda es el origen de la operación)
  // Ej: si el ORIGEN es PEN o CLP, trabajas con mínimo 6%. En el resto mínimo 8%.
  const MARGEN_MIN_POR_ORIGEN = { PEN: 6, CLP: 6 };
  const MARGEN_MIN_DEFAULT = 8;

  function umbralCaidaCritica(origenFiat) {
    const margen = MARGEN_MIN_POR_ORIGEN[origenFiat] ?? MARGEN_MIN_DEFAULT;

    const crit = margen - 4.5; // 6->1.5 ; 8->3.5
    // por si alguien cambia reglas a futuro y queda muy bajo
    return Math.max(1.0, crit);
  }

  const UMBRAL_SUBIDA_ABSURDA = 10.0;

  // Para mostrar "top movimiento" informativo (abs)
  let topAbs = { fiat: null, delta: 0, snap: null, market: null };

  // Para decidir el estado global (prioridad: caídas)
  let peorEstado = { sev: -1, fiat: null, delta: null, crit: null }; // sev: 3 red, 2 yellow, 1 purple, 0 ok
  function evaluarEstado(fiat, deltaPct) {
    if (!Number.isFinite(deltaPct)) return { sev: -1 };
    const crit = umbralCaidaCritica(fiat);
    const warn = Math.max(1.0, crit - 0.5); // franja amarilla antes del crítico

    if (deltaPct <= -crit) return { sev: 3, crit, label: "🔥 Riesgo margen", rec: "Actualizar snapshot YA" };
    if (deltaPct <= -warn) return { sev: 2, crit, label: "⚠️ Bajando", rec: "Vigilar / preparar update" };
    if (deltaPct >= UMBRAL_SUBIDA_ABSURDA) return { sev: 1, crit, label: "🟣 Subida absurda", rec: "Actualizar por control" };
    return { sev: 0, crit, label: "✅ Estable", rec: "No requiere acción" };
  }

  // Recorremos otra vez las monedas ya renderizadas (usamos mismos datos)
  for (const p of paises) {
    const s = snapshotPrevio?.[p.fiat];
    const m = mercadoPaises?.[p.fiat];
    if (!s || !m) continue;

    const sC = Number(s.compra);
    const sV = Number(s.venta);
    const mC = Number(m.compra);
    const mV = Number(m.venta);
    if (!Number.isFinite(sC) || !Number.isFinite(sV) || !Number.isFinite(mC) || !Number.isFinite(mV)) continue;

    const midSnap = (sC + sV) / 2;
    const midMarket = (mC + mV) / 2;
    const deltaPct = ((midMarket - midSnap) / midSnap) * 100;

    // top ABS (solo informativo)
    if (Math.abs(deltaPct) > Math.abs(topAbs.delta)) {
      topAbs = { fiat: p.fiat, delta: deltaPct, snap: midSnap, market: midMarket };
    }

    // estado por riesgo (prioriza caídas por fiat)
    const st = evaluarEstado(p.fiat, deltaPct);
    if (st.sev > peorEstado.sev) {
      peorEstado = { ...st, fiat: p.fiat, delta: deltaPct };
    } else if (st.sev === peorEstado.sev && st.sev >= 2) {
      // si ambos son amarillos/rojos, nos quedamos con el más negativo
      if (deltaPct < (peorEstado.delta ?? 999)) peorEstado = { ...st, fiat: p.fiat, delta: deltaPct };
    }
  }

  // Pintar top ABS
  if (topMov) topMov.textContent = topAbs.fiat ? `${topAbs.fiat} ${topAbs.delta.toFixed(2)}%` : "—";
  if (topMovSub) topMovSub.textContent = topAbs.fiat
    ? `Snapshot ~${Math.round(topAbs.snap)} | Market ~${Math.round(topAbs.market)}`
    : "—";

  // Pintar estado global
  if (!peorEstado.fiat) {
    if (estado) estado.textContent = "Estado: —";
    if (rec) rec.textContent = "—";
    if (recSub) recSub.textContent = "—";
  } else {
    const crit = peorEstado.crit;
    if (estado) estado.textContent = peorEstado.label;
    if (rec) rec.textContent = peorEstado.rec;

    // Mensaje explicando el umbral por país
       const margen = (MARGEN_MIN_POR_ORIGEN[peorEstado.fiat] ?? MARGEN_MIN_DEFAULT);
      const critTxt = `Umbral caída crítica ~${crit.toFixed(1)}% (margen mín ${margen}%)`;

    if (recSub) {
      recSub.textContent =
        `Peor caso: ${peorEstado.fiat} (${peorEstado.delta.toFixed(2)}%). ${critTxt}.`;
    }
  }

  // Poll UI
  const pollStatus = document.getElementById("mon-poll-status");
  const pollNext = document.getElementById("mon-poll-next");
  if (pollStatus) pollStatus.textContent = pollingActivo ? "Activo" : "Pausado";
  if (pollNext) pollNext.textContent = pollingActivo ? "• cada 60s" : "• detenido";

  // Cruces consulta rápida (usa snapshot actual)
  renderMonCruces();
}

async function tickMonitoreo() {
  if (!pollingActivo) return;
  try {
    await obtenerMercadoLive();
    renderMonitoreo();
  } catch (e) {
    console.error("❌ tickMonitoreo", e);
  }
}

function iniciarPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(tickMonitoreo, 60000);
}

function detenerPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = null;
}

// -------------------------
// Cruces MONITOREO (consulta rápida) - usa datos del snapshot (datosPaises)
// -------------------------
function renderMonCruces() {
  const cont = document.getElementById("mon-cruces-container");
  const header = document.getElementById("mon-cruce-encabezado");
  if (!cont) return;

  cont.innerHTML = "";

  const activos = new Set(paises.map(p => p.fiat));

  const buscar = (monBuscar || "").trim().toUpperCase();
  if (header) {
    header.textContent = buscar
      ? `Filtro: "${buscar}"`
      : (monRolVista === "origen" ? "Cruces por origen" : "Cruces por destino");
  }

  const matches = (fiat) => !buscar || fiat.includes(buscar);

  activos.forEach(origen => {
    activos.forEach(destino => {
      if (origen === destino) return;

      if (monRolVista === "origen" && buscar && !matches(origen) && !matches(destino)) return;
      if (monRolVista === "destino" && buscar && !matches(destino) && !matches(origen)) return;

      const o = datosPaises[origen];
      const d = datosPaises[destino];
      if (!o || !d || !o.compra || !d.venta) return;

      const ajuste = Number.isFinite(o.ajuste) ? o.ajuste : ajustesPorDefecto[origen];

      let tasaBase = (destino === "VES" && origen === "COP")
        ? 1 / (d.venta / o.compra)
        : d.venta / o.compra;

      const factor =
        (origen === "COP" && destino === "VES")
          ? (1 + ajuste / 100)
          : (1 - ajuste / 100);

      const tasaFinal = parseFloat((tasaBase * factor).toFixed(6));

      const flagOrigen  = paises.find(p => p.fiat === origen)?.emoji || "";
      const flagDestino = paises.find(p => p.fiat === destino)?.emoji || "";

      const card = document.createElement("div");
      card.className = "backdrop-card p-3 text-sm";
      card.innerHTML = `
        <div class="text-xs font-semibold opacity-90 text-center">
          ${flagOrigen} ${origen} → ${flagDestino} ${destino}
        </div>
        <div class="mt-2 text-center font-mono text-xl font-extrabold">
          ${formatearTasa(tasaFinal)}
        </div>
      `;
      cont.appendChild(card);
    });
  });
}

// ======================================================
// EVENTOS UI (configurar + monitoreo)
// ======================================================
function bindUI() {
  // --- Configurar ---
  document.getElementById("btn-seleccionar-pais")?.addEventListener("click", e => {
    e.stopPropagation();
    openPopover();
  });
  document.getElementById("btn-resetear")?.addEventListener("click", resetFiltros);

  document.getElementById("tab-origen")?.addEventListener("click", () => {
    rolVista = "origen";
    const tabO = document.getElementById("tab-origen");
    const tabD = document.getElementById("tab-destino");
    if (tabO) tabO.className = "px-4 py-2 bg-white dark:bg-gray-800 text-brandBlue font-semibold";
    if (tabD) tabD.className = "px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600";
    escribirCruces();
  });

  document.getElementById("tab-destino")?.addEventListener("click", () => {
    rolVista = "destino";
    const tabO = document.getElementById("tab-origen");
    const tabD = document.getElementById("tab-destino");
    if (tabD) tabD.className = "px-4 py-2 bg-white dark:bg-gray-800 text-brandBlue font-semibold";
    if (tabO) tabO.className = "px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600";
    escribirCruces();
  });

  document.getElementById("btn-toggle-edicion")?.addEventListener("click", () => {
    modoEdicionActivo = !modoEdicionActivo;
    renderTarjetasPaises(modoEdicionActivo);
    mostrarAdvertenciaPendiente(false);

    // Habilitar/Deshabilitar edición de BCV (si existe en HTML como input)
    const inUsd = document.getElementById("ref-bcv-usd");
    const inEur = document.getElementById("ref-bcv-eur");
    if (inUsd && inUsd.tagName === "INPUT") inUsd.disabled = !modoEdicionActivo;
    if (inEur && inEur.tagName === "INPUT") inEur.disabled = !modoEdicionActivo;

    // Estructura mínima (por si se edita antes de traer refs)
    if (!referenciasExternas) referenciasExternas = {};
    if (!referenciasExternas.bcv) referenciasExternas.bcv = { usd: null, eur: null };

    const btn = document.getElementById("btn-toggle-edicion");
    if (btn) btn.textContent = modoEdicionActivo ? "🔒 Finalizar Edición" : "✏️ Editar Precios";
  });

  // Modal confirmación (Actualizar precios)
  document.getElementById("btn-refrescar")?.addEventListener("click", () => {
    document.getElementById("modal-confirmacion")?.classList.remove("hidden");
  });

  window.cerrarModalConfirmacion = function cerrarModalConfirmacion() {
    document.getElementById("modal-confirmacion")?.classList.add("hidden");
  };

  // Confirmar Binance: actualiza datosPaises (config), luego referencias (sin guardar), marca pendiente
  document.getElementById("btn-confirmar-binance")?.addEventListener("click", async () => {
    window.cerrarModalConfirmacion?.();

    // 1) Persistir ajuste desde inputs (si hay)
    for (const p of paises) {
      const fiat = p.fiat;
      if (!datosPaises[fiat]) datosPaises[fiat] = {};
      const inputAjuste = document.querySelector(`input[data-fi="${fiat}"][data-tipo="ajuste"]`);
      const ajusteNuevo = inputAjuste ? parseFloat(inputAjuste.value) : null;
      const ajustePrevio = datosPaises[fiat].ajuste;
      datosPaises[fiat].ajuste =
        Number.isFinite(ajusteNuevo) ? ajusteNuevo : (Number.isFinite(ajustePrevio) ? ajustePrevio : ajustesPorDefecto[fiat]);

      // Limpiar compra/venta para rellenar con nuevos valores
      datosPaises[fiat].compra = null;
      datosPaises[fiat].venta  = null;
    }

    renderTarjetasPaises(modoEdicionActivo);

    // 2) Traer precios (secuencial)
    llamadasPendientes = paises.length * 2;
    for (const p of paises) {
      const fiat = p.fiat;
      const compra = await fetchPrecio(fiat, "BUY");
      llamadasPendientes--;
      const venta  = await fetchPrecio(fiat, "SELL");
      llamadasPendientes--;

      datosPaises[fiat].compra = compra;
      datosPaises[fiat].venta  = venta;
    }

    manejarFinDeLlamadas();
    renderTarjetasPaises(modoEdicionActivo);
    escribirCruces();

    // 3) Traer referencias externas (SIN guardar)
    try {
      referenciasExternas = await obtenerReferencias();
      renderReferencias();
    } catch {
      mostrarToast("⚠️ No se pudieron actualizar referencias");
    }

    // Pendiente de guardar
    mostrarAdvertenciaPendiente(true);
  });

  document.getElementById("btn-aplicar-ajustes")?.addEventListener("click", () => {
    for (const p of paises) {
      const fiat = p.fiat;
      const ajuste = parseFloat(document.querySelector(`input[data-fi="${fiat}"][data-tipo="ajuste"]`)?.value);
      const compra = parseFloat(document.querySelector(`input[data-fi="${fiat}"][data-tipo="compra"]`)?.value);
      const venta  = parseFloat(document.querySelector(`input[data-fi="${fiat}"][data-tipo="venta"]`)?.value);

      if (!datosPaises[fiat]) datosPaises[fiat] = {};
      datosPaises[fiat].ajuste = Number.isFinite(ajuste) ? ajuste : (datosPaises[fiat].ajuste ?? ajustesPorDefecto[fiat]);
      if (Number.isFinite(compra)) datosPaises[fiat].compra = compra;
      if (Number.isFinite(venta))  datosPaises[fiat].venta  = venta;
    }

    // Aplicar BCV manual desde inputs (si existen)
    const bcvUsdEl = document.getElementById("ref-bcv-usd");
    const bcvEurEl = document.getElementById("ref-bcv-eur");
    const usd = bcvUsdEl && bcvUsdEl.tagName === "INPUT" ? parseFloat(bcvUsdEl.value) : NaN;
    const eur = bcvEurEl && bcvEurEl.tagName === "INPUT" ? parseFloat(bcvEurEl.value) : NaN;

    if (!referenciasExternas) referenciasExternas = {};
    if (!referenciasExternas.bcv) referenciasExternas.bcv = {};

    let tocasteBcv = false;
    if (Number.isFinite(usd)) { referenciasExternas.bcv.usd = formatearTasa(usd); tocasteBcv = true; }
    if (Number.isFinite(eur)) { referenciasExternas.bcv.eur = formatearTasa(eur); tocasteBcv = true; }

    if (tocasteBcv) {
      referenciasExternas.bcv.manual = true;
      referenciasExternas.bcv.fuente = "manual";
      renderReferencias();
    }

    renderTarjetasPaises(modoEdicionActivo);
    escribirCruces();
    mostrarAdvertenciaPendiente(true);
  });

  document.getElementById("btn-guardar-ajustes")?.addEventListener("click", async () => {
    // Actualizamos datosPaises desde inputs (si están)
    for (const p of paises) {
      const fiat = p.fiat;
      const ajuste = parseFloat(document.querySelector(`input[data-fi="${fiat}"][data-tipo="ajuste"]`)?.value);
      const compra = parseFloat(document.querySelector(`input[data-fi="${fiat}"][data-tipo="compra"]`)?.value);
      const venta  = parseFloat(document.querySelector(`input[data-fi="${fiat}"][data-tipo="venta"]`)?.value);

      if (!datosPaises[fiat]) datosPaises[fiat] = {};
      datosPaises[fiat].ajuste = Number.isFinite(ajuste) ? ajuste : (datosPaises[fiat].ajuste ?? ajustesPorDefecto[fiat]);
      if (Number.isFinite(compra)) datosPaises[fiat].compra = compra;
      if (Number.isFinite(venta))  datosPaises[fiat].venta  = venta;
    }

    // Actualizar referencias a la hora de guardar (sin pisar BCV manual si lo editaste)
    const bcvUsdEl = document.getElementById("ref-bcv-usd");
    const bcvEurEl = document.getElementById("ref-bcv-eur");
    const manualUsd = bcvUsdEl && bcvUsdEl.tagName === "INPUT" ? parseFloat(bcvUsdEl.value) : NaN;
    const manualEur = bcvEurEl && bcvEurEl.tagName === "INPUT" ? parseFloat(bcvEurEl.value) : NaN;
    const hayManualBcv = Number.isFinite(manualUsd) || Number.isFinite(manualEur);

    try {
      const fresh = await obtenerReferencias();

      if (hayManualBcv) {
        if (!fresh.bcv) fresh.bcv = {};
        if (Number.isFinite(manualUsd)) fresh.bcv.usd = formatearTasa(manualUsd);
        if (Number.isFinite(manualEur)) fresh.bcv.eur = formatearTasa(manualEur);
        fresh.bcv.manual = true;
        fresh.bcv.fuente = "manual";
      }

      referenciasExternas = fresh;
      renderReferencias();
    } catch {
      // Si falló la API, igual guardamos con lo que haya + tu BCV manual
      if (!referenciasExternas) referenciasExternas = {};
      if (!referenciasExternas.bcv) referenciasExternas.bcv = {};

      if (hayManualBcv) {
        if (Number.isFinite(manualUsd)) referenciasExternas.bcv.usd = formatearTasa(manualUsd);
        if (Number.isFinite(manualEur)) referenciasExternas.bcv.eur = formatearTasa(manualEur);
        referenciasExternas.bcv.manual = true;
        referenciasExternas.bcv.fuente = "manual";
      }

      renderReferencias();
      mostrarToast("⚠️ No se pudieron actualizar referencias (guardando con BCV manual/estado actual)");
    }

const ok = await guardarSnapshot({
  ...datosPaises,
  referencias: referenciasExternas,
  timestamp: new Date().toISOString()
});

if (!ok) return;

mostrarToast("✅ Snapshot guardado");


    // Actualizar snapshotPrevio en memoria (para monitoreo)
    snapshotPrevio = JSON.parse(JSON.stringify({ ...datosPaises, referencias: referenciasExternas, cruces: crucesAnteriores }));

    const el = document.getElementById("ultima-actualizacion");
    if (el) el.textContent = `🕒 Última actualización: ${new Date().toLocaleString()}`;

    const monSnap = document.getElementById("mon-snapshot-time");
    if (monSnap) monSnap.textContent = `Snapshot: ${new Date().toLocaleString()}`;

    renderTarjetasPaises(modoEdicionActivo);
    escribirCruces();
    mostrarAdvertenciaPendiente(false);
    // refrescar monitoreo contra el nuevo snapshot
    renderMonitoreo();
  });


  // BCV manual: marcar pendiente cuando se edita
  document.getElementById("ref-bcv-usd")?.addEventListener("input", () => mostrarAdvertenciaPendiente(true));
  document.getElementById("ref-bcv-eur")?.addEventListener("input", () => mostrarAdvertenciaPendiente(true));

  // --- Monitoreo ---
  document.getElementById("btn-mon-refresh")?.addEventListener("click", async () => {
    await tickMonitoreo();
    mostrarToast("🔄 Chequeo listo");
  });

  document.getElementById("btn-mon-toggle")?.addEventListener("click", (e) => {
    pollingActivo = !pollingActivo;
    if (e?.target) e.target.textContent = pollingActivo ? "⏸️ Pausar" : "▶️ Reanudar";
    if (pollingActivo) iniciarPolling();
    else detenerPolling();
    renderMonitoreo();
  });

  document.getElementById("mon-tab-origen")?.addEventListener("click", () => {
    monRolVista = "origen";
    const a = document.getElementById("mon-tab-origen");
    const b = document.getElementById("mon-tab-destino");
    if (a) a.className = "px-4 py-2 bg-white dark:bg-gray-800 text-brandBlue font-semibold";
    if (b) b.className = "px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600";
    renderMonCruces();
  });

  document.getElementById("mon-tab-destino")?.addEventListener("click", () => {
    monRolVista = "destino";
    const a = document.getElementById("mon-tab-origen");
    const b = document.getElementById("mon-tab-destino");
    if (b) b.className = "px-4 py-2 bg-white dark:bg-gray-800 text-brandBlue font-semibold";
    if (a) a.className = "px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600";
    renderMonCruces();
  });

  document.getElementById("mon-buscar-cruce")?.addEventListener("input", (e) => {
    monBuscar = e.target.value || "";
    renderMonCruces();
  });

  document.getElementById("mon-resetear")?.addEventListener("click", () => {
    monBuscar = "";
    const inp = document.getElementById("mon-buscar-cruce");
    if (inp) inp.value = "";
    monRolVista = "origen";
    const a = document.getElementById("mon-tab-origen");
    const b = document.getElementById("mon-tab-destino");
    if (a) a.className = "px-4 py-2 bg-white dark:bg-gray-800 text-brandBlue font-semibold";
    if (b) b.className = "px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600";
    renderMonCruces();
  });
}

// -------------------------
// Init
// -------------------------
(async () => {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "flex";

  ensureToast();
  await requireAdminAccess();
  bindUI();

  await cargarSnapshot();
  initPopover();

  // Render configurar (drawer)
  renderTarjetasPaises(modoEdicionActivo);
  escribirCruces();
  mostrarAdvertenciaPendiente(false);

  // Monitoreo inicial + polling
  await tickMonitoreo();
  iniciarPolling();

  if (loader) loader.style.display = "none";
})();
