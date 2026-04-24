"use strict";

// =====================================================
// GESTOR MASIVO
// =====================================================
function llenarSelectGestorMasivo() {
  const selOrigen = document.getElementById("masivo-filtro-origen");
  const selDestino = document.getElementById("masivo-filtro-destino");

  if (!selOrigen || !selDestino) return;

  selOrigen.innerHTML = `<option value="">Todos</option>`;
  selDestino.innerHTML = `<option value="">Todos</option>`;

  for (const p of paises) {
    const opt1 = document.createElement("option");
    opt1.value = p.fiat;
    opt1.textContent = `${p.emoji} ${p.fiat}`;
    selOrigen.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = p.fiat;
    opt2.textContent = `${p.emoji} ${p.fiat}`;
    selDestino.appendChild(opt2);
  }

  selOrigen.value = filtroMasivoOrigen;
  selDestino.value = filtroMasivoDestino;
}

function obtenerCrucesFiltradosMasivo() {
  const mapa = asegurarMapaCompletoMargenes(5, borradorMargenesCruce || {});
  const lista = [];

  for (const clave of Object.keys(mapa)) {
    const [origen, destino] = clave.split("-");
    if (!origen || !destino) continue;

    if (filtroMasivoOrigen && origen !== filtroMasivoOrigen) continue;
    if (filtroMasivoDestino && destino !== filtroMasivoDestino) continue;

    lista.push({
      clave,
      origen,
      destino,
      margen: Number(mapa[clave]),
    });
  }

  lista.sort((a, b) => {
    if (a.origen !== b.origen) return a.origen.localeCompare(b.origen, "es");
    return a.destino.localeCompare(b.destino, "es");
  });

  return lista;
}

function renderInfoGestorMasivo(total) {
  const info = document.getElementById("masivo-info");
  if (!info) return;

  const origenTxt = filtroMasivoOrigen || "Todos";
  const destinoTxt = filtroMasivoDestino || "Todos";

  info.textContent = `Filtro actual → Origen: ${origenTxt} | Destino: ${destinoTxt} | ${total} cruce(s) visibles.`;
}

function contarFilasEditadasMasivo() {
  return Object.keys(borradorEdicionMasiva).length;
}

function limpiarBorradorEdicionMasiva() {
  borradorEdicionMasiva = {};
}

function marcarEdicionMasivaFila(clave, valor) {
  if (!Number.isFinite(Number(valor)) || Number(valor) < 0) {
    delete borradorEdicionMasiva[clave];
    return;
  }

  borradorEdicionMasiva[clave] = Number(valor);
}

function renderInfoExtraGestorMasivo(visibles) {
  const el = document.getElementById("masivo-info-extra");
  if (!el) return;

  const editadas = contarFilasEditadasMasivo();
  el.textContent = `${visibles} fila(s) visibles · ${editadas} fila(s) editadas manualmente.`;
}

function aplicarFilasEditadasMasivo() {
  const claves = Object.keys(borradorEdicionMasiva);

  if (!claves.length) {
    mostrarToast("⚠️ No hay filas editadas");
    return;
  }

  let aplicadas = 0;

  for (const clave of claves) {
    const valor = Number(borradorEdicionMasiva[clave]);
    if (!Number.isFinite(valor) || valor < 0) continue;
    borradorMargenesCruce[clave] = Number(valor);
    aplicadas++;
  }

  limpiarBorradorEdicionMasiva();
  mostrarAdvertenciaPendiente(true);
  renderResumenBorrador();
  renderGestorMasivoMargenes();

  mostrarToast(`✅ Filas aplicadas: ${aplicadas}`);
}

function resetearFiltradosAValor(valorBase = 5) {
  const filas = obtenerCrucesFiltradosMasivo();
  if (!filas.length) {
    mostrarToast("⚠️ No hay cruces filtrados");
    return;
  }

  for (const fila of filas) {
    borradorMargenesCruce[fila.clave] = Number(valorBase);
  }

  limpiarBorradorEdicionMasiva();
  mostrarAdvertenciaPendiente(true);
  renderResumenBorrador();
  renderGestorMasivoMargenes();

  mostrarToast(`✅ ${filas.length} cruce(s) reseteados a ${valorBase}%`);
}

function aplicarOperacionMasivaFiltrados(tipo) {
  const valor = parseFloat(document.getElementById("masivo-valor")?.value);
  if (!Number.isFinite(valor)) {
    mostrarToast("⚠️ Ingresa un valor válido");
    return;
  }

  const filas = obtenerCrucesFiltradosMasivo();
  if (!filas.length) {
    mostrarToast("⚠️ No hay cruces filtrados");
    return;
  }

  let totalAfectados = 0;

  for (const fila of filas) {
    const actual = Number(borradorMargenesCruce?.[fila.clave] ?? fila.margen ?? 5);
    let nuevo = actual;

    if (tipo === "sumar") nuevo = actual + valor;
    else if (tipo === "restar") nuevo = actual - valor;
    else if (tipo === "reemplazar") nuevo = valor;

    nuevo = Math.max(0, Number(nuevo.toFixed(4)));
    borradorMargenesCruce[fila.clave] = nuevo;
    totalAfectados++;
  }

  limpiarBorradorEdicionMasiva();
  mostrarAdvertenciaPendiente(true);
  renderResumenBorrador();
  renderGestorMasivoMargenes();

  mostrarToast(`✅ Operación aplicada en ${totalAfectados} cruce(s)`);
}

function renderGestorMasivoMargenes() {
  llenarSelectGestorMasivo();

  const body = document.getElementById("masivo-tabla-body");
  if (!body) return;

  const filas = obtenerCrucesFiltradosMasivo();
  renderInfoGestorMasivo(filas.length);
  renderInfoExtraGestorMasivo(filas.length);

  body.innerHTML = "";

  if (!filas.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td colspan="4" class="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
        No hay cruces que coincidan con el filtro actual.
      </td>
    `;
    body.appendChild(tr);
    return;
  }

  for (const fila of filas) {
    const valorEditado = borradorEdicionMasiva[fila.clave];
    const valorVisible = Number.isFinite(Number(valorEditado)) ? Number(valorEditado) : fila.margen;
    const filaEditada = Number.isFinite(Number(valorEditado));

    const tr = document.createElement("tr");
    tr.className = "border-t border-black/5 dark:border-white/10";

    tr.innerHTML = `
      <td class="px-4 py-3">${fila.origen}</td>
      <td class="px-4 py-3">${fila.destino}</td>
      <td class="px-4 py-3">
        <input
          type="number"
          step="any"
          value="${valorVisible}"
          data-masivo-clave="${fila.clave}"
          class="input-premium w-28 ${filaEditada ? "ring-2 ring-blue-200 border-brandBlue" : ""}"
        />
      </td>
      <td class="px-4 py-3">
        <button
          type="button"
          data-masivo-guardar-fila="${fila.clave}"
          class="btn-secondary text-xs px-3 py-2"
        >
          Aplicar
        </button>
      </td>
    `;

    body.appendChild(tr);
  }

  body.querySelectorAll("input[data-masivo-clave]").forEach((input) => {
    input.addEventListener("input", () => {
      const clave = input.getAttribute("data-masivo-clave");
      const valor = parseFloat(input.value);

      if (!Number.isFinite(valor) || valor < 0) {
        delete borradorEdicionMasiva[clave];
      } else {
        marcarEdicionMasivaFila(clave, valor);
      }

      const valido = Number.isFinite(valor) && valor >= 0;
      input.classList.toggle("ring-2", valido);
      input.classList.toggle("ring-blue-200", valido);
      input.classList.toggle("border-brandBlue", valido);

      renderInfoExtraGestorMasivo(filas.length);
    });
  });

  body.querySelectorAll("[data-masivo-guardar-fila]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const clave = btn.getAttribute("data-masivo-guardar-fila");
      const input = body.querySelector(`input[data-masivo-clave="${clave}"]`);
      const valor = parseFloat(input?.value);

      if (!Number.isFinite(valor) || valor < 0) {
        mostrarToast("⚠️ Margen inválido");
        return;
      }

      borradorMargenesCruce[clave] = valor;
      delete borradorEdicionMasiva[clave];

      mostrarAdvertenciaPendiente(true);
      renderResumenBorrador();
      renderGestorMasivoMargenes();
      mostrarToast(`✅ Fila actualizada: ${clave}`);
    });
  });
}