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

const getOperationalBase = window.getOperationalBase;
const getOperationalStatusStyles = window.getOperationalStatusStyles;
const renderOperationalStatusPill = window.renderOperationalStatusPill;
const renderOperationalReferenceRows = window.renderOperationalReferenceRows;
const renderOperationalProviderRows = window.renderOperationalProviderRows;
const renderCoreControlRows = window.renderCoreControlRows;
const renderOperationalBasePanel = window.renderOperationalBasePanel;

const getQuoteEngine = window.getQuoteEngine;
const getQuoteStatusStyles = window.getQuoteStatusStyles;
const renderQuoteStatusPill = window.renderQuoteStatusPill;
const renderQuoteProviderRows = window.renderQuoteProviderRows;
const renderQuoteStrategyRows = window.renderQuoteStrategyRows;
const renderQuoteFallbackRows = window.renderQuoteFallbackRows;
const renderTenantBoundaryRows = window.renderTenantBoundaryRows;
const renderQuoteEnginePanel = window.renderQuoteEnginePanel;

const getMonitoring = window.getMonitoring;
const getMonitoringStatusStyles = window.getMonitoringStatusStyles;
const renderMonitoringStatusPill = window.renderMonitoringStatusPill;
const renderMonitoringWorkerRows = window.renderMonitoringWorkerRows;
const renderMonitoringHealthRows = window.renderMonitoringHealthRows;
const getAlertSeverityStyles = window.getAlertSeverityStyles;
const renderMonitoringAlertRows = window.renderMonitoringAlertRows;
const renderMonitoringPanel = window.renderMonitoringPanel;

const setActiveSidebarItem = window.setActiveSidebarItem;
const buildTenantSectionCards = window.buildTenantSectionCards;
const getSectionCards = window.getSectionCards;
const renderSectionContent = window.renderSectionContent;
const renderSectionCards = window.renderSectionCards;

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

