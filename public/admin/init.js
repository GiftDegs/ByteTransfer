"use strict";

// =====================================================
// INIT
// =====================================================
(async () => {
  const loader = document.getElementById("loader");

  try {
    if (loader) loader.style.display = "flex";

    setLoaderStep("Verificando acceso", 10, "Comprobando Admin Key...");
    ensureToast();
    await requireAdminAccess();

    setLoaderStep("Preparando interfaz", 25, "Conectando navegación y controles...");
    bindUI();
    activarVistaPrincipal("monitoreo");
    activarConfigTab("precios");

    cargarPerfilesMargenes();
    renderPerfilesMargenes();

    setLoaderStep("Cargando monedas", 40, "Leyendo configuración dinámica...");
    await cargarMonedasConfiguradas();

    setLoaderStep("Cargando snapshot", 45, "Leyendo último estado guardado...");
    await cargarSnapshot();
    renderInfoZonaHoraria();

    setLoaderStep("Montando panel", 60, "Preparando vistas y resumen...");
    initSelectorPaisesCruces();
    renderResumenBorrador();
    llenarSelectGestorMasivo();
    renderGestorMasivoMargenes();
    await cargarPanelEstrategiasCotizacion();
    await cargarComparacionMetodoCotizacion();

    setLoaderStep("Renderizando datos", 70, "Pintando precios y cruces...");
    renderTarjetasPaises(modoEdicionActivo);
    escribirCruces();
    mostrarAdvertenciaPendiente(false);
    actualizarTopbar();

    setLoaderStep("Consultando monitoreo", 80, "Obteniendo mercado live inicial...");
    await tickMonitoreo(({ porcentaje, texto, detalle }) => {
      setLoaderStep(texto, porcentaje, detalle);
    });

    setLoaderStep("Finalizando", 100, "Iniciando monitoreo automático...");
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