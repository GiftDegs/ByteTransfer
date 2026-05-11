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

const renderActiveTenantCard = window.renderActiveTenantCard;
const renderTenantSwitcher = window.renderTenantSwitcher;
const renderCreateTenantPlaceholder = window.renderCreateTenantPlaceholder;
const renderTenantEcosystemList = window.renderTenantEcosystemList;
const renderTenantDetailPanel = window.renderTenantDetailPanel;
const renderTenantSurfaces = window.renderTenantSurfaces;

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

