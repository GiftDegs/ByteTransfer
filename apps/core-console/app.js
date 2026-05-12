const dhemkaState = window.dhemkaState;
const getTenants = window.getTenants;
const setActiveSidebarItem = window.setActiveSidebarItem;
const renderSectionContent = window.renderSectionContent;
const renderTenantSurfaces = window.renderTenantSurfaces;
const renderRemitSubnav = window.renderRemitSubnav;

function scrollActiveTenantWorkspaceIntoView(tenantId) {
  if (!tenantId) return;

  window.setTimeout(() => {
    const workspace = document.querySelector(`[data-tenant-workspace="${tenantId}"]`);
    if (!workspace) return;

    workspace.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 80);
}

function setActiveTenant(tenantId) {
  const tenantExists = getTenants().some((tenant) => tenant.id === tenantId);

  if (!tenantExists) return;

  const isSameTenant = dhemkaState.activeTenantId === tenantId;

  dhemkaState.activeTenantId = isSameTenant ? null : tenantId;
  dhemkaState.activeRemitView = "tenants";

  renderTenantSurfaces();
  renderRemitSubnav();

  if (dhemkaState.activeSection === "remit") {
    renderSectionContent();
  }

  if (!isSameTenant) {
    scrollActiveTenantWorkspaceIntoView(tenantId);
  }
}

function closeTenantWorkspace() {
  dhemkaState.activeTenantId = null;

  renderTenantSurfaces();
  renderRemitSubnav();

  if (dhemkaState.activeSection === "remit") {
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
    const closeButton = event.target.closest("[data-close-tenant-workspace]");

    if (closeButton) {
      closeTenantWorkspace();
      return;
    }

    const button = event.target.closest("[data-tenant-id]");

    if (!button) return;

    setActiveTenant(button.dataset.tenantId);
  });
}

function bindRemitNavigation() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remit-view]");

    if (!button) return;

    dhemkaState.activeRemitView = button.dataset.remitView;
    renderRemitSubnav();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderTenantSurfaces();
  bindSidebarNavigation();
  bindTenantSelection();
  bindRemitNavigation();

  setActiveSidebarItem(dhemkaState.activeSection);
  renderSectionContent();
});
