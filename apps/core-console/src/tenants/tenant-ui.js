(() => {
  const escapeHtml = window.escapeHtml;
  const getTenants = window.getTenants;

  function getTenantStatusStyles(status) {
    if (status === "operational") {
      return {
        dot: "bg-emerald-400",
        text: "text-emerald-300",
        border: "border-emerald-400/20",
        background: "bg-emerald-400/10",
      };
    }
  
    if (status === "provisioning") {
      return {
        dot: "bg-amber-400",
        text: "text-amber-300",
        border: "border-amber-400/20",
        background: "bg-amber-400/10",
      };
    }
  
    return {
      dot: "bg-slate-400",
      text: "text-slate-300",
      border: "border-white/10",
      background: "bg-black/20",
    };
  }
  
  function getModuleStatusStyles(status) {
    if (status === "current") {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    }
  
    if (status === "planned" || status === "future" || status === "future-simple") {
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
    }
  
    if (status === "upsell-ready" || status === "available") {
      return "border-violet-400/20 bg-violet-400/10 text-violet-200";
    }
  
    if (status === "locked") {
      return "border-white/10 bg-black/20 text-slate-500";
    }
  
    return "border-white/10 bg-black/20 text-slate-300";
  }
  
  function getEnabledModules(tenant) {
    return Object.values(tenant.modules || {}).filter((module) => module.enabled);
  }
  
  function getAllModules(tenant) {
    return Object.values(tenant.modules || {});
  }
  
  function getTenantMetrics() {
    const tenants = getTenants();
  
    return {
      totalTenants: tenants.length,
      operationalTenants: tenants.filter((tenant) => tenant.status === "operational").length,
      provisioningTenants: tenants.filter((tenant) => tenant.status === "provisioning").length,
      enabledModules: tenants.reduce((total, tenant) => total + getEnabledModules(tenant).length, 0),
    };
  }
  
  function renderModulePills(tenant, limit = 4) {
    const modules = getEnabledModules(tenant).slice(0, limit);
  
    if (!modules.length) {
      return `
        <span class="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          No modules enabled
        </span>
      `;
    }
  
    return modules
      .map((module) => `
        <span class="rounded-full border ${getModuleStatusStyles(module.status)} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
          ${escapeHtml(module.label)}
        </span>
      `)
      .join("");
  }
  
  function renderModuleRows(tenant) {
    const modules = getAllModules(tenant);
  
    if (!modules.length) {
      return `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
          No modules configured.
        </div>
      `;
    }
  
    return modules
      .map((module) => `
        <div class="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div>
            <p class="text-sm font-bold text-slate-200">
              ${escapeHtml(module.label)}
            </p>
  
            <p class="mt-1 text-xs text-slate-500">
              ${module.enabled ? "Enabled" : "Disabled"}
            </p>
          </div>
  
          <span class="rounded-full border ${getModuleStatusStyles(module.status)} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
            ${escapeHtml(module.status)}
          </span>
        </div>
      `)
      .join("");
  }
  
  function buildAccessSurfaces(tenant) {
    const slug = tenant.slug;
  
    return [
      {
        label: "Tenant Admin",
        path: `/remit/${slug}/admin`,
        status: tenant.modules?.tenantAdmin?.status || "planned",
      },
      {
        label: "Quote Center",
        path: `/remit/${slug}/quote-center`,
        status: tenant.modules?.quoteCenter?.status || "planned",
      },
      {
        label: "Public Calculator",
        path: `/remit/${slug}/public`,
        status: tenant.modules?.publicCalculator?.status || "planned",
      },
    ];
  }
  
  function renderAccessSurfaceRows(tenant) {
    return buildAccessSurfaces(tenant)
      .map((surface) => `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm font-bold text-slate-200">
              ${escapeHtml(surface.label)}
            </p>
  
            <span class="rounded-full border ${getModuleStatusStyles(surface.status)} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
              ${escapeHtml(surface.status)}
            </span>
          </div>
  
          <p class="mt-2 font-mono text-xs text-cyan-200/80">
            ${escapeHtml(surface.path)}
          </p>
        </div>
      `)
      .join("");
  }
  

  window.getTenantStatusStyles = getTenantStatusStyles;
  window.getModuleStatusStyles = getModuleStatusStyles;
  window.getEnabledModules = getEnabledModules;
  window.getAllModules = getAllModules;
  window.getTenantMetrics = getTenantMetrics;
  window.renderModulePills = renderModulePills;
  window.renderModuleRows = renderModuleRows;
  window.buildAccessSurfaces = buildAccessSurfaces;
  window.renderAccessSurfaceRows = renderAccessSurfaceRows;
})();

