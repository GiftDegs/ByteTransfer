"use strict";

// =====================================================
// EVENTOS
// =====================================================
function bindUI() {
  // Main tabs
  document.getElementById("tab-main-monitoreo")?.addEventListener("click", () => activarVistaPrincipal("monitoreo"));
  document.getElementById("tab-main-configuracion")?.addEventListener("click", () => activarVistaPrincipal("configuracion"));
  document.getElementById("tab-main-cruces")?.addEventListener("click", () => activarVistaPrincipal("cruces"));
  document.getElementById("tab-main-monedas")?.addEventListener("click", () => activarVistaPrincipal("monedas"));
  document.getElementById("tab-main-historial")?.addEventListener("click", () => activarVistaPrincipal("historial"));

  // Config tabs
  document.getElementById("tab-config-precios")?.addEventListener("click", () => activarConfigTab("precios"));
  document.getElementById("tab-config-margenes")?.addEventListener("click", () => activarConfigTab("margenes"));
  document.getElementById("tab-config-sistema")?.addEventListener("click", () => activarConfigTab("sistema"));
  document.getElementById("tab-config-operacion")?.addEventListener("click", () => activarConfigTab("operacion"));

  // Sistema
  document.getElementById("config-polling-interval")?.addEventListener("change", (e) => {
    const seg = Number(e.target.value);
    if (!Number.isFinite(seg) || seg <= 0) return;

    pollingMs = seg * 1000;

    if (pollingActivo) iniciarPolling();
    renderMonitoreo();

    mostrarAdvertenciaPendiente(true);
    refrescarRevisionDebounced(80);
    refrescarEstadoGuardadoDebounced(80);

    mostrarToast(`✅ Polling actualizado a ${seg}s`);
  });

  document.getElementById("btn-sobrescribir-perfil-margen")?.addEventListener("click", () => {
    const select = document.getElementById("perfil-margen-select");
    sobrescribirPerfilActual(select?.value || "");
  });

  // Referencias
  document.getElementById("ref-bcv-usd")?.addEventListener("input", (e) => {
    mostrarAdvertenciaPendiente(true);
    marcarInputPendiente(e.target);
    refrescarRevisionDebounced();
    refrescarEstadoGuardadoDebounced();
  });

  document.getElementById("ref-bcv-eur")?.addEventListener("input", (e) => {
    mostrarAdvertenciaPendiente(true);
    marcarInputPendiente(e.target);
    refrescarRevisionDebounced();
    refrescarEstadoGuardadoDebounced();
  });

  document.getElementById("btn-volver-config-desde-cruces")?.addEventListener("click", () => {
    activarVistaPrincipal("configuracion");
  });

  document.getElementById("btn-guardar-desde-cruces")?.addEventListener("click", () => {
    document.getElementById("btn-guardar-ajustes")?.click();
  });

  document.getElementById("btn-cancelar-desde-cruces")?.addEventListener("click", () => {
    document.getElementById("btn-cancelar-borrador")?.click();
  });

  document.getElementById("select-limite-cruces")?.addEventListener("change", (e) => {
    limiteCrucesVisible = Number(e.target.value) || 24;
    escribirCruces();
  });

  document.getElementById("btn-aplicar-operacion-publica")?.addEventListener("click", async () => {
    const btn = document.getElementById("btn-aplicar-operacion-publica");
    const btnGuardarGeneral = document.getElementById("btn-guardar-ajustes");

    if (btn?.disabled) return;

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Guardando...";
    }

    try {
      mostrarAdvertenciaPendiente(true);
      renderResumenBorrador();
      actualizarEstadoGuardadoUI();

      if (btnGuardarGeneral?.disabled) {
        mostrarToast("⚠️ No hay cambios para guardar");
        return;
      }

      btnGuardarGeneral?.click();
    } finally {
      setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Aplicar operación pública";
        }
      }, 300);
    }
  });

  // Precios
  document.getElementById("btn-toggle-edicion")?.addEventListener("click", () => {
    modoEdicionActivo = !modoEdicionActivo;
    renderTarjetasPaises(modoEdicionActivo);

    const inUsd = document.getElementById("ref-bcv-usd");
    const inEur = document.getElementById("ref-bcv-eur");
    if (inUsd) inUsd.disabled = !modoEdicionActivo;
    if (inEur) inEur.disabled = !modoEdicionActivo;

    const btn = document.getElementById("btn-toggle-edicion");
    if (btn) btn.textContent = modoEdicionActivo ? "Bloquear edición" : "Editar precios";
  });

  document.getElementById("btn-refrescar")?.addEventListener("click", () => {
    document.getElementById("modal-confirmacion")?.classList.remove("hidden");
  });

  window.cerrarModalConfirmacion = function cerrarModalConfirmacion() {
    document.getElementById("modal-confirmacion")?.classList.add("hidden");
  };

  document.getElementById("btn-confirmar-binance")?.addEventListener("click", async () => {
    window.cerrarModalConfirmacion?.();

    for (const p of paises) {
      const fiat = p.fiat;
      if (!datosPaises[fiat]) datosPaises[fiat] = {};
      datosPaises[fiat].compra = null;
      datosPaises[fiat].venta = null;
    }

    renderTarjetasPaises(modoEdicionActivo);

    llamadasPendientes = paises.length * 2;

    for (const p of paises) {
      const fiat = p.fiat;
      const compra = await fetchPrecio(fiat, "BUY");
      llamadasPendientes--;
      const venta = await fetchPrecio(fiat, "SELL");
      llamadasPendientes--;

      datosPaises[fiat].compra = compra;
      datosPaises[fiat].venta = venta;
    }

    if (timerAdvertencia) clearTimeout(timerAdvertencia);
    timerAdvertencia = setTimeout(() => {
      mostrarAdvertenciaPendiente(true);
    }, 250);

    renderTarjetasPaises(modoEdicionActivo);

    try {
      referenciasExternas = await obtenerReferencias();
      renderReferencias();
      limpiarInputPendiente(document.getElementById("ref-bcv-usd"));
      limpiarInputPendiente(document.getElementById("ref-bcv-eur"));
    } catch {
      mostrarToast("⚠️ No se pudieron actualizar referencias");
    }

    crucesRenderActuales = calcularTodosLosCruces(datosPaises, margenesCruce);

    escribirCruces();
    renderResumenBorrador();
    actualizarEstadoGuardadoUI();
    actualizarBotonCancelarBorrador();

    mostrarToast("✅ Cambios cargados para previsualización. Guarda cuando quieras para convertirlos en base oficial.");
  });

  // Cambios
  document.getElementById("btn-aplicar-cambios")?.addEventListener("click", () => {
    const analisis = analizarGuardado();

    if (!analisis.hayCambios) {
      mostrarToast("⚠️ No hay cambios para guardar");
      return;
    }

    mostrarResumenCambios(analisis.cambios, {
      advertencias: analisis.advertencias,
      bloqueos: analisis.bloqueos,
      autoClose: false,
    });
  });

  document.getElementById("btn-cancelar-borrador")?.addEventListener("click", () => {
    const confirmar = confirm("¿Seguro que quieres descartar los cambios pendientes?");
    if (!confirmar) return;
    restaurarBorradorCompleto();
    actualizarEstadoGuardadoUI();
  });

  document.getElementById("btn-guardar-ajustes")?.addEventListener("click", async () => {
    const btnGuardar = document.getElementById("btn-guardar-ajustes");
    if (guardadoEnCurso || btnGuardar?.disabled) return;

    guardadoEnCurso = true;
    setEstadoBotonGuardar("guardando");

    try {
      if (!Object.keys(crucesRenderActuales || {}).length) {
        aplicarCambiosEnPantalla({ mostrarToastOk: false });
      }

      const analisis = analizarGuardado();

      if (!analisis.hayCambios) {
        mostrarToast("⚠️ No hay cambios para guardar");
        return;
      }

      if (analisis.bloqueos.length) {
        mostrarResumenCambios(analisis.cambios, {
          bloqueos: analisis.bloqueos,
          advertencias: analisis.advertencias,
          autoClose: false,
        });

        mostrarToast("❌ Corrige los bloqueos antes de guardar");
        return;
      }

      if (analisis.advertencias.length) {
        mostrarToast(
          `⚠️ ${analisis.advertencias.length} advertencia(s) detectada(s). Revisa "Ver detalles" si quieres inspeccionarlas.`
        );
      }

      const crucesAntesParaPersistir = { ...(crucesAntesVisibles || {}) };

        const ok = await guardarSnapshot(analisis.snapshotAGuardar);
        if (!ok) return;

        await cargarSnapshot();

        fijarBaseMonitoreoCruces(
          analisis.snapshotAGuardar?.cruces || {},
          analisis.snapshotAGuardar?.margenesCruce || {}
        );

        crucesAntesVisibles = crucesAntesParaPersistir;
        snapshotCrucesAntesVisibles = { ...(crucesAntesParaPersistir || {}) };


        resetearBorradorMargenesDesdeAplicado();
        limpiarBorradorEdicionMasiva();

        renderResumenBorrador();
        renderGestorMasivoMargenes();
        renderTarjetasPaises(modoEdicionActivo);
        escribirCruces();
        renderMonitoreo();
        renderPerfilesMargenes();

      mostrarAdvertenciaPendiente(false);
      limpiarTodosLosPendientes();
      actualizarEstadoGuardadoUI();

      ultimoResumenGuardado = {
        cambios: Array.isArray(analisis.cambios) ? [...analisis.cambios] : [],
        advertencias: Array.isArray(analisis.advertencias) ? [...analisis.advertencias] : [],
        guardadoEn: new Date().toISOString(),
      };

      mostrarToast("✅ Snapshot guardado");
      setEstadoBotonGuardar("guardado");
      cerrarResumenCambios();
      mostrarBotonUltimosCambios();
    } finally {
      guardadoEnCurso = false;

      if (!timerBotonGuardadoOk) {
        actualizarEstadoGuardadoUI();
      }
    }
  });

  // Perfiles
  document.getElementById("btn-guardar-perfil-margen")?.addEventListener("click", () => {
    const input = document.getElementById("perfil-margen-nombre");
    guardarPerfilDesdeBorrador(input?.value || "");
  });

  document.getElementById("btn-aplicar-perfil-margen")?.addEventListener("click", () => {
    const select = document.getElementById("perfil-margen-select");
    aplicarPerfilGuardado(select?.value || "");
  });

  document.getElementById("btn-eliminar-perfil-margen")?.addEventListener("click", () => {
    const select = document.getElementById("perfil-margen-select");
    eliminarPerfilGuardado(select?.value || "");
  });

  document.getElementById("perfil-margen-select")?.addEventListener("change", (e) => {
    const nombre = e.target.value;
    const info = document.getElementById("perfil-margen-info");
    const input = document.getElementById("perfil-margen-nombre");

    if (input && nombre) input.value = nombre;

    const perfil = perfilesMargenes[nombre];
    if (!info) return;

    if (perfil?.margenesCruce) {
      const totalCruces = Object.keys(perfil.margenesCruce).length;
      const fechaTxt = formatearFechaPerfil(perfil.guardadoEn);

      info.textContent = `Perfil seleccionado: "${nombre}" · ${totalCruces} cruces · guardado: ${fechaTxt}.`;
    } else {
      info.textContent = "Selecciona un perfil o crea uno nuevo desde el borrador.";
    }
  });

  // Gestor masivo
  document.getElementById("masivo-filtro-origen")?.addEventListener("change", (e) => {
    filtroMasivoOrigen = e.target.value || "";
    renderGestorMasivoMargenes();
  });

  document.getElementById("masivo-filtro-destino")?.addEventListener("change", (e) => {
    filtroMasivoDestino = e.target.value || "";
    renderGestorMasivoMargenes();
  });

  document.getElementById("masivo-limpiar-filtros")?.addEventListener("click", () => {
    filtroMasivoOrigen = "";
    filtroMasivoDestino = "";

    const selOrigen = document.getElementById("masivo-filtro-origen");
    const selDestino = document.getElementById("masivo-filtro-destino");

    if (selOrigen) selOrigen.value = "";
    if (selDestino) selDestino.value = "";

    renderGestorMasivoMargenes();
    mostrarToast("✅ Filtros limpiados");
  });

  document.getElementById("masivo-sumar")?.addEventListener("click", () => {
    aplicarOperacionMasivaFiltrados("sumar");
  });

  document.getElementById("masivo-restar")?.addEventListener("click", () => {
    aplicarOperacionMasivaFiltrados("restar");
  });

  document.getElementById("masivo-reemplazar")?.addEventListener("click", () => {
    aplicarOperacionMasivaFiltrados("reemplazar");
  });

  document.getElementById("masivo-resetear-filtrados")?.addEventListener("click", () => {
    resetearFiltradosAValor(5);
  });

  document.getElementById("masivo-aplicar-editadas")?.addEventListener("click", () => {
    aplicarFilasEditadasMasivo();
  });

  // Cruces
  document.getElementById("btn-resetear")?.addEventListener("click", resetFiltros);

  document.getElementById("tab-origen")?.addEventListener("click", () => {
    rolVista = "origen";
    const tabO = document.getElementById("tab-origen");
    const tabD = document.getElementById("tab-destino");
    if (tabO) tabO.className = "subtab-chip px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900";
    if (tabD) tabD.className = "subtab-chip px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300";
    escribirCruces();
  });

  document.getElementById("tab-destino")?.addEventListener("click", () => {
    rolVista = "destino";
    const tabO = document.getElementById("tab-origen");
    const tabD = document.getElementById("tab-destino");
    if (tabD) tabD.className = "subtab-chip px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900";
    if (tabO) tabO.className = "subtab-chip px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300";
    escribirCruces();
  });

  // Monitoreo
  document.getElementById("btn-mon-refresh")?.addEventListener("click", async () => {
    await tickMonitoreo();
    mostrarToast("🔄 Chequeo listo");
  });

  document.getElementById("btn-mon-toggle")?.addEventListener("click", (e) => {
    pollingActivo = !pollingActivo;
    if (e?.target) e.target.textContent = pollingActivo ? "Pausar" : "Reanudar";
    if (pollingActivo) iniciarPolling();
    else detenerPolling();
    renderMonitoreo();
  });

  // Modales
  document.getElementById("btn-cerrar-resumen-cambios")?.addEventListener("click", () => {
    cerrarResumenCambios();
  });

  document.getElementById("modal-resumen-cambios")?.addEventListener("click", (e) => {
    if (e.target?.id === "modal-resumen-cambios") {
      cerrarResumenCambios();
    }
  });

  // Backup / placeholders
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === "B") {
      event.preventDefault();
      document.getElementById("input-backup")?.click();
    }
  });

  const btnVerDetalles = document.getElementById("btn-aplicar-cambios");
  if (btnVerDetalles) btnVerDetalles.textContent = "Ver detalles";

  ensureBotonUltimosCambios?.();
  bindOperacionPublicaDraftListeners?.();
  iniciarRefrescoTopbarHumana?.();

  mostrarAdvertenciaPendiente(false);
  actualizarEstadoGuardadoUI();
  actualizarBotonCancelarBorrador?.();
}