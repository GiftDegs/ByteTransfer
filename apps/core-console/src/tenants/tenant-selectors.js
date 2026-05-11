window.getTenants = function getTenants() {
  return Array.isArray(window.coreTenants) ? window.coreTenants : [];
};

window.getActiveTenant = function getActiveTenant() {
  return window.getTenants().find((tenant) => tenant.id === window.dhemkaState.activeTenantId) || null;
};

