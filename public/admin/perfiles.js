"use strict";

// =====================================================
// PERFILES
// =====================================================
function cargarPerfilesMargenes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERFILES);
    if (!raw) {
      perfilesMargenes = {};
      return;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      perfilesMargenes = {};
      return;
    }

    perfilesMargenes = parsed;
  } catch (err) {
    console.error("❌ Error cargando perfiles:", err);
    perfilesMargenes = {};
  }
}

function persistirPerfilesMargenes() {
  try {
    localStorage.setItem(STORAGE_KEY_PERFILES, JSON.stringify(perfilesMargenes));
  } catch (err) {
    console.error("❌ Error guardando perfiles:", err);
    mostrarToast("❌ No se pudieron guardar los perfiles");
  }
}

function obtenerNombresPerfilesMargenes() {
  return Object.keys(perfilesMargenes).sort((a, b) => a.localeCompare(b, "es"));
}

function normalizarNombrePerfil(nombre) {
  return String(nombre || "").trim();
}

function formatearFechaPerfil(valor) {
  if (!valor) return "sin fecha";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "sin fecha";
  return fecha.toLocaleString();
}

function renderPerfilesMargenes() {
  const select = document.getElementById("perfil-margen-select");
  const info = document.getElementById("perfil-margen-info");
  if (!select || !info) return;

  const nombres = obtenerNombresPerfilesMargenes();
  const valorActual = select.value;

  select.innerHTML = "";

  if (!nombres.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Sin perfiles";
    select.appendChild(opt);

    info.textContent = "Aún no hay perfiles guardados.";
    return;
  }

  const optDefault = document.createElement("option");
  optDefault.value = "";
  optDefault.textContent = "Seleccionar perfil";
  select.appendChild(optDefault);

  for (const nombre of nombres) {
    const perfil = perfilesMargenes[nombre];
    const totalCruces = perfil?.margenesCruce ? Object.keys(perfil.margenesCruce).length : 0;

    const opt = document.createElement("option");
    opt.value = nombre;
    opt.textContent = `${nombre} (${totalCruces})`;
    select.appendChild(opt);
  }

  if (nombres.includes(valorActual)) {
    select.value = valorActual;
  }

  const perfilSeleccionado = perfilesMargenes[select.value];
  if (perfilSeleccionado?.margenesCruce) {
    const totalCruces = Object.keys(perfilSeleccionado.margenesCruce).length;
    const fechaTxt = formatearFechaPerfil(perfilSeleccionado.guardadoEn);
    info.textContent = `Perfil "${select.value}" · ${totalCruces} cruces · guardado: ${fechaTxt}.`;
  } else {
    info.textContent = `${nombres.length} perfil(es) guardado(s). Selecciona uno para aplicarlo al borrador.`;
  }
}

function guardarPerfilDesdeBorrador(nombre) {
  const nombreFinal = normalizarNombrePerfil(nombre);

  if (!nombreFinal) {
    mostrarToast("⚠️ Escribe un nombre para el perfil");
    return;
  }

  const yaExiste = Boolean(perfilesMargenes[nombreFinal]);

  if (yaExiste) {
    const confirmar = confirm(`Ya existe el perfil "${nombreFinal}". ¿Quieres sobrescribirlo?`);
    if (!confirmar) {
      mostrarToast("Sobrescritura cancelada");
      return;
    }
  }

  const mapa = asegurarMapaCompletoMargenes(5, borradorMargenesCruce || {});
  const totalCruces = Object.keys(mapa).length;
  const fechaIso = new Date().toISOString();

  perfilesMargenes[nombreFinal] = {
    nombre: nombreFinal,
    guardadoEn: fechaIso,
    margenesCruce: mapa,
  };

  persistirPerfilesMargenes();
  renderPerfilesMargenes();

  const select = document.getElementById("perfil-margen-select");
  if (select) select.value = nombreFinal;

  const info = document.getElementById("perfil-margen-info");
  if (info) {
    info.textContent = yaExiste
      ? `Perfil "${nombreFinal}" sobrescrito · ${totalCruces} cruces · ${formatearFechaPerfil(fechaIso)}.`
      : `Perfil "${nombreFinal}" guardado · ${totalCruces} cruces · ${formatearFechaPerfil(fechaIso)}.`;
  }

  mostrarToast(
    yaExiste
      ? `✅ Perfil sobrescrito: ${nombreFinal}`
      : `✅ Perfil guardado: ${nombreFinal}`
  );
}

function aplicarPerfilGuardado(nombre) {
  const nombreFinal = normalizarNombrePerfil(nombre);

  if (!nombreFinal) {
    mostrarToast("⚠️ Selecciona un perfil");
    return;
  }

  const perfil = perfilesMargenes[nombreFinal];
  if (!perfil?.margenesCruce) {
    mostrarToast("⚠️ El perfil no es válido");
    return;
  }

  const totalCruces = Object.keys(perfil.margenesCruce).length;
  const fechaTxt = formatearFechaPerfil(perfil.guardadoEn);

  borradorMargenesCruce = asegurarMapaCompletoMargenes(5, perfil.margenesCruce);
  limpiarBorradorEdicionMasiva();

  mostrarAdvertenciaPendiente(true);
  renderResumenBorrador();
  renderGestorMasivoMargenes();
  renderPerfilesMargenes();

  const info = document.getElementById("perfil-margen-info");
  if (info) {
    info.textContent = `Perfil "${nombreFinal}" aplicado al borrador · ${totalCruces} cruces · guardado: ${fechaTxt}.`;
  }

  mostrarToast(`✅ Perfil aplicado: ${nombreFinal}`);
}

function eliminarPerfilGuardado(nombre) {
  const nombreFinal = normalizarNombrePerfil(nombre);

  if (!nombreFinal) {
    mostrarToast("⚠️ Selecciona un perfil para eliminar");
    return;
  }

  const perfil = perfilesMargenes[nombreFinal];
  if (!perfil) {
    mostrarToast("⚠️ Ese perfil no existe");
    return;
  }

  const confirmar = confirm(`¿Seguro que quieres eliminar el perfil "${nombreFinal}"?`);
  if (!confirmar) {
    mostrarToast("Eliminación cancelada");
    return;
  }

  delete perfilesMargenes[nombreFinal];
  persistirPerfilesMargenes();
  renderPerfilesMargenes();

  const select = document.getElementById("perfil-margen-select");
  if (select) select.value = "";

  const info = document.getElementById("perfil-margen-info");
  if (info) {
    info.textContent = `Perfil "${nombreFinal}" eliminado.`;
  }

  mostrarToast(`🗑️ Perfil eliminado: ${nombreFinal}`);
}

function sobrescribirPerfilActual(nombre) {
  const nombreFinal = normalizarNombrePerfil(nombre);

  if (!nombreFinal) {
    mostrarToast("⚠️ Selecciona un perfil");
    return;
  }

  if (!perfilesMargenes[nombreFinal]) {
    mostrarToast("⚠️ Ese perfil no existe");
    return;
  }

  const confirmar = confirm(`¿Sobrescribir el perfil "${nombreFinal}" con el borrador actual?`);
  if (!confirmar) return;

  const mapa = asegurarMapaCompletoMargenes(5, borradorMargenesCruce || {});
  perfilesMargenes[nombreFinal] = {
    nombre: nombreFinal,
    guardadoEn: new Date().toISOString(),
    margenesCruce: mapa,
  };

  persistirPerfilesMargenes();
  renderPerfilesMargenes();
  mostrarToast(`✅ Perfil sobrescrito: ${nombreFinal}`);
}