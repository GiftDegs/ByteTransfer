(() => {
  const dhemkaState = window.dhemkaState;
  const escapeHtml = window.escapeHtml;

  const CORE_PLATFORM_VIEWS = [
    { id: "overview", label: "Overview", description: "Hierarchy" },
    { id: "market-engine", label: "Market Engine", description: "Pricing core" },
    { id: "sources", label: "Sources", description: "Source network" },
    { id: "cross-engine", label: "Cross Engine", description: "Routes" },
    { id: "opportunities", label: "Opportunities", description: "Signals" },
    { id: "runtime", label: "Runtime", description: "Workers" },
    { id: "health", label: "Health", description: "Diagnostics" },
    { id: "audit", label: "Audit", description: "Trace" },
  ];

  const CORE_PLATFORM_LAYERS = [
    {
      id: "market-intake",
      order: "01",
      label: "Market Intake",
      child: "Sources",
      role: "Input layer",
      summary: "Sources that Core can inspect before anything becomes operational.",
      inspectorTitle: "Market Intake / Sources",
      inspectorIntro:
        "This layer receives market data. It does not decide the final tenant price. It only brings raw material into Core.",
      responsibilities: [
        "Official references: BCV, PTAX and future official sources.",
        "P2P references: Binance primary for Remit, Bybit complementary when allowed.",
        "Exchange references: KuCoin, OKX and similar sources as Core Intelligence by default.",
        "Manual/internal references when Core needs controlled override paths.",
      ],
      visibleByDefault: "Layer name and purpose only.",
      hiddenUntilSelected: "Provider policy, source roles, confidence impact and tenant visibility.",
    },
    {
      id: "market-processing",
      order: "02",
      label: "Market Processing",
      child: "Normalization + Confidence",
      role: "Quality layer",
      summary: "Turns raw provider data into usable and scored market intelligence.",
      inspectorTitle: "Market Processing / Normalization + Confidence",
      inspectorIntro:
        "This layer cleans incompatible source data and decides whether a reference is reliable enough to influence operational pricing.",
      responsibilities: [
        "Normalize different provider formats into one internal market quote contract.",
        "Aggregate usable samples without exposing raw provider noise.",
        "Score confidence using freshness, liquidity, spread, fallback usage and warnings.",
        "Activate fallback rules without hiding that the reference is degraded.",
      ],
      visibleByDefault: "Processing exists between sources and calculation.",
      hiddenUntilSelected: "Aggregation rules, stale logic, fallback reasons and confidence scoring.",
    },
    {
      id: "market-calculation",
      order: "03",
      label: "Market Calculation",
      child: "Cross Engine",
      role: "Route layer",
      summary: "Transforms references into route and cross intelligence.",
      inspectorTitle: "Market Calculation / Cross Engine",
      inspectorIntro:
        "This layer calculates route intelligence. A route being mathematically possible does not mean it is available or enabled for a tenant.",
      responsibilities: [
        "Calculate possible routes and crosses from trusted market references.",
        "Separate possible, available, active, blocked and tenant-enabled routes.",
        "Keep Core route knowledge broader than any single tenant configuration.",
        "Prevent blocked or low-confidence routes from becoming operational by accident.",
      ],
      visibleByDefault: "Route calculation belongs after confidence.",
      hiddenUntilSelected: "Route states, tenant-enabled status, blocked routes and future route catalog.",
    },
    {
      id: "market-output",
      order: "04",
      label: "Market Output",
      child: "Tenant Feed",
      role: "Distribution layer",
      summary: "Clean tenant-ready output built from approved Core intelligence.",
      inspectorTitle: "Market Output / Tenant Feed",
      inspectorIntro:
        "This is the operational output tenants receive. It is intentionally cleaner and smaller than the full Core Intelligence Universe.",
      responsibilities: [
        "Expose only Core-approved pricing sources to each tenant.",
        "Respect tenant modules, enabled routes, permissions and commercial configuration.",
        "Separate tenant-visible warnings from Core-only warnings.",
        "Avoid showing every exchange or inspected source to tenant users.",
      ],
      visibleByDefault: "Tenant Feed is the clean output.",
      hiddenUntilSelected: "Tenant-specific feed rules, source filtering and warning visibility.",
    },
    {
      id: "intelligence-signals",
      order: "05",
      label: "Intelligence Signals",
      child: "Opportunities",
      role: "Review layer",
      summary: "Signals that suggest review without executing operations.",
      inspectorTitle: "Intelligence Signals / Opportunities",
      inspectorIntro:
        "This layer can inspect more sources than the tenant feed, but it must only suggest review. It does not execute operations.",
      responsibilities: [
        "Start with Taker Opportunity Scanner.",
        "Compare Binance, Bybit, KuCoin, OKX and future sources when useful.",
        "Suggest source review, spread review or route risk review.",
        "Keep maker strategy and maker arbitrage as future modules.",
      ],
      visibleByDefault: "Review-only signal layer.",
      hiddenUntilSelected: "Compared sources, signal severity, source recommendations and future opportunity modes.",
    },
    {
      id: "system-support",
      order: "06",
      label: "System Support",
      child: "Runtime + Health + Audit",
      role: "Support layer",
      summary: "Keeps the engine alive, monitored and traceable.",
      inspectorTitle: "System Support / Runtime + Health + Audit",
      inspectorIntro:
        "This layer supports the engine. It is required, but it should not visually compete with the Core Market Engine.",
      responsibilities: [
        "Runtime workers refresh sources, snapshots, opportunities and tenant feeds.",
        "Health checks watch stale data, source degradation, fallbacks and confidence risk.",
        "Audit records sensitive changes, manual references, fallback activation and Core access.",
        "Rate limits, cache policies and future queues protect provider stability.",
      ],
      visibleByDefault: "Support exists, but stays secondary.",
      hiddenUntilSelected: "Worker list, cron schedules, cache policy, health checks and audit events.",
    },
  ];

  function getActiveView() {
    return dhemkaState.activeCorePlatformView || "overview";
  }

  function getActiveLayerId() {
    return dhemkaState.activeCorePlatformLayer || null;
  }

  function getActiveLayer() {
    const activeLayerId = getActiveLayerId();
    if (!activeLayerId) return null;

    return CORE_PLATFORM_LAYERS.find((layer) => layer.id === activeLayerId) || null;
  }

  function renderPill(label, tone = "neutral") {
    const tones = {
      healthy: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      planned: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
      neutral: "border-white/10 bg-black/20 text-slate-300",
    };

    return `
      <span class="inline-flex rounded-full border ${tones[tone] || tones.neutral} px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]">
        ${escapeHtml(label)}
      </span>
    `;
  }

  function renderSubnav() {
    const activeView = getActiveView();

    return `
      <div class="flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-black/20 p-2">
        ${CORE_PLATFORM_VIEWS.map((view) => {
          const isActive = view.id === activeView;
          const classes = isActive
            ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
            : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20 hover:text-slate-200";

          return `
            <button
              type="button"
              data-core-platform-view="${escapeHtml(view.id)}"
              class="rounded-2xl border ${classes} px-4 py-3 text-left transition"
            >
              <span class="block text-xs font-black uppercase tracking-[0.18em]">
                ${escapeHtml(view.label)}
              </span>
              <span class="mt-1 block text-[11px] text-slate-500">
                ${escapeHtml(view.description)}
              </span>
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderEngineStatus() {
    return `
      <section class="rounded-[2rem] border border-cyan-400/15 bg-black/20 p-6">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.26em] text-cyan-200">
              Core Market Engine
            </p>

            <h3 class="mt-3 text-3xl font-black text-slate-50">
              Central market engine and pricing authority
            </h3>

            <p class="mt-3 max-w-4xl text-sm leading-relaxed text-slate-400">
              Core observes market sources, processes trust, calculates route intelligence and distributes clean tenant-ready pricing. Internal layers stay closed until inspected.
            </p>
          </div>

          <div class="grid min-w-[280px] gap-3 rounded-3xl border border-white/10 bg-black/25 p-4 text-sm">
            <div class="flex items-center justify-between gap-4">
              <span class="text-slate-500">Status</span>
              ${renderPill("Healthy / Mock", "healthy")}
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-slate-500">Feeds</span>
              <span class="font-bold text-slate-200">Remit + future modules</span>
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-slate-500">Output</span>
              <span class="font-bold text-cyan-100">Clean Tenant Feed</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderLayerRow(layer) {
    const isActive = layer.id === getActiveLayerId();
    const classes = isActive
      ? "border-cyan-400/30 bg-cyan-400/10"
      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.03]";

    return `
      <button
        type="button"
        data-core-platform-layer="${escapeHtml(layer.id)}"
        class="w-full rounded-3xl border ${classes} p-4 text-left transition"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex gap-4">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-xs font-black text-cyan-100">
              ${escapeHtml(layer.order)}
            </div>

            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                ${escapeHtml(layer.role)}
              </p>

              <h4 class="mt-1 text-lg font-black text-slate-50">
                ${escapeHtml(layer.label)}
              </h4>

              <p class="mt-1 text-xs font-bold text-cyan-100">
                ${escapeHtml(layer.child)}
              </p>

              <p class="mt-2 text-sm leading-relaxed text-slate-500">
                ${escapeHtml(layer.summary)}
              </p>
            </div>
          </div>

          <span class="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            ${isActive ? "Selected" : "Inspect"}
          </span>
        </div>
      </button>
    `;
  }

  function renderInspectionList() {
    return `
      <section class="rounded-[2rem] border border-white/10 bg-black/20 p-6">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
              Inspectable Layers
            </p>

            <h3 class="mt-2 text-2xl font-black text-slate-50">
              Closed by default. Details open in the inspector.
            </h3>
          </div>

          ${renderPill("Controlled visibility", "planned")}
        </div>

        <div class="mt-5 grid gap-3">
          ${CORE_PLATFORM_LAYERS.map(renderLayerRow).join("")}
        </div>
      </section>
    `;
  }

  function renderInspector() {
    const layer = getActiveLayer();

    if (!layer) {
      return `
        <aside class="rounded-[2rem] border border-white/10 bg-black/25 p-6">
          <p class="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
            Context Inspector
          </p>

          <h3 class="mt-3 text-2xl font-black text-slate-50">
            Select a layer to inspect it
          </h3>

          <p class="mt-4 text-sm leading-relaxed text-slate-400">
            Core keeps internal details closed by default. Choose a layer from the inspection list to review responsibilities, visibility rules and hidden details.
          </p>

          <div class="mt-6 rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-5">
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              Visibility rule
            </p>

            <p class="mt-2 text-sm leading-relaxed text-slate-400">
              The engine is visible. Layers are listed. Details only appear when intentionally selected.
            </p>
          </div>
        </aside>
      `;
    }

    return `
      <aside class="rounded-[2rem] border border-white/10 bg-black/25 p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
              Context Inspector
            </p>

            <h3 class="mt-3 text-2xl font-black text-slate-50">
              ${escapeHtml(layer.inspectorTitle)}
            </h3>
          </div>

          ${renderPill(layer.role, "neutral")}
        </div>

        <p class="mt-4 text-sm leading-relaxed text-slate-400">
          ${escapeHtml(layer.inspectorIntro)}
        </p>

        <div class="mt-6">
          <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            Responsibilities
          </p>

          <div class="mt-3 grid gap-3">
            ${layer.responsibilities.map((item) => `
              <div class="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs leading-relaxed text-slate-300">
                ${escapeHtml(item)}
              </div>
            `).join("")}
          </div>
        </div>

        <div class="mt-6 grid gap-3">
          <div class="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
              Visible by default
            </p>
            <p class="mt-2 text-xs leading-relaxed text-slate-400">
              ${escapeHtml(layer.visibleByDefault)}
            </p>
          </div>

          <div class="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
              Hidden until selected
            </p>
            <p class="mt-2 text-xs leading-relaxed text-slate-400">
              ${escapeHtml(layer.hiddenUntilSelected)}
            </p>
          </div>
        </div>
      </aside>
    `;
  }

  function renderMinimalSignals() {
    return `
      <section class="rounded-[2rem] border border-white/10 bg-black/20 p-5">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
              Minimal Signals
            </p>

            <p class="mt-2 text-sm leading-relaxed text-slate-400">
              Overview only shows urgent context. Full signals live inside Intelligence Signals.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            ${renderPill("Opportunity review-only", "warning")}
            ${renderPill("Tenant feed controlled", "healthy")}
          </div>
        </div>
      </section>
    `;
  }

  function renderOverview() {
    return `
      <div class="grid gap-6">
        ${renderEngineStatus()}

        <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          ${renderInspectionList()}
          ${renderInspector()}
        </div>

        ${renderMinimalSignals()}
      </div>
    `;
  }

  function renderPlaceholderView(viewId) {
    const view = CORE_PLATFORM_VIEWS.find((item) => item.id === viewId);

    return `
      <section class="rounded-[2rem] border border-white/10 bg-black/20 p-7">
        <p class="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
          Core Platform / ${escapeHtml(view?.label || "View")}
        </p>

        <h3 class="mt-4 text-3xl font-black text-slate-50">
          ${escapeHtml(view?.label || "Core Platform View")}
        </h3>

        <p class="mt-4 max-w-3xl text-sm leading-relaxed text-slate-400">
          This view will be expanded only after hierarchy, visibility and UI pattern are debated.
        </p>
      </section>
    `;
  }

  function renderCorePlatformView() {
    if (getActiveView() === "overview") {
      return renderOverview();
    }

    return renderPlaceholderView(getActiveView());
  }

  function bindCorePlatformPanelEvents(container) {
    container.querySelectorAll("[data-core-platform-view]").forEach((button) => {
      button.addEventListener("click", () => {
        dhemkaState.activeCorePlatformView = button.dataset.corePlatformView || "overview";
        renderCorePlatformPanel();
      });
    });

    container.querySelectorAll("[data-core-platform-layer]").forEach((button) => {
      button.addEventListener("click", () => {
        dhemkaState.activeCorePlatformLayer = button.dataset.corePlatformLayer || "market-intake";
        renderCorePlatformPanel();
      });
    });
  }

  function renderCorePlatformPanel() {
    const container = document.getElementById("core-platform-panel");
    if (!container) return;

    if (dhemkaState.activeSection !== "core-platform") {
      container.classList.add("hidden");
      container.innerHTML = "";
      return;
    }

    container.classList.remove("hidden");

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
                Core Platform
              </p>

              <h2 class="mt-3 text-3xl font-black text-slate-50">
                Market Engine Command Layer
              </h2>

              <p class="mt-3 max-w-4xl text-sm leading-relaxed text-slate-400">
                Ordered overview: one central engine, closed inspection layers and contextual detail on demand.
              </p>
            </div>

            <div class="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-right">
              <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                Mode
              </p>

              <p class="mt-1 text-sm font-black text-cyan-100">
                Ordered Overview / Mock
              </p>
            </div>
          </div>

          ${renderSubnav()}
        </div>

        ${renderCorePlatformView()}
      </div>
    `;

    bindCorePlatformPanelEvents(container);
  }

  window.CORE_PLATFORM_VIEWS = CORE_PLATFORM_VIEWS;
  window.CORE_PLATFORM_LAYERS = CORE_PLATFORM_LAYERS;
  window.renderCorePlatformPanel = renderCorePlatformPanel;
})();
