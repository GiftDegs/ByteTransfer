import { DOM } from "./dom.js";
import { paisesDisponibles, CONFIG } from "../core/config.js";
import { formatearTasa, formatearFecha, redondearPorMoneda, userLocale } from "../core/utils.js";
import { calcularCruce } from "../core/fx.js";
import { obtenerTasa, obtenerBCV } from "../services/rates.js";
import { obtenerStatus } from "../services/status.js";
import { mostrarToast } from "./toasts.js";
import { showBanner, hideBanner, mostrarConfirmacionVerdeAutoOcultar } from "./banners.js";
import { evaluateOps, openingTextTodayLocal } from "../core/time.js";
import { getState, setState } from "../state/appState.js";

let origenSeleccionado = null;
let destinoSeleccionado = null;
let mode = null;
let tasa = null;
let tasaCompraUSD = null;
let lastCalc = null;
let modalActivo = false;
let ops = { open: false, fresh: false, allowWhats: false, message: '' };

// === BCV state ===
let bcvActivo = false;
let bcvTipo = null;      // "USD" | "EUR" | "CUSTOM"
let bcvTasa = null;      // número (VES por USD)
let bcvRange = { min: null, max: null };

function isBCVFlow() {
  return bcvActivo === true && destinoSeleccionado === "VES";
}

function resetBCVStateAndUI() {
  bcvActivo = false;
  bcvTipo = null;
  bcvTasa = null;
  bcvRange = { min: null, max: null };

  // UI
  DOM.bcvBox?.classList.add("hidden");
  DOM.bcvCustomRow?.classList.add("hidden");
  if (DOM.bcvTitulo) DOM.bcvTitulo.textContent = "";
  if (DOM.bcvCustomHelp) DOM.bcvCustomHelp.textContent = "";
  if (DOM.bcvTasaCustom) DOM.bcvTasaCustom.value = "";

  // restaurar botones normales
  DOM.btnEnviar?.classList.remove("hidden");
  DOM.btnLlegar?.classList.remove("hidden");
  DOM.btnLlegarBCV?.classList.toggle("hidden", destinoSeleccionado !== "VES");

  // input vuelve a normal
  DOM.inputMonto.disabled = false;
}

function nombreMoneda(codigo) {
  const map = {
    ARS: "Pesos argentinos",
    COP: "Pesos colombianos",
    VES: "Bolívares",
    CLP: "Pesos chilenos",
    PEN: "Soles",
    MXN: "Pesos mexicanos",
    BRL: "Reales",
    USD: "Dólares",
    EUR: "Euros",
  };
  return map[codigo] || codigo;
}

function mostrarModalMontoGrande(callback) {
  modalActivo = true;
  const modal = document.getElementById("modalMontoGrande");
  const btnCerrar = document.getElementById("btnCerrarModalMonto");

  if (!modal || !btnCerrar) return;

  modal.classList.remove("hidden");
  document.body.classList.add("modal-activo");
  DOM.inputMonto.blur();

  const cerrarYContinuar = () => {
    modalActivo = false;
    modal.classList.add("hidden");
    document.body.classList.remove("modal-activo");
    btnCerrar.removeEventListener("click", cerrarYContinuar);
    if (typeof callback === "function") callback();
  };

  btnCerrar.addEventListener("click", cerrarYContinuar);
}

// Back helper
function showBack(show = true) {
  const btn = DOM?.btnVolverGlobal || document.getElementById("btnVolverGlobal");
  if (!btn) return;
  btn.classList.toggle("hidden", !show);
}

// --- Mostrar pill desde el arranque (Paso 1) ---
(async function initPillEarly() {
  try {
    const manual = await obtenerStatus();
    ops = evaluateOps(null, manual);
  } catch {
    ops = evaluateOps(null, { open: null, message: '' });
  }
  updateHorarioPill();
})();

function updateHorarioPill() {
  const el = document.getElementById('statusHeader');
  if (!el) return;

  const hoy = openingTextTodayLocal(userLocale);
  const abierto = ops.open === true;

  el.className = 'mt-1 text-base sm:text-lg inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full border shadow-sm';

  el.innerHTML = abierto
    ? `<div class="flex flex-col items-center text-center">
         <span class="flex items-center gap-1 font-bold text-emerald-900 dark:text-white">
           <span class="relative inline-flex h-3 w-3 rounded-full bg-emerald-600">
             <span class="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
           </span>
           ABIERTO
         </span>
         <span class="text-sm opacity-90 animate-pulse">${hoy}</span>
       </div>`
    : `<div class="flex flex-col items-center text-center">
         <span class="flex items-center gap-1 font-bold text-red-900 dark:text-white">
           <span class="relative inline-flex h-3 w-3 rounded-full bg-red-600">
             <span class="absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75 animate-ping"></span>
           </span>
           CERRADO
         </span>
         <span class="text-sm opacity-90 animate-pulse">${hoy}</span>
       </div>`;

  if (abierto) {
    el.classList.add('bg-emerald-600/30', 'border-emerald-700', 'text-emerald-900', 'dark:text-white');
  } else {
    el.classList.add('bg-red-600/30', 'border-red-700', 'text-red-900', 'dark:text-white', 'animate-pulse');
  }
}

function updateWhatsButton() {
  if (!DOM.btnWhats) return;
  const allow = ops.allowWhats;
  DOM.btnWhats.disabled = !allow;
  DOM.btnWhats.classList.toggle('opacity-50', !allow);
  DOM.btnWhats.classList.toggle('cursor-not-allowed', !allow);
  DOM.btnWhats.textContent = allow ? 'Ir a WhatsApp' : 'Cerrado / Solo referencia';
}

function setModoButtonsEnabled(enabled) {
  [DOM.btnEnviar, DOM.btnLlegar].forEach(b => {
    b.disabled = !enabled;
    b.classList.toggle("opacity-50", !enabled);
    b.classList.toggle("cursor-not-allowed", !enabled);
    b.classList.toggle("hover:scale-105", enabled);
  });
}

function obtenerPais(cod) {
  return paisesDisponibles.find(p => p.codigo === cod);
}

function textosSegunPaises() {
  const o = obtenerPais(origenSeleccionado);
  const d = obtenerPais(destinoSeleccionado);
  if (!o || !d) {
    return {
      btnEnviar: "¿Cuánto dinero quieres enviar?",
      btnLlegar: "¿Cuánto quieres que llegue?",
      preguntaEnviar: "¿Cuánto vas a enviar?",
      preguntaLlegar: "¿Cuánto quieres que llegue?"
    };
  }
  return {
    btnEnviar: `¿Cuántos ${o.moneda} quieres enviar?`,
    btnLlegar: `¿Cuántos ${d.moneda} quieres que lleguen?`,
    preguntaEnviar: `¿Cuántos ${o.moneda} vas a enviar?`,
    preguntaLlegar: `¿Cuántos ${d.moneda} quieres que lleguen?`
  };
}

function actualizarTextosUI() {
  const { btnEnviar: tEnviar, btnLlegar: tLlegar } = textosSegunPaises();
  DOM.btnEnviar.textContent = tEnviar;
  DOM.btnLlegar.textContent = tLlegar;

  const o = obtenerPais(origenSeleccionado);
  const d = obtenerPais(destinoSeleccionado);
  if (o && d) {
    const isSmall = window.innerWidth < 420;
    const subt = isSmall ? `${o.codigo} → ${d.codigo}` : `${o.nombre} (${o.codigo}) → ${d.nombre} (${d.codigo})`;
    DOM.subtituloHeader.textContent = subt;
    DOM.subtituloHeader.className =
      "transition-colors duration-500 text-[clamp(0.9rem,2.2vw,1rem)] text-[#666666] dark:text-gray-300 text-center -mt-1";
  }

  DOM.btnLlegarBCV?.classList.toggle("hidden", destinoSeleccionado !== "VES");
}

function setInputStyle({ state, msg = null }) {
  DOM.inputMonto.classList.remove(
    "border-blue-300", "border-green-500", "border-red-500",
    "focus:ring-blue-300", "focus:ring-green-500", "focus:ring-red-500"
  );
  if (msg !== null) DOM.ayudaMonto.textContent = msg;
  if (state === "neutral") DOM.inputMonto.classList.add("border-blue-300", "focus:ring-blue-300");
  else if (state === "ok") DOM.inputMonto.classList.add("border-green-500", "focus:ring-green-500");
  else if (state === "error") DOM.inputMonto.classList.add("border-red-500", "focus:ring-red-500");
}

function maxPermitidoEnInput() {
  // En BCV el input es USD deseados
  if (isBCVFlow()) return CONFIG.MAX_USD;

  if (!mode || !tasaCompraUSD) return null;
  const maxPesosOrigen = CONFIG.MAX_USD * tasaCompraUSD;

  if (mode === "enviar") return maxPesosOrigen;
  if (!tasa || !Number.isFinite(parseFloat(tasa))) return null;
  return calcularCruce(origenSeleccionado, destinoSeleccionado, "enviar", maxPesosOrigen, parseFloat(tasa));
}

function rangoPermitidoEnInput() {
  // En BCV el input es USD deseados (rango fijo en USD)
  if (isBCVFlow()) {
    return { min: CONFIG.MIN_USD, max: CONFIG.MAX_USD, codigo: "USD" };
  }

  if (!mode || !tasaCompraUSD) return null;
  const minPesosOrigen = CONFIG.MIN_USD * tasaCompraUSD;
  const maxPesosOrigen = CONFIG.MAX_USD * tasaCompraUSD;

  const convertir = (m) => mode === "enviar"
    ? m
    : calcularCruce(origenSeleccionado, destinoSeleccionado, "enviar", m, parseFloat(tasa));

  const minInput = convertir(minPesosOrigen);
  const maxInput = convertir(maxPesosOrigen);
  if (!Number.isFinite(minInput) || !Number.isFinite(maxInput)) return null;
  return { min: minInput, max: maxInput };
}

function updateAyudaRangos() {
  const o = obtenerPais(origenSeleccionado);
  const d = obtenerPais(destinoSeleccionado);

  DOM.ayudaMonto.className =
    "text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center leading-snug";

  if (!mode && !isBCVFlow()) { DOM.ayudaMonto.innerHTML = ""; return; }

  // BCV: siempre mostramos en USD
  if (isBCVFlow()) {
    const nf2 = new Intl.NumberFormat(userLocale, { maximumFractionDigits: 2 });
    const minFmt = nf2.format(CONFIG.MIN_USD);
    const maxFmt = nf2.format(CONFIG.MAX_USD);
    const hoy = openingTextTodayLocal(userLocale);
    const lineaRango = `Min: <strong>${minFmt} USD</strong> • Max: <strong>${maxFmt} USD</strong>`;
    const lineaRef = (!ops.allowWhats) ? `⚠ Modo referencia — tasa no vigente` : "";
    const lineaHoy = `🕒 ${hoy.replace("Horario de: ", "")}`;
    DOM.ayudaMonto.innerHTML = `
      <span class="block">${lineaRango}</span>
      ${lineaRef ? `<span class="block">${lineaRef}</span>` : ``}
      <span class="block">${lineaHoy}</span>
    `;
    return;
  }

  // normal
  if (mode === "enviar" && !tasaCompraUSD) {
    DOM.ayudaMonto.innerHTML = `<span class="block">Calculando límites…</span>`;
    return;
  }
  if (mode === "llegar" && (!tasaCompraUSD || !tasa)) {
    DOM.ayudaMonto.innerHTML = `<span class="block">Esperando tasa para calcular límites…</span>`;
    return;
  }

  const rango = rangoPermitidoEnInput();
  if (!rango) { DOM.ayudaMonto.innerHTML = ""; return; }

  const nf2 = new Intl.NumberFormat(userLocale, { maximumFractionDigits: 2 });
  const minFmt = nf2.format(Math.max(0, rango.min));
  const maxFmt = nf2.format(Math.max(rango.min, rango.max));
  const codigoInput = mode === "llegar" ? (d?.codigo ?? "") : (o?.codigo ?? "");
  const hoy = openingTextTodayLocal(userLocale);

  const lineaRango = `Min: <strong>${minFmt} ${codigoInput}</strong> • Max: <strong>${maxFmt} ${codigoInput}</strong>`;
  const lineaRef = (!ops.allowWhats) ? `⚠ Modo referencia — tasa no vigente` : "";
  const lineaHoy = `🕒 ${hoy.replace("Horario de: ", "")}`;

  DOM.ayudaMonto.innerHTML = `
    <span class="block">${lineaRango}</span>
    ${lineaRef ? `<span class="block">${lineaRef}</span>` : ``}
    <span class="block">${lineaHoy}</span>
  `;
}

function validarMontoEnVivo() {
  let raw = DOM.inputMonto.value.trim();

  // Prevenir múltiples ceros a la izquierda
  if (/^0\d+/.test(raw)) {
    raw = raw.replace(/^0+(?!\.)/, "");
    DOM.inputMonto.value = raw;
  }

  updateAyudaRangos();

  if (!raw) { DOM.btnCalcular.disabled = true; setInputStyle({ state: "neutral" }); return; }
  const num = parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(num) || num <= 0) {
    DOM.btnCalcular.disabled = true;
    setInputStyle({ state: "error", msg: "Ingresa un número mayor que 0." });
    return;
  }

  // === BCV: el input ES USD directo ===
  if (isBCVFlow()) {
    // todavía no eligió tasa BCV
    if (!Number.isFinite(bcvTasa) || bcvTasa <= 0) {
      DOM.btnCalcular.disabled = true;
      setInputStyle({ state: "neutral", msg: "Selecciona Dólar BCV / Euro BCV / Personalizada para continuar." });
      return;
    }

    if (num < CONFIG.MIN_USD) {
      DOM.btnCalcular.disabled = true;
      setInputStyle({ state: "error", msg: `El mínimo es ${CONFIG.MIN_USD} USD.` });
      return;
    }
    if (num > CONFIG.MAX_USD) {
      DOM.btnCalcular.disabled = true;
      setInputStyle({ state: "error", msg: `El máximo es ${CONFIG.MAX_USD} USD.` });
      return;
    }

    // además necesitas tasa normal (ARS→VES) para poder calcular cuánto enviar
    const t = Number(tasa);
    const listo = Number.isFinite(t) && t > 0;
    if (!listo) { DOM.btnCalcular.disabled = true; setInputStyle({ state: "neutral" }); return; }

    DOM.btnCalcular.disabled = false;
    setInputStyle({ state: "ok" });
    return;
  }

  // === normal ===
  const t = Number(tasa);
  const listo = !!mode && Number.isFinite(tasaCompraUSD) && Number.isFinite(t) && t > 0;
  if (!listo) { DOM.btnCalcular.disabled = true; setInputStyle({ state: "neutral" }); return; }

  const montoEnPesos = mode === "enviar" ? num : calcularCruce(origenSeleccionado, destinoSeleccionado, mode, num, t);
  const usd = montoEnPesos / tasaCompraUSD;

  if (usd < CONFIG.MIN_USD) {
    DOM.btnCalcular.disabled = true;
    setInputStyle({ state: "error", msg: `El mínimo equivalente es ${CONFIG.MIN_USD} USD (ahora llevas ~${usd.toFixed(2)} USD).` });
    return;
  }
  if (usd > CONFIG.MAX_USD) {
    DOM.btnCalcular.disabled = true;
    setInputStyle({ state: "error", msg: `El máximo equivalente es ${CONFIG.MAX_USD} USD (ahora llevas ~${usd.toFixed(2)} USD).` });
    return;
  }

  DOM.btnCalcular.disabled = false;
  setInputStyle({ state: "ok" });
}

function resetearCampoMonto() {
  DOM.inputMonto.value = "";
  DOM.errorMonto.classList.add("hidden");
  setInputStyle({ state: "neutral" });
  updateAyudaRangos();
}

function actualizarHeader(texto = "") {
  DOM.subtituloHeader.textContent = texto;
  DOM.mainHeader.classList.remove("hidden");
}

function ocultarTodo() {
  DOM.step1Origen.classList.add("hidden");
  DOM.step2Destino.classList.add("hidden");
  DOM.step1.classList.add("hidden");
  DOM.step2.classList.add("hidden");
  DOM.tasaWrap.classList.add("hidden");
  DOM.resultado.classList.add("hidden");
}

export function mostrarPaso1() {
  showBack(false);
  ocultarTodo();
  actualizarHeader("Selecciona el país de origen");
  DOM.btnVolverGlobal.classList.add("hidden");
  DOM.step1Origen.classList.remove("hidden");
  DOM.step1Origen.classList.add("fade-slide-in");
  DOM.origenBtns.innerHTML = "";
  paisesDisponibles.forEach(p => {
    const btn = document.createElement("button");
    btn.textContent = `${p.emoji} ${p.nombre}`;
    btn.className = "ripple-button border rounded-xl px-6 py-3 font-semibold shadow transition hover:scale-105 " +
      "bg-white/80 text-brandBlue border-brandBlue/50 " +
      "dark:bg-white/10 dark:text-[#9cc2ff] dark:border-[#66a3ff]/40 " +
      "backdrop-blur-sm dark:hover:bg-white/15";
    btn.onclick = () => { origenSeleccionado = p.codigo; mostrarPaso2(); };
    DOM.origenBtns.appendChild(btn);
  });
}

function mostrarPaso2() {
  showBack(true);
  ocultarTodo();
  actualizarHeader("Selecciona el país destino");
  DOM.btnVolverGlobal.classList.remove("hidden");
  DOM.step2Destino.classList.remove("hidden");
  DOM.step2Destino.classList.add("fade-slide-in");
  DOM.destinoBtns.innerHTML = "";
  paisesDisponibles.filter(p => p.codigo !== origenSeleccionado).forEach(p => {
    const btn = document.createElement("button");
    btn.textContent = `${p.emoji} ${p.nombre}`;
    btn.className = "ripple-button border rounded-xl px-6 py-3 font-semibold shadow transition hover:scale-105 " +
      "bg-white/80 text-[#0066FF] border-[#0066FF]/50 " +
      "dark:bg-white/10 dark:text-brandTeal dark:border-brandTeal/40 " +
      "backdrop-blur-sm dark:hover:bg-white/15";
    btn.onclick = () => {
      destinoSeleccionado = p.codigo;
      DOM.step2Destino.classList.add("hidden");
      mostrarPaso3();
    };
    DOM.destinoBtns.appendChild(btn);
  });
}

async function mostrarPaso3() {
  showBack(true);
  ocultarTodo();

  // al entrar a paso3, siempre resetea BCV
  resetBCVStateAndUI();

  DOM.step1.classList.remove("hidden");
  DOM.btnVolverGlobal.classList.remove("hidden");
  DOM.mainHeader.classList.remove("hidden");
  DOM.tasaWrap.classList.remove("hidden");
  actualizarHeader("Selecciona el tipo de operación");
  actualizarTextosUI();

  const [{ tasa: tasaCruda, compra, fecha }, manual] = await Promise.all([
    obtenerTasa(origenSeleccionado, destinoSeleccionado),
    obtenerStatus()
  ]);

  const tNum = Number(tasaCruda);
  const tieneTasa = Number.isFinite(tNum) && tNum > 0;
  if (Number.isFinite(compra)) tasaCompraUSD = compra;

  ops = evaluateOps(fecha, manual);
  updateHorarioPill();
  updateWhatsButton();

  setState({
    origen: origenSeleccionado,
    destino: destinoSeleccionado,
    mode,
    tasa: (Number.isFinite(Number(tasaCruda)) && Number(tasaCruda) > 0) ? Number(tasaCruda) : null,
    tasaCompraUSD: Number.isFinite(Number(compra)) ? Number(compra) : null,
    tasaDesactualizada: !ops.fresh,
    snapshotTs: fecha,
    ops
  });

  if (tieneTasa) {
    tasa = tNum;
    DOM.tasaValue.textContent = formatearTasa(tasa);
    DOM.tasaFecha.textContent = formatearFecha(fecha);

    if (ops.fresh) {
      hideBanner(DOM.tasaAdvertencia);
      DOM.tasaConfirmacionTexto.textContent = "✅ Tasa actualizada";
      mostrarConfirmacionVerdeAutoOcultar(DOM.tasaConfirmacion, 4000);
    } else {
      hideBanner(DOM.tasaConfirmacion);
      DOM.tasaAdvertenciaTexto.textContent = "Tasa desactualizada";
      showBanner(DOM.tasaAdvertencia);
    }

    setModoButtonsEnabled(true);
    updateAyudaRangos();
    validarMontoEnVivo();

    DOM.tasaValue.classList.add("animate-pulse");
    setTimeout(() => DOM.tasaValue.classList.remove("animate-pulse"), 1000);
  } else {
    tasa = null;
    setModoButtonsEnabled(false);
    DOM.tasaValue.textContent = "⚠️ No disponible";
    DOM.tasaFecha.textContent = "—";
    hideBanner(DOM.tasaConfirmacion);
    DOM.tasaAdvertenciaTexto.textContent = "No hay tasa disponible";

    setTimeout(() => {
      DOM.loader.classList.add("hidden");
      DOM.resultado.classList.remove("hidden");
      DOM.resultado.classList.add("fade-scale-in");
      DOM.resText.classList.add("text-4xl");
      updateHorarioPill();
    }, 1200);

    showBanner(DOM.tasaAdvertencia);
    updateAyudaRangos();
    validarMontoEnVivo();
  }
}

function cambiarPaso(tipo) {
  // al cambiar modo normal, nos aseguramos de salir del BCV
  if (bcvActivo) resetBCVStateAndUI();

  mode = tipo;
  setState({ mode: tipo });

  const { preguntaEnviar, preguntaLlegar } = textosSegunPaises();
  DOM.preguntaMonto.textContent = tipo === "enviar" ? preguntaEnviar : preguntaLlegar;

  resetearCampoMonto();
  updateAyudaRangos();

  if (!ops.allowWhats) {
    mostrarToast(DOM, "⚠️ Modo referencia: cálculos orientativos. WhatsApp deshabilitado.");
  }

  DOM.step1.classList.add("hidden");
  DOM.step2.classList.remove("hidden");
  setTimeout(() => { DOM.inputMonto.focus(); validarMontoEnVivo(); }, 300);
}

function ejecutarCalculo() {
  const raw = DOM.inputMonto.value.trim();
  const montoInput = parseFloat(raw);

  const t = parseFloat(tasa);
  if (!Number.isFinite(montoInput)) {
    DOM.errorMonto.textContent = "⚠️ Ingresa un número válido";
    DOM.errorMonto.classList.remove("hidden");
    return;
  }
  if (!Number.isFinite(t) || t <= 0) {
    DOM.errorMonto.textContent = "⚠️ Tasa No Disponible.";
    DOM.errorMonto.classList.remove("hidden");
    return;
  }
  if (!ops.allowWhats) {
    mostrarToast(DOM, "⚠️ Modo referencia: valores orientativos.");
  }

  const o = obtenerPais(origenSeleccionado);
  const d = obtenerPais(destinoSeleccionado);
  const fecha = DOM.tasaFecha.textContent;

  const refBadge = !ops.allowWhats
    ? `<div class="mt-2 inline-block text-xs font-bold text-red-700 bg-red-100 border border-red-300 rounded px-2 py-1">MODO REFERENCIA</div>`
    : ``;

  // ==========================
  // ✅ MODO BCV (solo destino VES)
  // ==========================
  if (isBCVFlow()) {
    if (!Number.isFinite(bcvTasa) || bcvTasa <= 0) {
      DOM.errorMonto.textContent = "⚠️ Selecciona una tasa BCV válida.";
      DOM.errorMonto.classList.remove("hidden");
      return;
    }

    // input = USD deseados
    const usdDeseados = montoInput;
    if (usdDeseados < CONFIG.MIN_USD) {
      DOM.errorMonto.textContent = `⚠️ El monto mínimo permitido es ${CONFIG.MIN_USD} USD`;
      DOM.errorMonto.classList.remove("hidden");
      return;
    }
    if (usdDeseados > CONFIG.MAX_USD) {
      DOM.errorMonto.textContent = `⚠️ El monto máximo permitido es ${CONFIG.MAX_USD} USD`;
      DOM.errorMonto.classList.remove("hidden");
      return;
    }

    const vesObjetivo = usdDeseados * bcvTasa;

    // usamos el motor existente: "llegar" a VES
    const calcEnviar = Math.round(
      calcularCruce(origenSeleccionado, "VES", "llegar", vesObjetivo, t)
    );
    const calcRed = redondearPorMoneda(calcEnviar, o.codigo);

    const nf2 = new Intl.NumberFormat(userLocale, { maximumFractionDigits: 2 });
    const nf0 = new Intl.NumberFormat(userLocale, { maximumFractionDigits: 0 });

    const usdFmt = nf2.format(usdDeseados);
    const vesFmt = nf0.format(Math.round(vesObjetivo));
    const enviarFmt = nf0.format(calcRed);
    const tasaFmt = formatearTasa(t);

    const etiquetaBCV =
      (bcvTipo === "USD") ? "Dólar BCV" :
      (bcvTipo === "EUR") ? "Euro BCV" :
      "Personalizada";

    lastCalc = {
      mode: "llegarBCV",
      origen: o,
      destino: d,
      montoIngresado: usdDeseados,
      montoCalculado: calcRed,
      tasa: t,
      fecha,
      bcv: { tipo: bcvTipo, etiqueta: etiquetaBCV, tasa: bcvTasa, usdDeseados, vesObjetivo }
    };
    setState({ lastCalc });

    DOM.errorMonto.classList.add("hidden");

    const mensaje = `
      <div class="text-sm italic text-gray-500 dark:text-gray-400">Para que lleguen</div>
      <div class="text-4xl font-extrabold text-blue-900 dark:text-blue-200">${usdFmt} $</div>
      <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">
        a tasa <span class="font-semibold">${etiquetaBCV}</span> (${nf2.format(bcvTasa)} VES por $)
      </div>
      <div class="text-base text-gray-600 dark:text-gray-300 mt-3">equivalentes a</div>
      <div class="text-3xl font-semibold text-blue-800 dark:text-blue-400">VES ${vesFmt}</div>
      <div class="text-base text-gray-600 dark:text-gray-300 mt-3">debes enviar</div>
      <div class="text-4xl font-extrabold text-blue-900 dark:text-blue-200">${enviarFmt} ${o.codigo}</div>
      ${refBadge}
      <div class="text-sm italic text-gray-500 dark:text-gray-400 mt-4">
        Calculado con la tasa del día ${fecha} — <span class="font-semibold text-blue-800 dark:text-blue-400">${tasaFmt}</span>
      </div>
    `;

    DOM.resText.innerHTML = mensaje;

    // transiciones a resultado
    DOM.step2.classList.add("hidden");
    DOM.tasaWrap.classList.add("transition", "duration-500", "ease-out", "opacity-0", "scale-95");
    setTimeout(() => DOM.tasaWrap.classList.add("hidden"), 500);

    DOM.loader.classList.remove("hidden");
    setTimeout(() => {
      DOM.loader.classList.add("hidden");
      DOM.resultado.classList.remove("hidden");
      DOM.resultado.classList.add("fade-scale-in");
      DOM.resText.classList.add("text-4xl");
      updateWhatsButton();
    }, 1200);

    return;
  }

  // ==========================
  // ✅ FLUJO NORMAL
  // ==========================
  if (!tasaCompraUSD) {
    DOM.errorMonto.textContent = "⚠️ No se pudo obtener la tasa de compra en USD.";
    DOM.errorMonto.classList.remove("hidden");
    return;
  }

  const montoEnPesos = mode === "enviar"
    ? montoInput
    : calcularCruce(origenSeleccionado, destinoSeleccionado, mode, montoInput, t);
  const usd = montoEnPesos / tasaCompraUSD;

  if (usd < CONFIG.MIN_USD) {
    DOM.errorMonto.textContent = `⚠️ El monto mínimo permitido es equivalente a ${CONFIG.MIN_USD} USD`;
    DOM.errorMonto.classList.remove("hidden");
    return;
  }
  if (usd > CONFIG.MAX_USD) {
    DOM.errorMonto.textContent = `⚠️ El monto máximo permitido es equivalente a ${CONFIG.MAX_USD} USD`;
    DOM.errorMonto.classList.remove("hidden");
    return;
  }

  DOM.errorMonto.classList.add("hidden");

  const calc = Math.round(calcularCruce(origenSeleccionado, destinoSeleccionado, mode, montoInput, t));
  const calcRed = mode === "llegar" ? redondearPorMoneda(calc, o.codigo) : calc;

  const montoFmt = new Intl.NumberFormat(userLocale, { maximumFractionDigits: 2 }).format(montoInput);
  const calcFmt = new Intl.NumberFormat(userLocale, { maximumFractionDigits: 0 }).format(calcRed);
  const tasaFmt = formatearTasa(tasa);

  lastCalc = {
    mode,
    origen: o,
    destino: d,
    montoIngresado: montoInput,
    montoCalculado: calcRed,
    tasa: t,
    fecha
  };
  setState({ lastCalc });

  const mensaje = mode === "enviar"
    ? `<div class="text-sm italic text-gray-500 dark:text-gray-400">Enviando desde ${o.nombre}</div>
       <div class="text-3xl font-semibold text-blue-800 dark:text-blue-400">${montoFmt} ${o.codigo}</div>
       <div class="text-base text-gray-600 dark:text-gray-300 mt-1">recibirás</div>
       <div class="text-4xl font-extrabold text-blue-900 dark:text-blue-200">${d.codigo} ${calcFmt}</div>
       ${refBadge}
       <div class="text-sm italic text-gray-500 dark:text-gray-400 mt-4">Calculado con la tasa del día ${fecha} — <span class="font-semibold text-blue-800 dark:text-blue-400">${tasaFmt}</span></div>`
    : `<div class="text-sm italic text-gray-500 dark:text-gray-400">Para recibir en ${d.nombre}</div>
       <div class="text-3xl font-semibold text-blue-800 dark:text-blue-400">${d.codigo} ${montoFmt}</div>
       <div class="text-base text-gray-600 dark:text-gray-300 mt-1">debes enviar</div>
       <div class="text-4xl font-extrabold text-blue-900 dark:text-blue-200">${calcFmt} ${o.codigo}</div>
       ${refBadge}
       <div class="text-sm italic text-gray-500 dark:text-gray-400 mt-4">Calculado con la tasa del día ${fecha} — <span class="font-semibold text-blue-800 dark:text-blue-400">${tasaFmt}</span></div>`;

  DOM.resText.innerHTML = mensaje;

  if (ops.allowWhats && DOM.soundSuccess && !DOM.soundSuccess.muted) DOM.soundSuccess.play();

  DOM.step2.classList.add("hidden");
  DOM.tasaWrap.classList.add("transition", "duration-500", "ease-out", "opacity-0", "scale-95");
  setTimeout(() => DOM.tasaWrap.classList.add("hidden"), 500);

  DOM.loader.classList.remove("hidden");
  setTimeout(() => {
    DOM.loader.classList.add("hidden");
    DOM.resultado.classList.remove("hidden");
    DOM.resultado.classList.add("fade-scale-in");
    DOM.resText.classList.add("text-4xl");
    updateWhatsButton();
  }, 1200);
}

export function wireEvents() {
  DOM.btnEnviar.onclick = () => cambiarPaso("enviar");
  DOM.btnLlegar.onclick = () => cambiarPaso("llegar");
  DOM.btnLlegarBCV.onclick = () => activarModoBCV();

  // Volver
  DOM.btnVolverGlobal.onclick = () => {
    const isStep1Visible = !DOM.step1.classList.contains("hidden");
    const isStep2Visible = !DOM.step2.classList.contains("hidden");
    const isResultadoVisible = !DOM.resultado.classList.contains("hidden");

    if (isResultadoVisible) {
      DOM.resultado.classList.add("hidden");
      DOM.resultado.classList.remove("fade-scale-in");
      DOM.step2.classList.remove("hidden");
      DOM.tasaWrap.classList.remove("hidden", "opacity-0", "scale-95");
      actualizarHeader("Ingresa el monto");
      setTimeout(() => {
        DOM.inputMonto.focus();
        validarMontoEnVivo();
      }, 200);
      return;
    }

    if (isStep2Visible) {
      // si estabas en BCV, al volver salimos del modo BCV para que no se quede pegado
      if (bcvActivo) resetBCVStateAndUI();

      DOM.step2.classList.add("hidden");
      DOM.step1.classList.remove("hidden");
      actualizarHeader("Selecciona el tipo de operación");
      return;
    }

    if (isStep1Visible) {
      mostrarPaso2();
      return;
    }

    mostrarPaso1();
  };

  // input: limpiar/limitar
  let scrollPrev = 0;
  DOM.inputMonto.addEventListener("focus", () => {
    scrollPrev = window.scrollY;
    setTimeout(() => DOM.inputMonto.scrollIntoView({ behavior: "smooth", block: "center" }), 380);
    updateAyudaRangos();
  });
  DOM.inputMonto.addEventListener("blur", () => {
    DOM.errorMonto.classList.add("hidden");
    setTimeout(() => window.scrollTo({ top: scrollPrev, behavior: "smooth" }), 150);
  });
  DOM.inputMonto.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); DOM.btnCalcular.click(); }
  });
  DOM.inputMonto.addEventListener("input", () => {
    let val = DOM.inputMonto.value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) val = parts[0] + "." + parts[1];
    if (parts[1]?.length > 2) val = parts[0] + "." + parts[1].slice(0, 2);
    DOM.inputMonto.value = val;

    const num = parseFloat(val), maxVal = maxPermitidoEnInput();
    if (Number.isFinite(num) && Number.isFinite(maxVal) && num > maxVal) {
      const capped = Math.floor(maxVal * 100) / 100;
      DOM.inputMonto.value = String(capped);
    }
    validarMontoEnVivo();
  });

  // Calcular + modal
  DOM.btnCalcular.onclick = () => {
    const raw = DOM.inputMonto.value.trim();
    const monto = parseFloat(raw);

    // BCV: monto ya está en USD
    const usd = isBCVFlow()
      ? monto
      : ((mode === "enviar" ? monto : calcularCruce(origenSeleccionado, destinoSeleccionado, mode, monto, tasa)) / tasaCompraUSD);

    if (usd >= 300 && !document.body.classList.contains("modal-activo")) {
      mostrarModalMontoGrande(() => ejecutarCalculo());
      return;
    }
    ejecutarCalculo();
  };

  DOM.btnRecalcular.onclick = () => {
    resetearCampoMonto();
    DOM.resText.classList.remove("text-4xl");
    DOM.resultado.classList.add("hidden");
    DOM.resultado.classList.remove("fade-scale-in");

    if (origenSeleccionado && destinoSeleccionado) {
      DOM.step1.classList.add("hidden");
      DOM.step2.classList.remove("hidden");
      DOM.tasaWrap.classList.remove("hidden");
      actualizarHeader("Ingresa el monto");
      setTimeout(() => {
        DOM.inputMonto.focus();
        validarMontoEnVivo();
        DOM.tasaWrap.classList.remove("opacity-0", "scale-95");
      }, 200);
      return;
    }
    mostrarPaso1();
  };

  // iniciar flujo
  mostrarPaso1();

  // === BCV UI handlers (dentro del paso2) ===
  DOM.btnBcvUsd?.addEventListener("click", async () => {
    const { usd } = await obtenerBCV();
    bcvTipo = "USD";
    bcvTasa = usd;

    DOM.bcvCustomRow?.classList.add("hidden");
    DOM.bcvTitulo.textContent = "¿Cuántos dólares quieres que lleguen a tasa Dólar BCV?";
    DOM.preguntaMonto.textContent = "Monto en USD";
    DOM.inputMonto.disabled = false;
    DOM.inputMonto.value = "";
    DOM.inputMonto.focus();
    validarMontoEnVivo();
  });

  DOM.btnBcvEur?.addEventListener("click", async () => {
    const { eur } = await obtenerBCV();
    bcvTipo = "EUR";
    bcvTasa = eur;

    DOM.bcvCustomRow?.classList.add("hidden");
    DOM.bcvTitulo.textContent = "¿Cuántos dólares quieres que lleguen a tasa Euro BCV?";
    DOM.preguntaMonto.textContent = "Monto en USD";
    DOM.inputMonto.disabled = false;
    DOM.inputMonto.value = "";
    DOM.inputMonto.focus();
    validarMontoEnVivo();
  });

  DOM.btnBcvCustom?.addEventListener("click", async () => {
    const bcv = await obtenerBCV();
    bcvRange.min = bcv.min;
    bcvRange.max = bcv.max;

    bcvTipo = "CUSTOM";
    bcvTasa = null;

    DOM.bcvCustomRow?.classList.remove("hidden");
    DOM.bcvTitulo.textContent = "Configura tu tasa personalizada";
    DOM.preguntaMonto.textContent = "Primero define la tasa personalizada arriba.";
    DOM.inputMonto.disabled = true;
    DOM.inputMonto.value = "";

    if (DOM.bcvCustomHelp) {
      DOM.bcvCustomHelp.textContent =
        (bcvRange.min && bcvRange.max)
          ? `Rango permitido: ${bcvRange.min} a ${bcvRange.max} (VES por USD)`
          : "";
    }

    DOM.bcvTasaCustom?.focus();
    validarMontoEnVivo();
  });

  DOM.bcvTasaCustom?.addEventListener("input", () => {
    if (!bcvActivo || bcvTipo !== "CUSTOM") return;

    const v = parseFloat(DOM.bcvTasaCustom.value);
    const min = bcvRange.min;
    const max = bcvRange.max;

    if (!Number.isFinite(v) || !min || !max) {
      DOM.preguntaMonto.textContent = "Ingresa una tasa válida.";
      DOM.inputMonto.disabled = true;
      validarMontoEnVivo();
      return;
    }

    if (v < min || v > max) {
      DOM.preguntaMonto.textContent = `Fuera de rango (${min} a ${max}).`;
      DOM.inputMonto.disabled = true;
      validarMontoEnVivo();
      return;
    }

    bcvTasa = v;
    DOM.bcvTitulo.textContent = `¿Cuántos dólares quieres que lleguen a tasa personalizada (${v})?`;
    DOM.preguntaMonto.textContent = "Monto en USD";
    DOM.inputMonto.disabled = false;
    validarMontoEnVivo();
  });
}

async function activarModoBCV() {
  if (destinoSeleccionado !== "VES") return;

  bcvActivo = true;
  bcvTipo = null;
  bcvTasa = null;

  DOM.bcvBox?.classList.remove("hidden");

  // Ocultar botones normales (se reemplazan por BCV)
  DOM.btnEnviar?.classList.add("hidden");
  DOM.btnLlegar?.classList.add("hidden");
  DOM.btnLlegarBCV?.classList.add("hidden");

  const bcv = await obtenerBCV();
  bcvRange.min = bcv.min;
  bcvRange.max = bcv.max;

  if (DOM.bcvTitulo) DOM.bcvTitulo.textContent = "¿A qué tasa quieres calcular?";

  if (DOM.bcvCustomHelp) {
    DOM.bcvCustomHelp.textContent =
      (bcvRange.min && bcvRange.max)
        ? `Rango permitido: ${bcvRange.min} a ${bcvRange.max} (VES por USD)`
        : "";
  }

  DOM.inputMonto.value = "";
  DOM.preguntaMonto.textContent = "Selecciona una tasa arriba para continuar.";
  DOM.inputMonto.disabled = true;
  setInputStyle({ state: "neutral", msg: "" });

  // Ir al paso de monto (step2)
  DOM.step1.classList.add("hidden");
  DOM.step2.classList.remove("hidden");
  actualizarHeader("Ingresa el monto");

  // Forzamos a que el motor tenga un modo base
  mode = "llegar";
  setState({ mode: "llegar" });

  updateAyudaRangos();
  validarMontoEnVivo();
  setTimeout(() => { DOM.inputMonto.focus(); }, 200);
}

export function getLastCalc() { return lastCalc; }
export function getOpsState() { return ops; }
