(() => {
  const escapeHtml = window.escapeHtml;
  const dhemkaState = window.dhemkaState;

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

  window.getOperationalBase = getOperationalBase;
  window.getOperationalStatusStyles = getOperationalStatusStyles;
  window.renderOperationalStatusPill = renderOperationalStatusPill;
  window.renderOperationalReferenceRows = renderOperationalReferenceRows;
  window.renderOperationalProviderRows = renderOperationalProviderRows;
  window.renderCoreControlRows = renderCoreControlRows;
  window.renderOperationalBasePanel = renderOperationalBasePanel;
})();

