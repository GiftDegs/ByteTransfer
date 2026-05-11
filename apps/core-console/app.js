const dhemkaState = {
  activeSection: "dashboard",
  activeTenantId: "bytetransfer",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTenants() {
  return Array.isArray(window.coreTenants) ? window.coreTenants : [];
}

function getActiveTenant() {
  return getTenants().find((tenant) => tenant.id === dhemkaState.activeTenantId) || null;
}

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

function setActiveSidebarItem(section) {
  document.querySelectorAll("[data-section]").forEach((button) => {
    const isActive = button.dataset.section === section;
    button.classList.toggle("active", isActive);
  });
}

function buildTenantSectionCards() {
  return getTenants().map((tenant) => {
    const isActive = tenant.id === dhemkaState.activeTenantId;
    const moduleCount = getEnabledModules(tenant).length;

    return {
      eyebrow: `${tenant.product} · ${tenant.statusLabel}`,
      title: tenant.name,
      description: `${isActive ? "Selected in Core Console. " : ""}${tenant.plan} plan · ${moduleCount} enabled modules · /remit/${tenant.slug}`,
    };
  });
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

function renderTenantEcosystemList() {
  const container = document.getElementById("tenant-ecosystem-list");
  if (!container) return;

  const tenants = getTenants();

  container.innerHTML = tenants
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
