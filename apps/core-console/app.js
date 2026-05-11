const dhemkaState = window.dhemkaState;
const escapeHtml = window.escapeHtml;
const getTenants = window.getTenants;
const getActiveTenant = window.getActiveTenant;

const getTenantStatusStyles = window.getTenantStatusStyles;
const getModuleStatusStyles = window.getModuleStatusStyles;
const getEnabledModules = window.getEnabledModules;
const getAllModules = window.getAllModules;
const getTenantMetrics = window.getTenantMetrics;
const renderModulePills = window.renderModulePills;
const renderModuleRows = window.renderModuleRows;
const buildAccessSurfaces = window.buildAccessSurfaces;
const renderAccessSurfaceRows = window.renderAccessSurfaceRows;

function getOperationalBase() {
  return window.coreOperationalBase || null;
}

function getOperationalStatusStyles(status) {
  if (status === "active" || status === "healthy") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "standby") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-white/10 bg-black/20 text-slate-300";
}

function renderOperationalStatusPill(status) {
  return `
    <span class="rounded-full border ${getOperationalStatusStyles(status)} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
      ${escapeHtml(status)}
    </span>
  `;
}

function renderOperationalReferenceRows(references = []) {
  if (!references.length) {
    return `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
        No references configured.
      </div>
    `;
  }

  return references
    .map((reference) => `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-bold text-slate-200">
              ${escapeHtml(reference.name)}
            </p>

            <p class="mt-1 text-xs text-slate-500">
              ${escapeHtml(reference.scope)}
            </p>
          </div>

          ${renderOperationalStatusPill(reference.status)}
        </div>

        <p class="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
          Owned by ${escapeHtml(reference.owner)}
        </p>
      </div>
    `)
    .join("");
}

function renderOperationalProviderRows(providers = []) {
  if (!providers.length) {
    return `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
        No providers configured.
      </div>
    `;
  }

  return providers
    .map((provider) => `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-bold text-slate-200">
              ${escapeHtml(provider.name)}
            </p>

            <p class="mt-1 text-xs text-slate-500">
              ${escapeHtml(provider.role)}
            </p>
          </div>

          ${renderOperationalStatusPill(provider.status)}
        </div>
      </div>
    `)
    .join("");
}

function renderCoreControlRows(controls = []) {
  if (!controls.length) {
    return `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
        No Core controls configured.
      </div>
    `;
  }

  return controls
    .map((control) => `
      <div class="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-bold text-slate-200">
              ${escapeHtml(control.label)}
            </p>

            <p class="mt-1 text-xs text-slate-500">
              ${escapeHtml(control.access)}
            </p>
          </div>

          <span class="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-200">
            ${control.lockedForTenants ? "Tenant Locked" : "Available"}
          </span>
        </div>
      </div>
    `)
    .join("");
}

function renderOperationalBasePanel() {
  const container = document.getElementById("operational-base-panel");
  if (!container) return;

  const base = getOperationalBase();

  if (dhemkaState.activeSection !== "operational-base" || !base) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  container.classList.remove("hidden");

  container.innerHTML = `
    <div class="flex items-start justify-between gap-6">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
          Core-only Layer
        </p>

        <h3 class="mt-2 text-3xl font-black">
          Operational Base Control
        </h3>

        <p class="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          Dhemka Core owns the global market base. Tenants can configure commercial rules, but they cannot edit provider strategy, polling workers or global snapshots.
        </p>
      </div>

      <div class="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-right">
        <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Owner
        </p>

        <p class="mt-1 text-sm font-black text-cyan-200">
          ${escapeHtml(base.snapshot.owner)}
        </p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Global Snapshot
        </p>

        <h4 class="mt-3 text-2xl font-black">
          ${escapeHtml(base.snapshot.label)}
        </h4>

        <p class="mt-3 text-sm leading-relaxed text-slate-400">
          ${escapeHtml(base.snapshot.description)}
        </p>

        <div class="mt-5 grid gap-3 text-sm">
          <div class="flex items-center justify-between gap-4">
            <span class="text-slate-500">Status</span>
            ${renderOperationalStatusPill(base.snapshot.status)}
          </div>

          <div class="flex items-center justify-between gap-4">
            <span class="text-slate-500">Last Updated</span>
            <span class="font-bold text-slate-200">${escapeHtml(base.snapshot.lastUpdated)}</span>
          </div>
        </div>
      </div>

      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Market References
        </p>

        <div class="mt-5 grid gap-3 md:grid-cols-3">
          ${renderOperationalReferenceRows(base.references)}
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Provider Health
        </p>

        <div class="mt-5 grid gap-3">
          ${renderOperationalProviderRows(base.providers)}
        </div>
      </div>

      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Core-only Controls
        </p>

        <div class="mt-5 grid gap-3">
          ${renderCoreControlRows(base.controls)}
        </div>
      </div>
    </div>
  `;
}
function getQuoteEngine() {
  return window.coreQuoteEngine || null;
}

function getQuoteStatusStyles(status) {
  if (status === "active" || status === "available") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "standby") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  if (status === "planned") {
    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  }

  return "border-white/10 bg-black/20 text-slate-300";
}

function renderQuoteStatusPill(status) {
  return `
    <span class="rounded-full border ${getQuoteStatusStyles(status)} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
      ${escapeHtml(status)}
    </span>
  `;
}

function renderQuoteProviderRows(providers = []) {
  if (!providers.length) {
    return `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
        No quote providers configured.
      </div>
    `;
  }

  return providers
    .map((provider) => `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold text-slate-200">
              ${escapeHtml(provider.name)}
            </p>

            <p class="mt-1 text-xs text-slate-500">
              ${escapeHtml(provider.role)}
            </p>
          </div>

          ${renderQuoteStatusPill(provider.status)}
        </div>

        <p class="mt-3 text-xs leading-relaxed text-slate-400">
          ${escapeHtml(provider.scope)}
        </p>
      </div>
    `)
    .join("");
}

function renderQuoteStrategyRows(strategies = []) {
  if (!strategies.length) {
    return `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
        No aggregation strategies configured.
      </div>
    `;
  }

  return strategies
    .map((strategy) => `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div class="flex items-center justify-between gap-4">
          <p class="text-sm font-bold text-slate-200">
            ${escapeHtml(strategy.name)}
          </p>

          ${renderQuoteStatusPill(strategy.status)}
        </div>

        <p class="mt-3 text-xs leading-relaxed text-slate-500">
          ${escapeHtml(strategy.description)}
        </p>
      </div>
    `)
    .join("");
}

function renderQuoteFallbackRows(fallbacks = []) {
  if (!fallbacks.length) {
    return `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
        No fallback systems configured.
      </div>
    `;
  }

  return fallbacks
    .map((fallback) => `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div class="flex items-center justify-between gap-4">
          <p class="text-sm font-bold text-slate-200">
            ${escapeHtml(fallback.name)}
          </p>

          ${renderQuoteStatusPill(fallback.status)}
        </div>

        <p class="mt-3 text-xs leading-relaxed text-slate-500">
          ${escapeHtml(fallback.description)}
        </p>
      </div>
    `)
    .join("");
}

function renderTenantBoundaryRows(boundary = []) {
  if (!boundary.length) {
    return `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
        No tenant boundary rules configured.
      </div>
    `;
  }

  return boundary
    .map((rule) => {
      const pillClass = rule.allowed
        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
        : "border-rose-400/20 bg-rose-400/10 text-rose-200";

      return `
        <div class="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p class="text-sm font-bold text-slate-200">
            ${escapeHtml(rule.label)}
          </p>

          <span class="rounded-full border ${pillClass} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
            ${rule.allowed ? "Allowed" : "Core Locked"}
          </span>
        </div>
      `;
    })
    .join("");
}

function renderQuoteEnginePanel() {
  const container = document.getElementById("quote-engine-panel");
  if (!container) return;

  const engine = getQuoteEngine();

  if (dhemkaState.activeSection !== "quote-engine" || !engine) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  container.classList.remove("hidden");

  container.innerHTML = `
    <div class="flex items-start justify-between gap-6">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
          Core-owned Engine
        </p>

        <h3 class="mt-2 text-3xl font-black">
          Quote Engine Control
        </h3>

        <p class="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          ${escapeHtml(engine.description)}
        </p>
      </div>

      <div class="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-right">
        <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Owner
        </p>

        <p class="mt-1 text-sm font-black text-cyan-200">
          ${escapeHtml(engine.owner)}
        </p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Providers
        </p>

        <div class="mt-5 grid gap-3 md:grid-cols-3">
          ${renderQuoteProviderRows(engine.providers)}
        </div>
      </div>

      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Aggregation Strategies
        </p>

        <div class="mt-5 grid gap-3">
          ${renderQuoteStrategyRows(engine.strategies)}
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Fallback Systems
        </p>

        <div class="mt-5 grid gap-3">
          ${renderQuoteFallbackRows(engine.fallbacks)}
        </div>
      </div>

      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Tenant Boundary
        </p>

        <p class="mt-2 text-sm leading-relaxed text-slate-500">
          Tenants can configure commercial behavior, but they cannot change the Core quote engine.
        </p>

        <div class="mt-5 grid gap-3">
          ${renderTenantBoundaryRows(engine.tenantBoundary)}
        </div>
      </div>
    </div>
  `;
}
function getMonitoring() {
  return window.coreMonitoring || null;
}

function getMonitoringStatusStyles(status) {
  if (status === "active" || status === "healthy" || status === "optimized" || status === "controlled") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "planned" || status === "watch") {
    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  }

  if (status === "critical") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  return "border-white/10 bg-black/20 text-slate-300";
}

function renderMonitoringStatusPill(status) {
  return `
    <span class="rounded-full border ${getMonitoringStatusStyles(status)} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
      ${escapeHtml(status)}
    </span>
  `;
}

function renderMonitoringWorkerRows(workers = []) {
  if (!workers.length) {
    return `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
        No workers configured.
      </div>
    `;
  }

  return workers
    .map((worker) => `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold text-slate-200">
              ${escapeHtml(worker.name)}
            </p>

            <p class="mt-1 text-xs leading-relaxed text-slate-500">
              ${escapeHtml(worker.role)}
            </p>
          </div>

          ${renderMonitoringStatusPill(worker.status)}
        </div>
      </div>
    `)
    .join("");
}

function renderMonitoringHealthRows(healthItems = []) {
  if (!healthItems.length) {
    return `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
        No health checks configured.
      </div>
    `;
  }

  return healthItems
    .map((item) => `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold text-slate-200">
              ${escapeHtml(item.label)}
            </p>

            <p class="mt-1 text-xs leading-relaxed text-slate-500">
              ${escapeHtml(item.detail)}
            </p>
          </div>

          ${renderMonitoringStatusPill(item.status)}
        </div>
      </div>
    `)
    .join("");
}

function getAlertSeverityStyles(severity) {
  if (severity === "critical") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  if (severity === "watch") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  if (severity === "planned") {
    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  }

  return "border-white/10 bg-black/20 text-slate-300";
}

function renderMonitoringAlertRows(alerts = []) {
  if (!alerts.length) {
    return `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
        No global alerts configured.
      </div>
    `;
  }

  return alerts
    .map((alert) => `
      <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-bold text-slate-200">
              ${escapeHtml(alert.label)}
            </p>

            <p class="mt-1 text-xs leading-relaxed text-slate-500">
              ${escapeHtml(alert.description)}
            </p>
          </div>

          <span class="rounded-full border ${getAlertSeverityStyles(alert.severity)} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
            ${escapeHtml(alert.severity)}
          </span>
        </div>
      </div>
    `)
    .join("");
}

function renderMonitoringPanel() {
  const container = document.getElementById("monitoring-panel");
  if (!container) return;

  const monitoring = getMonitoring();

  if (dhemkaState.activeSection !== "monitoring" || !monitoring) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  container.classList.remove("hidden");

  container.innerHTML = `
    <div class="flex items-start justify-between gap-6">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
          Core Monitoring Layer
        </p>

        <h3 class="mt-2 text-3xl font-black">
          Runtime & Worker Health
        </h3>

        <p class="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          ${escapeHtml(monitoring.description)}
        </p>
      </div>

      <div class="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-right">
        <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Owner
        </p>

        <p class="mt-1 text-sm font-black text-cyan-200">
          ${escapeHtml(monitoring.owner)}
        </p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Polling
        </p>

        <h4 class="mt-3 text-2xl font-black">
          ${escapeHtml(monitoring.polling.label)}
        </h4>

        <p class="mt-3 text-sm leading-relaxed text-slate-400">
          ${escapeHtml(monitoring.polling.description)}
        </p>

        <div class="mt-5 grid gap-3 text-sm">
          <div class="flex items-center justify-between gap-4">
            <span class="text-slate-500">Interval</span>
            <span class="font-bold text-slate-200">${escapeHtml(monitoring.polling.interval)}</span>
          </div>

          <div class="flex items-center justify-between gap-4">
            <span class="text-slate-500">Owner</span>
            <span class="font-bold text-slate-200">${escapeHtml(monitoring.polling.owner)}</span>
          </div>

          <div class="flex items-center justify-between gap-4">
            <span class="text-slate-500">Status</span>
            ${renderMonitoringStatusPill(monitoring.polling.status)}
          </div>
        </div>
      </div>

      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Workers
        </p>

        <div class="mt-5 grid gap-3">
          ${renderMonitoringWorkerRows(monitoring.workers)}
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Runtime Health
        </p>

        <div class="mt-5 grid gap-3">
          ${renderMonitoringHealthRows(monitoring.health)}
        </div>
      </div>

      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Global Alerts
        </p>

        <div class="mt-5 grid gap-3">
          ${renderMonitoringAlertRows(monitoring.alerts)}
        </div>
      </div>
    </div>
  `;
}
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
  if (dhemkaState.activeSection === "tenants") {
    return buildTenantSectionCards();
  }

  return section.cards || [];
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
  renderOperationalBasePanel();
  renderQuoteEnginePanel();
  renderMonitoringPanel();
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

function renderActiveTenantCard() {
  const container = document.getElementById("active-tenant-card");
  if (!container) return;

  const tenant = getActiveTenant();

  if (!tenant) {
    container.innerHTML = `
      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-sm text-slate-400">
          No active tenant selected.
        </p>
      </div>
    `;
    return;
  }

  const styles = getTenantStatusStyles(tenant.status);

  container.innerHTML = `
    <div class="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/70">
            ${escapeHtml(tenant.product)}
          </p>

          <h2 class="mt-2 text-2xl font-black">
            ${escapeHtml(tenant.name)}
          </h2>
        </div>

        <div class="status-dot h-3 w-3 shrink-0 rounded-full ${styles.dot}"></div>
      </div>

      <p class="mt-3 text-sm text-slate-300">
        ${escapeHtml(tenant.description)}
      </p>

      <div class="mt-4 grid gap-2 text-xs text-slate-400">
        <div class="flex items-center justify-between gap-3">
          <span>Slug</span>
          <span class="font-bold text-slate-200">/remit/${escapeHtml(tenant.slug)}</span>
        </div>

        <div class="flex items-center justify-between gap-3">
          <span>Plan</span>
          <span class="font-bold text-slate-200">${escapeHtml(tenant.plan)}</span>
        </div>
      </div>

      <div class="mt-4 inline-flex rounded-full border ${styles.border} ${styles.background} px-3 py-1">
        <span class="text-[11px] font-bold uppercase tracking-[0.22em] ${styles.text}">
          ${escapeHtml(tenant.statusLabel)}
        </span>
      </div>
    </div>
  `;
}

function renderTenantSwitcher() {
  const container = document.getElementById("tenant-switcher");
  if (!container) return;

  const tenants = getTenants();

  container.innerHTML = tenants
    .map((tenant) => {
      const isActive = tenant.id === dhemkaState.activeTenantId;
      const styles = getTenantStatusStyles(tenant.status);

      const activeClasses = isActive
        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
        : "border-white/10 bg-black/20 text-slate-300 hover:border-cyan-400/20 hover:bg-cyan-400/5";

      return `
        <button
          type="button"
          data-tenant-id="${escapeHtml(tenant.id)}"
          class="w-full rounded-2xl border ${activeClasses} px-4 py-3 text-left transition"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-bold">
                ${escapeHtml(tenant.name)}
              </p>

              <p class="mt-1 text-xs text-slate-500">
                ${escapeHtml(tenant.product)} · ${escapeHtml(tenant.plan)}
              </p>
            </div>

            <div class="status-dot h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot}"></div>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderCreateTenantPlaceholder() {
  return `
    <div class="rounded-2xl border border-dashed border-cyan-400/20 bg-cyan-400/5 p-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="font-bold text-cyan-100">
            Create Tenant
          </p>

          <p class="mt-1 text-xs leading-relaxed text-slate-500">
            Future provisioning flow for adding a new remittance operator into Remit.
          </p>
        </div>

        <span class="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
          Soon
        </span>
      </div>

      <button
        type="button"
        disabled
        class="mt-4 cursor-not-allowed rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-500"
      >
        Provisioning flow locked
      </button>
    </div>
  `;
}

function renderTenantEcosystemList() {
  const container = document.getElementById("tenant-ecosystem-list");
  if (!container) return;

  const tenants = getTenants();

  const tenantCards = tenants
    .map((tenant) => {
      const isActive = tenant.id === dhemkaState.activeTenantId;
      const styles = getTenantStatusStyles(tenant.status);

      const cardClasses = isActive
        ? "border-cyan-400/20 bg-cyan-400/10"
        : "border-white/10 bg-black/20";

      return `
        <div class="rounded-2xl border ${cardClasses} p-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="font-bold">
                ${escapeHtml(tenant.name)}
              </p>

              <p class="mt-1 text-xs text-slate-400">
                ${escapeHtml(tenant.product)} · ${escapeHtml(tenant.statusLabel)} · ${escapeHtml(tenant.plan)}
              </p>
            </div>

            <div class="status-dot h-3 w-3 shrink-0 rounded-full ${styles.dot}"></div>
          </div>

          <p class="mt-3 text-xs leading-relaxed text-slate-500">
            ${escapeHtml(tenant.description)}
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            ${renderModulePills(tenant)}
          </div>

          <button
            type="button"
            data-tenant-id="${escapeHtml(tenant.id)}"
            class="mt-4 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-200"
          >
            ${isActive ? "Selected Tenant" : "Select Tenant"}
          </button>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `${tenantCards}${renderCreateTenantPlaceholder()}`;
}

function renderTenantDetailPanel() {
  const container = document.getElementById("tenant-detail-panel");
  if (!container) return;

  const tenant = getActiveTenant();

  if (!tenant) {
    container.innerHTML = "";
    return;
  }

  const styles = getTenantStatusStyles(tenant.status);
  const branding = tenant.branding || {};

  container.innerHTML = `
    <div class="flex items-start justify-between gap-6">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
          Tenant Detail
        </p>

        <h3 class="mt-2 text-3xl font-black">
          ${escapeHtml(tenant.name)}
        </h3>

        <p class="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          ${escapeHtml(tenant.name)} runs as a tenant inside Dhemka Core / ${escapeHtml(tenant.product)}. Core owns the infrastructure; this tenant owns its commercial configuration.
        </p>
      </div>

      <div class="rounded-2xl border ${styles.border} ${styles.background} px-4 py-3 text-right">
        <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Lifecycle
        </p>

        <p class="mt-1 text-sm font-black ${styles.text}">
          ${escapeHtml(tenant.lifecycle)}
        </p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-3">
      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Tenant Profile
        </p>

        <div class="mt-5 space-y-4 text-sm">
          <div class="flex items-center justify-between gap-4">
            <span class="text-slate-500">Product</span>
            <span class="font-bold text-slate-200">${escapeHtml(tenant.product)}</span>
          </div>

          <div class="flex items-center justify-between gap-4">
            <span class="text-slate-500">Plan</span>
            <span class="font-bold text-slate-200">${escapeHtml(tenant.plan)}</span>
          </div>

          <div class="flex items-center justify-between gap-4">
            <span class="text-slate-500">Slug</span>
            <span class="font-mono text-xs font-bold text-cyan-200">/remit/${escapeHtml(tenant.slug)}</span>
          </div>

          <div class="flex items-center justify-between gap-4">
            <span class="text-slate-500">Status</span>
            <span class="font-bold ${styles.text}">${escapeHtml(tenant.statusLabel)}</span>
          </div>
        </div>
      </div>

      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Branding
        </p>

        <div class="mt-5 space-y-4 text-sm">
          <div class="flex items-center justify-between gap-4">
            <span class="text-slate-500">Primary Color</span>
            <span class="font-bold text-slate-200">${escapeHtml(branding.primaryColor || "not-set")}</span>
          </div>

          <div class="flex items-center justify-between gap-4">
            <span class="text-slate-500">Logo Mode</span>
            <span class="font-bold text-slate-200">${escapeHtml(branding.logoMode || "not-set")}</span>
          </div>

          <div class="flex items-center justify-between gap-4">
            <span class="text-slate-500">Core Signature</span>
            <span class="font-bold text-cyan-200">${branding.poweredByCore ? "Powered by Dhemka Core" : "Hidden"}</span>
          </div>
        </div>
      </div>

      <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Access Surfaces
        </p>

        <div class="mt-5 space-y-3">
          ${renderAccessSurfaceRows(tenant)}
        </div>
      </div>
    </div>

    <div class="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Enabled Modules
          </p>

          <h4 class="mt-2 text-xl font-black">
            Commercial configuration layer
          </h4>
        </div>

        <p class="text-sm text-slate-500">
          Tenant can configure commercial rules, not Core market base.
        </p>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        ${renderModuleRows(tenant)}
      </div>
    </div>
  `;
}

function renderTenantSurfaces() {
  renderActiveTenantCard();
  renderTenantSwitcher();
  renderTenantEcosystemList();
  renderTenantDetailPanel();
}

function setActiveTenant(tenantId) {
  const tenantExists = getTenants().some((tenant) => tenant.id === tenantId);

  if (!tenantExists) return;

  dhemkaState.activeTenantId = tenantId;

  renderTenantSurfaces();

  if (dhemkaState.activeSection === "tenants") {
    renderSectionContent();
  }
}

function bindSidebarNavigation() {
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => {
      dhemkaState.activeSection = button.dataset.section;

      setActiveSidebarItem(dhemkaState.activeSection);
      renderSectionContent();
    });
  });
}

function bindTenantSelection() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tenant-id]");

    if (!button) return;

    setActiveTenant(button.dataset.tenantId);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderTenantSurfaces();
  bindSidebarNavigation();
  bindTenantSelection();

  setActiveSidebarItem(dhemkaState.activeSection);
  renderSectionContent();
});

