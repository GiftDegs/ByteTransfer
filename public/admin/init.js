"use strict";

// =====================================================
// INIT
// =====================================================
(async () => {
  const loader = document.getElementById("loader");
  
  try {
    if (loader) loader.style.display = "flex";

    setLoaderStep("Verificando acceso", 8, "Comprobando que tienes permiso para entrar...");
    ensureToast();
    await requireAdminAccess();

    setLoaderStep("Leyendo entorno", 15, "Detectando si estás en local, prueba o producción...");
    await cargarBadgeEntorno();

    setLoaderStep("Preparando interfaz", 24, "Activando navegación, botones y pestañas...");
    bindUI();
    activarVistaPrincipal("monitoreo");
    activarConfigTab("precios");

    setLoaderStep("Cargando perfiles", 32, "Preparando perfiles de márgenes guardados...");
    cargarPerfilesMargenes();
    renderPerfilesMargenes();

    setLoaderStep("Cargando monedas", 40, "Leyendo las monedas disponibles del sistema...");
    await cargarMonedasConfiguradas();

    setLoaderStep("Cargando base guardada", 50, "Leyendo el último snapshot para usarlo como referencia...");
    await cargarSnapshot();
    renderInfoZonaHoraria();

    setLoaderStep("Preparando paneles", 60, "Ordenando precios, cruces, márgenes y resumen...");
    initSelectorPaisesCruces();
    renderResumenBorrador();
    llenarSelectGestorMasivo();
    renderGestorMasivoMargenes();

    setLoaderStep("Cargando motor", 68, "Leyendo configuración del motor de cotizaciones...");
    await cargarPanelEstrategiasCotizacion();

    setLoaderStep("Comparando métodos", 74, "Revisando promedio, mediana y señales del mercado...");
    await cargarComparacionMetodoCotizacion();

    setLoaderStep("Pintando datos", 82, "Mostrando precios, cruces y estado visual...");
    renderTarjetasPaises(modoEdicionActivo);
    escribirCruces();
    mostrarAdvertenciaPendiente(false);
    actualizarTopbar();

    setLoaderStep("Consultando mercado", 88, "Buscando precios live para comparar contra la base guardada...");
    await tickMonitoreo(({ porcentaje, texto, detalle }) => {
      const pctSeguro = Math.max(88, Math.min(97, Number(porcentaje) || 88));
      setLoaderStep(texto || "Consultando mercado", pctSeguro, detalle || "Actualizando datos live...");
    });

    setLoaderStep("Finalizando", 100, "Activando monitoreo automático...", { activo: false });
    iniciarPolling();

    setTimeout(() => {
      if (loader) loader.style.display = "none";
    }, 350);
  } catch (err) {
    console.error("❌ Error de arranque del admin:", err);
    setLoaderError("No se pudo cargar el panel", err?.message || "Error desconocido");
    mostrarToast("❌ Error al cargar el panel admin");
  }
})();