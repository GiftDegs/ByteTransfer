(() => {
  const dhemkaState = window.dhemkaState;
  const escapeHtml = window.escapeHtml;
  const getTenantMetrics = window.getTenantMetrics;
  const renderCorePlatformPanel = window.renderCorePlatformPanel;
  const renderOperationalBasePanel = window.renderOperationalBasePanel;
  const renderQuoteEnginePanel = window.renderQuoteEnginePanel;
  const renderMonitoringPanel = window.renderMonitoringPanel;

  function setActiveSidebarItem(section) {
    document.querySelectorAll("[data-section]").forEach((button) => {
      const isActive = button.dataset.section === section;
      button.classList.toggle("active", isActive);
    });
  }

  function buildTenantSectionCards() {
    const metrics = getTenantMetrics();

    return [
      {
        eyebrow: "Tenant Network",
        title: `${metrics.totalTenants} Tenants`,
        description: "Configured tenant records inside the Remit ecosystem layer.",
      },
      {
        eyebrow: "Operational Status",
        title: `${metrics.operationalTenants} Live / ${metrics.provisioningTenants} Provisioning`,
        description: "Core can distinguish live tenants from onboarding or setup tenants.",
      },
      {
        eyebrow: "Module Surface",
        title: `${metrics.enabledModules} Enabled Modules`,
        description: "Tenant capabilities are modeled as configurable modules from the beginning.",
      },
    ];
  }

  function getSectionCards(section) {
    if (dhemkaState.activeSection === "core-platform") {
      return [];
    }

    if (dhemkaState.activeSection === "tenants") {
      return buildTenantSectionCards();
    }

    return section.cards || [];
  }

  function setPanelVisibility(panelId, isVisible) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    panel.classList.toggle("hidden", !isVisible);
  }

  function setRemitButtonState(button, isActive) {
    const activeClasses = ["border-cyan-400/30", "bg-cyan-400/10", "text-cyan-100"];
    const inactiveClasses = ["border-white/10", "bg-black/20", "text-slate-400"];

    button.classList.remove(...activeClasses, ...inactiveClasses);

    if (isActive) {
      button.classList.add(...activeClasses);
    } else {
      button.classList.add(...inactiveClasses);
    }
  }

  function renderRemitSubnav() {
    const activeView = dhemkaState.activeRemitView || "overview";

    document.querySelectorAll("[data-remit-view]").forEach((button) => {
      setRemitButtonState(button, button.dataset.remitView === activeView);
    });

    document.querySelectorAll("[data-remit-view-panel]").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.remitViewPanel !== activeView);
    });
  }

  function renderContextPanels() {
    const section = dhemkaState.activeSection;

    setPanelVisibility("dashboard-support-panel", section === "dashboard");
    setPanelVisibility("remit-branch-panel", section === "remit");

    if (section === "remit") {
      renderRemitSubnav();
    }
  }

  function renderSectionContent() {
    const section = window.coreSections[dhemkaState.activeSection];

    if (!section) return;

    const eyebrow = document.getElementById("page-eyebrow");
    const title = document.getElementById("page-title");
    const description = document.getElementById("page-description");

    eyebrow.textContent = section.eyebrow;
    title.textContent = section.title;
    description.textContent = section.description;

    renderSectionCards(getSectionCards(section));
    renderCorePlatformPanel();
    renderOperationalBasePanel();
    renderQuoteEnginePanel();
    renderMonitoringPanel();
    renderContextPanels();
  }

  function renderSectionCards(cards = []) {
    const container = document.getElementById("section-cards");
    if (!container) return;

    container.innerHTML = cards
      .map((card) => `
        <div class="core-card glass rounded-3xl p-6">
          <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
            ${escapeHtml(card.eyebrow)}
          </p>

          <h3 class="mt-4 text-3xl font-black">
            ${escapeHtml(card.title)}
          </h3>

          <p class="mt-3 text-sm leading-relaxed text-slate-400">
            ${escapeHtml(card.description)}
          </p>
        </div>
      `)
      .join("");
  }

  window.setActiveSidebarItem = setActiveSidebarItem;
  window.buildTenantSectionCards = buildTenantSectionCards;
  window.getSectionCards = getSectionCards;
  window.renderRemitSubnav = renderRemitSubnav;
  window.renderSectionContent = renderSectionContent;
  window.renderSectionCards = renderSectionCards;
})();

