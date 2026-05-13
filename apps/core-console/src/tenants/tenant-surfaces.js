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

  function getTenantEnabledModuleCount(tenant) {
    const modules = tenant.modules;

    if (Array.isArray(modules)) {
      return modules.filter((module) => module && module.enabled !== false).length;
    }

    if (modules && typeof modules === "object") {
      return Object.values(modules).filter((module) => module && module.enabled === true).length;
    }

    if (Array.isArray(tenant.enabledModules)) {
      return tenant.enabledModules.length;
    }

    if (Array.isArray(tenant.accessSurfaces)) {
      return tenant.accessSurfaces.length;
    }

    return 0;
  }
  function getTenantResourceItems(tenant) {
    return [
      {
        title: "Setup",
        description: "Onboarding, base data and readiness checklist.",
        status: tenant.status === "provisioning" ? "Needs setup" : "Ready",
        tone: tenant.status === "provisioning" ? "warning" : "healthy",
        action: tenant.status === "provisioning" ? "Continue setup" : "View setup",
      },
      {
        title: "Branding",
        description: "Logo, colors, public identity and Core-managed provisioning.",
        status: "Core managed",
        tone: "planned",
        action: "View provisioning",
      },
      {
        title: "Users",
        description: "Tenant admins, managers, receivers and future processors.",
        status: "Future",
        tone: "neutral",
        action: "Design later",
      },
      {
        title: "Modules",
        description: "Enabled services and tenant capabilities.",
        status: `${getTenantEnabledModuleCount(tenant)} enabled`,
        tone: "healthy",
        action: "Review modules",
      },
      {
        title: "Margins",
        description: "Commercial rules, route margins and tenant configuration.",
        status: "Future",
        tone: "neutral",
        action: "Configure later",
      },
      {
        title: "Limits",
        description: "Minimums, maximums and USDT-equivalent protection.",
        status: "Future",
        tone: "neutral",
        action: "Design later",
      },
      {
        title: "Quote Center",
        description: "Internal quote surface for managers with login.",
        status: "Current",
        tone: "healthy",
        action: "Open quote center",
      },
      {
        title: "Public Calculator",
        description: "Simple public client quote surface linked to this tenant.",
        status: "Future-simple",
        tone: "planned",
        action: "Prepare public calculator",
      },
      {
        title: "Billing",
        description: "Plan, trial, payment status and module access.",
        status: "Future",
        tone: "neutral",
        action: "View billing plan",
      },
      {
        title: "Audit",
        description: "Support access, configuration changes and sensitive actions.",
        status: "Future",
        tone: "neutral",
        action: "View audit trail",
      },
    ];
  }

  function getResourceToneClasses(tone) {
    const tones = {
      healthy: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      planned: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
      neutral: "border-white/10 bg-black/20 text-slate-400",
    };

    return tones[tone] || tones.neutral;
  }

  function renderTenantResourceLauncher(tenant) {
    return getTenantResourceItems(tenant)
      .map((item) => `
        <button
          type="button"
          class="group rounded-3xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-cyan-400/25 hover:bg-cyan-400/[0.04]"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-black text-slate-100">
                ${escapeHtml(item.title)}
              </p>

              <p class="mt-2 text-xs leading-relaxed text-slate-500">
                ${escapeHtml(item.description)}
              </p>
            </div>

            <span class="shrink-0 rounded-full border ${getResourceToneClasses(item.tone)} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
              ${escapeHtml(item.status)}
            </span>
          </div>

          <p class="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 transition group-hover:text-cyan-300">
            ${escapeHtml(item.action || "Open resource")}
          </p>
        </button>
      `)
      .join("");
  }

  function renderTenantSetupSignals(tenant) {
    const signals = tenant.status === "provisioning"
      ? [
          ["Base configuration", "Pending"],
          ["Branding provisioning", "Pending"],
          ["Initial users", "Pending"],
          ["Quote surfaces", "Draft"],
        ]
      : [
          ["Base configuration", "Ready"],
          ["Branding provisioning", "Core managed"],
          ["Initial users", "Future"],
          ["Quote surfaces", "Available"],
        ];

    return signals
      .map(([label, status]) => `
        <div class="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p class="text-sm font-bold text-slate-200">
            ${escapeHtml(label)}
          </p>

          <span class="text-xs font-bold text-slate-500">
            ${escapeHtml(status)}
          </span>
        </div>
      `)
      .join("");
  }

  function renderTenantWorkspace(tenant) {
    const styles = getTenantStatusStyles(tenant.status);
    const branding = tenant.branding || {};
    const attention = getTenantAttention(tenant);

    return `
      <div
        data-tenant-workspace="${escapeHtml(tenant.id)}"
        class="border-t border-cyan-400/20 bg-cyan-400/[0.035] px-4 py-5"
      >
        <div class="rounded-[2rem] border border-cyan-400/20 bg-black/30 p-5 shadow-2xl shadow-cyan-950/10">

          <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-300/70">
                Remit / Tenants / Workspace
              </p>

              <h3 class="mt-2 text-3xl font-black">
                ${escapeHtml(tenant.name)}
              </h3>

              <p class="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                Tenant workspace for setup, branding, users, modules, margins, limits, quote center, public calculator, billing and audit.
              </p>
            </div>

            <div class="flex flex-wrap items-start gap-3 xl:justify-end">
              <div class="rounded-2xl border ${styles.border} ${styles.background} px-4 py-3 text-right">
                <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Lifecycle
                </p>

                <p class="mt-1 text-sm font-black ${styles.text}">
                  ${escapeHtml(tenant.lifecycle)}
                </p>
              </div>

              <div class="rounded-2xl border ${attention.classes} px-4 py-3 text-right">
                <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Attention
                </p>

                <p class="mt-1 text-sm font-black">
                  ${escapeHtml(attention.label)}
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

          <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Product
              </p>

              <p class="mt-2 text-lg font-black text-slate-100">
                ${escapeHtml(tenant.product)}
              </p>
            </div>

            <div class="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Plan
              </p>

              <p class="mt-2 text-lg font-black text-slate-100">
                ${escapeHtml(tenant.plan)}
              </p>
            </div>

            <div class="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Slug
              </p>

              <p class="mt-2 font-mono text-sm font-black text-cyan-200">
                /remit/${escapeHtml(tenant.slug)}
              </p>
            </div>

            <div class="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Branding
              </p>

              <p class="mt-2 text-lg font-black text-slate-100">
                ${escapeHtml(branding.logoMode || "not-set")}
              </p>
            </div>
          </div>

          <div class="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
            <section class="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    Setup Signals
                  </p>

                  <h4 class="mt-2 text-xl font-black">
                    Configuration readiness
                  </h4>
                </div>

                <span class="rounded-full border ${attention.classes} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
                  ${escapeHtml(attention.label)}
                </span>
              </div>

              <div class="mt-5 space-y-3">
                ${renderTenantSetupSignals(tenant)}
              </div>
            </section>

            <section class="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    Resource Launcher
                  </p>

                  <h4 class="mt-2 text-xl font-black">
                    Tenant-owned resources
                  </h4>
                </div>

                <p class="max-w-xs text-right text-xs leading-relaxed text-slate-500">
                  Resources belong to this tenant and should open from this workspace.
                </p>
              </div>

              <div class="mt-5 grid gap-3 md:grid-cols-2">
                ${renderTenantResourceLauncher(tenant)}
              </div>
            </section>
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








