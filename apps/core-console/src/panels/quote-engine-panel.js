(() => {
  const escapeHtml = window.escapeHtml;
  const dhemkaState = window.dhemkaState;

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

  window.getQuoteEngine = getQuoteEngine;
  window.getQuoteStatusStyles = getQuoteStatusStyles;
  window.renderQuoteStatusPill = renderQuoteStatusPill;
  window.renderQuoteProviderRows = renderQuoteProviderRows;
  window.renderQuoteStrategyRows = renderQuoteStrategyRows;
  window.renderQuoteFallbackRows = renderQuoteFallbackRows;
  window.renderTenantBoundaryRows = renderTenantBoundaryRows;
  window.renderQuoteEnginePanel = renderQuoteEnginePanel;
})();

