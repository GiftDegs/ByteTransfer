(() => {
  const dhemkaState = window.dhemkaState;
  const escapeHtml = window.escapeHtml;
  const getTenants = window.getTenants;
  const getActiveTenant = window.getActiveTenant;
  const getTenantStatusStyles = window.getTenantStatusStyles;
  const getModuleStatusStyles = window.getModuleStatusStyles;
  const getEnabledModules = window.getEnabledModules;
  const getAllModules = window.getAllModules;
  const renderModulePills = window.renderModulePills;
  const renderModuleRows = window.renderModuleRows;
  const buildAccessSurfaces = window.buildAccessSurfaces;
  const renderAccessSurfaceRows = window.renderAccessSurfaceRows;

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
  
  function getTenantAttention(tenant) {
    if (tenant.status === "provisioning") {
      return {
        label: "Needs setup",
        classes: "border-amber-400/20 bg-amber-400/10 text-amber-300",
        note: "Onboarding pending",
      };
    }

    if (tenant.status === "operational") {
      return {
        label: "Clear",
        classes: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        note: "No action needed",
      };
    }

    return {
      label: "Review",
      classes: "border-white/10 bg-black/20 text-slate-400",
      note: "Check tenant state",
    };
  }

  function renderTenantWorkspace(tenant) {
    const styles = getTenantStatusStyles(tenant.status);
    const branding = tenant.branding || {};

    return `
      <div
        data-tenant-workspace="${escapeHtml(tenant.id)}"
        class="border-t border-cyan-400/20 bg-cyan-400/[0.035] px-4 py-5"
      >
        <div class="rounded-3xl border border-cyan-400/20 bg-black/30 p-5 shadow-2xl shadow-cyan-950/10">

          <div class="flex items-start justify-between gap-6">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-300/70">
                Remit / Tenants / Workspace
              </p>

              <h3 class="mt-2 text-3xl font-black">
                ${escapeHtml(tenant.name)}
              </h3>

              <p class="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                Tenant resources open from here: setup, branding, users, modules, margins, limits, quote center, public calculator, billing and audit.
              </p>
            </div>

            <div class="flex items-start gap-3">
              <div class="rounded-2xl border ${styles.border} ${styles.background} px-4 py-3 text-right">
                <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Lifecycle
                </p>

                <p class="mt-1 text-sm font-black ${styles.text}">
                  ${escapeHtml(tenant.lifecycle)}
                </p>
              </div>

              <button
                type="button"
                data-close-tenant-workspace
                aria-label="Close tenant workspace"
                class="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-200"
              >
                X
              </button>
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
                Branding Provisioning
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
                  <span class="text-slate-500">Managed By</span>
                  <span class="font-bold text-cyan-200">Dhemka Core</span>
                </div>
              </div>
            </div>

            <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Tenant Resources
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
                  Modules
                </p>

                <h4 class="mt-2 text-xl font-black">
                  Tenant-owned resources and capabilities
                </h4>
              </div>

              <p class="text-sm text-slate-500">
                These resources belong to this tenant.
              </p>
            </div>

            <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              ${renderModuleRows(tenant)}
            </div>
          </div>

        </div>
      </div>
    `;
  }

  function renderTenantEcosystemList() {
    const container = document.getElementById("tenant-ecosystem-list");
    if (!container) return;

    const tenants = getTenants();

    const rows = tenants
      .map((tenant) => {
        const isActive = tenant.id === dhemkaState.activeTenantId;
        const styles = getTenantStatusStyles(tenant.status);
        const attention = getTenantAttention(tenant);

        const rowClasses = isActive
          ? "border-cyan-400/30 bg-cyan-400/10"
          : "border-white/10 bg-black/20 hover:border-cyan-400/20 hover:bg-cyan-400/5";

        const row = `
          <button
            type="button"
            data-tenant-id="${escapeHtml(tenant.id)}"
            class="grid w-full cursor-pointer gap-4 border-t ${rowClasses} px-4 py-4 text-left transition lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.9fr_1.2fr]"
          >
            <div>
              <div class="flex items-center gap-3">
                <span class="h-2.5 w-2.5 rounded-full ${styles.dot}"></span>

                <p class="text-sm font-black text-slate-100">
                  ${escapeHtml(tenant.name)}
                </p>
              </div>

              <p class="mt-1 text-xs text-slate-500">
                /remit/${escapeHtml(tenant.slug)}
              </p>
            </div>

            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Status
              </p>

              <p class="mt-1 text-sm font-bold ${styles.text}">
                ${escapeHtml(tenant.statusLabel)}
              </p>
            </div>

            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Plan
              </p>

              <p class="mt-1 text-sm font-bold text-slate-200">
                ${escapeHtml(tenant.plan)}
              </p>
            </div>

            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Attention
              </p>

              <span class="mt-2 inline-flex rounded-full border ${attention.classes} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
                ${escapeHtml(attention.label)}
              </span>

              <p class="mt-1 text-xs text-slate-500">
                ${escapeHtml(attention.note)}
              </p>
            </div>

            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Modules
              </p>

              <div class="mt-2 flex flex-wrap gap-2">
                ${renderModulePills(tenant, 3)}
              </div>
            </div>
          </button>
        `;

        return isActive ? `${row}${renderTenantWorkspace(tenant)}` : row;
      })
      .join("");

    container.innerHTML = `
      <div class="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        <div class="hidden gap-4 border-b border-white/10 bg-black/30 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 lg:grid lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.9fr_1.2fr]">
          <div>Tenant</div>
          <div>Status</div>
          <div>Plan</div>
          <div>Attention</div>
          <div>Modules</div>
        </div>

        ${rows}
      </div>
    `;
  }

  function renderTenantDetailPanel() {
    return;
  }

  function renderTenantSurfaces() {
    renderActiveTenantCard();
    renderTenantSwitcher();
    renderTenantEcosystemList();
    renderTenantDetailPanel();
  }
  

  window.renderActiveTenantCard = renderActiveTenantCard;
  window.renderTenantSwitcher = renderTenantSwitcher;
  window.renderCreateTenantPlaceholder = renderCreateTenantPlaceholder;
  window.renderTenantEcosystemList = renderTenantEcosystemList;
  window.renderTenantDetailPanel = renderTenantDetailPanel;
  window.renderTenantSurfaces = renderTenantSurfaces;
})();




