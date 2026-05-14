(() => {
  const dhemkaState = window.dhemkaState;
  const escapeHtml = window.escapeHtml;

  const STEPS = [
    {
      id: "currencies",
      number: "01",
      label: "Currencies",
      title: "Where does this tenant receive and deliver?",
      short: "Received / delivered currencies",
    },
    {
      id: "crosses",
      number: "02",
      label: "Crosses",
      title: "Which routes should be active?",
      short: "Suggested and advanced crosses",
    },
    {
      id: "rate-definition",
      number: "03",
      label: "Rate Method",
      title: "How does this tenant define rates?",
      short: "Source or guided behavior",
    },
    {
      id: "market-amount",
      number: "04",
      label: "Amount",
      title: "What amount does the tenant use to consult the market?",
      short: "Pricing amount band",
    },
    {
      id: "methods",
      number: "05",
      label: "Methods",
      title: "Which banks or methods are considered?",
      short: "Compatible methods",
    },
    {
      id: "reference",
      number: "06",
      label: "Reference",
      title: "Which filtered reference would this tenant use as base?",
      short: "Selected reference behavior",
    },
    {
      id: "result",
      number: "07",
      label: "Result",
      title: "Base profile summary",
      short: "Tenant Base Reference mock",
    },
  ];

  const MOCK_PROFILE = {
    receivedCurrencies: ["ARS"],
    deliveredCurrencies: ["VES"],
    suggestedCrosses: ["ARS → VES"],
    advancedCrosses: ["VES → ARS", "ARS → COP", "COP → VES"],
    rateDefinitionMode: "Binance P2P",
    amountBand: "200–500 USDT",
    methods: ["Banesco", "Banco de Venezuela", "Pago móvil"],
    selectedReferenceBehavior: "Best compatible reference with preferred method",
    inferredProfile: "Operational control / balanced",
    source: "Binance P2P",
    baseValue: "658.90 VES",
    benchmarkValue: "660.20 VES",
    gap: "-0.20%",
  };

  const FILTERED_REFERENCES = [
    {
      price: "660.20",
      method: "Banco de Venezuela",
      note: "Best visible price inside filters",
      behavior: "Aggressive / best visible",
    },
    {
      price: "659.80",
      method: "Banco de Venezuela",
      note: "Strong reference with safer merchant behavior",
      behavior: "Balanced competitive",
    },
    {
      price: "658.90",
      method: "Banesco",
      note: "Best reference compatible with preferred method",
      behavior: "Operational control",
      selected: true,
    },
    {
      price: "657.70",
      method: "Pago móvil",
      note: "More flexible method, weaker reference",
      behavior: "Flexible but lower-paying",
    },
    {
      price: "656.50",
      method: "Banesco",
      note: "More defensive reference",
      behavior: "Conservative",
    },
  ];

  function getActiveStepId() {
    return dhemkaState.activePricingCapacityStep || "currencies";
  }

  function getActiveStepIndex() {
    return Math.max(0, STEPS.findIndex((step) => step.id === getActiveStepId()));
  }

  function getActiveStep() {
    return STEPS[getActiveStepIndex()] || STEPS[0];
  }

  function setActiveStep(stepId) {
    if (!STEPS.some((step) => step.id === stepId)) return;

    dhemkaState.activePricingCapacityStep = stepId;
    renderPricingCapacityPanel();
  }

  function renderPill(label, tone = "neutral") {
    const tones = {
      active: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100",
      warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      neutral: "border-white/10 bg-black/20 text-slate-300",
    };

    return `
      <span class="inline-flex rounded-full border ${tones[tone] || tones.neutral} px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]">
        ${escapeHtml(label)}
      </span>
    `;
  }

  function renderStepButton(step, index) {
    const activeIndex = getActiveStepIndex();
    const isActive = step.id === getActiveStepId();
    const isDone = index < activeIndex;

    const classes = isActive
      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
      : isDone
        ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-200"
        : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20 hover:text-slate-200";

    return `
      <button
        type="button"
        data-pricing-capacity-step="${escapeHtml(step.id)}"
        class="w-full rounded-2xl border ${classes} p-4 text-left transition"
      >
        <div class="flex items-start gap-3">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25 text-[10px] font-black">
            ${escapeHtml(step.number)}
          </span>

          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em]">
              ${escapeHtml(step.label)}
            </p>

            <p class="mt-1 text-xs leading-relaxed text-slate-500">
              ${escapeHtml(step.short)}
            </p>
          </div>
        </div>
      </button>
    `;
  }

  function renderStepper() {
    return `
      <aside class="rounded-[2rem] border border-white/10 bg-black/20 p-5">
        <p class="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
          Wizard
        </p>

        <h3 class="mt-2 text-xl font-black text-slate-50">
          Pricing Capacity V1
        </h3>

        <p class="mt-2 text-sm leading-relaxed text-slate-500">
          Captures how the tenant defines its no-profit base. Margin stays outside this flow.
        </p>

        <div class="mt-5 grid gap-2">
          ${STEPS.map(renderStepButton).join("")}
        </div>
      </aside>
    `;
  }

  function renderSummaryRail() {
    return `
      <aside class="rounded-[2rem] border border-white/10 bg-black/25 p-5">
        <p class="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
          What Core understands
        </p>

        <h3 class="mt-2 text-xl font-black text-slate-50">
          Tenant base profile
        </h3>

        <div class="mt-5 grid gap-3 text-sm">
          ${renderSummaryRow("Receives", MOCK_PROFILE.receivedCurrencies.join(", "))}
          ${renderSummaryRow("Delivers", MOCK_PROFILE.deliveredCurrencies.join(", "))}
          ${renderSummaryRow("Active route", MOCK_PROFILE.suggestedCrosses.join(", "))}
          ${renderSummaryRow("Rate source", MOCK_PROFILE.rateDefinitionMode)}
          ${renderSummaryRow("Amount band", MOCK_PROFILE.amountBand)}
          ${renderSummaryRow("Methods", MOCK_PROFILE.methods.join(", "))}
          ${renderSummaryRow("Inferred profile", MOCK_PROFILE.inferredProfile)}
        </div>

        <div class="mt-5 rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-4">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            Rule
          </p>

          <p class="mt-2 text-xs leading-relaxed text-slate-400">
            This flow does not set tenant margin. It only helps Core calculate a more realistic base reference.
          </p>
        </div>
      </aside>
    `;
  }

  function renderSummaryRow(label, value) {
    return `
      <div class="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          ${escapeHtml(label)}
        </p>

        <p class="mt-1 font-bold text-slate-200">
          ${escapeHtml(value)}
        </p>
      </div>
    `;
  }

  function renderOption(label, description, selected = false) {
    const classes = selected
      ? "border-cyan-400/30 bg-cyan-400/10"
      : "border-white/10 bg-black/20";

    return `
      <div class="rounded-2xl border ${classes} p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-black text-slate-100">
              ${escapeHtml(label)}
            </p>

            <p class="mt-1 text-xs leading-relaxed text-slate-500">
              ${escapeHtml(description)}
            </p>
          </div>

          ${selected ? renderPill("Mock selected", "active") : ""}
        </div>
      </div>
    `;
  }

  function renderStepContent() {
    const step = getActiveStep();

    const contentByStep = {
      currencies: renderCurrenciesStep,
      crosses: renderCrossesStep,
      "rate-definition": renderRateDefinitionStep,
      "market-amount": renderMarketAmountStep,
      methods: renderMethodsStep,
      reference: renderReferenceStep,
      result: renderResultStep,
    };

    const renderer = contentByStep[step.id] || renderCurrenciesStep;

    return `
      <section class="rounded-[2rem] border border-white/10 bg-black/20 p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
              Step ${escapeHtml(step.number)}
            </p>

            <h3 class="mt-2 text-2xl font-black text-slate-50">
              ${escapeHtml(step.title)}
            </h3>
          </div>

          ${renderPill("Mock onboarding", "active")}
        </div>

        <div class="mt-6">
          ${renderer()}
        </div>

        ${renderStepActions()}
      </section>
    `;
  }

  function renderCurrenciesStep() {
    return `
      <div class="grid gap-4 lg:grid-cols-2">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Receives from clients
          </p>

          <div class="mt-3 grid gap-3">
            ${renderOption("ARS", "Argentina peso received from clients.", true)}
            ${renderOption("COP", "Optional received currency for future tenant setup.")}
            ${renderOption("CLP", "Optional received currency for future tenant setup.")}
          </div>
        </div>

        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Delivers to clients
          </p>

          <div class="mt-3 grid gap-3">
            ${renderOption("VES", "Venezuela bolivar delivered to beneficiaries.", true)}
            ${renderOption("PEN", "Optional delivered currency for future tenant setup.")}
            ${renderOption("MXN", "Optional delivered currency for future tenant setup.")}
          </div>
        </div>
      </div>
    `;
  }

  function renderCrossesStep() {
    return `
      <div class="grid gap-5">
        <div class="rounded-3xl border border-emerald-400/10 bg-emerald-400/5 p-5">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
            Suggested from selected currencies
          </p>

          <div class="mt-4 grid gap-3">
            ${renderOption("ARS → VES", "Suggested because the tenant receives ARS and delivers VES.", true)}
          </div>
        </div>

        <div class="rounded-3xl border border-amber-400/10 bg-amber-400/5 p-5">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
            Other / advanced crosses
          </p>

          <p class="mt-2 text-sm leading-relaxed text-slate-400">
            Activate only routes the tenant actually operates. If a route does not represent the business, Core may calculate a base that does not fit reality.
          </p>

          <div class="mt-4 grid gap-3 lg:grid-cols-3">
            ${MOCK_PROFILE.advancedCrosses.map((cross) => renderOption(cross, "Available in catalog, not selected in this mock.")).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function renderRateDefinitionStep() {
    return `
      <div class="grid gap-3">
        ${renderOption("I calculate rates using Binance P2P", "Core will ask amount band and methods/banks to reproduce the tenant's market filter.", true)}
        ${renderOption("I copy another remesero or market rate", "Core should guide with benchmark behavior and avoid detailed filters.")}
        ${renderOption("I calculate rates using Bybit or another source", "Future tenant-grade source selection.")}
        ${renderOption("Other / manual", "Core can compare manual rates against benchmark, without replacing tenant judgment.")}
        ${renderOption("I do not know yet", "Core can start with guided benchmark behavior.")}
      </div>
    `;
  }

  function renderMarketAmountStep() {
    return `
      <div class="grid gap-4">
        <p class="text-sm leading-relaxed text-slate-400">
          This is not the tenant's current balance. It is the amount normally used to check the market and define the base.
        </p>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          ${renderOption("50–100 USDT", "Small-ticket pricing reference.")}
          ${renderOption("100–200 USDT", "Early operator or cautious reference.")}
          ${renderOption("200–500 USDT", "Mock selected amount band.", true)}
          ${renderOption("500–1,000 USDT", "Larger pricing reference.")}
          ${renderOption("1,000+ USDT", "High-capacity market reference.")}
          ${renderOption("Custom", "Future custom band.")}
        </div>
      </div>
    `;
  }

  function renderMethodsStep() {
    return `
      <div class="grid gap-4">
        <p class="text-sm leading-relaxed text-slate-400">
          Core uses selected methods to filter market references. More methods do not guarantee a better base; they help Core represent how the tenant actually looks at the market.
        </p>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          ${renderOption("Banesco", "Selected because it represents tenant operation.", true)}
          ${renderOption("Banco de Venezuela", "Selected because it is often competitive.", true)}
          ${renderOption("Pago móvil", "Selected but may produce weaker references.", true)}
          ${renderOption("Mercantil", "Not selected in this mock.")}
          ${renderOption("Provincial", "Not selected in this mock.")}
          ${renderOption("Other", "Future method catalog.")}
        </div>
      </div>
    `;
  }

  function renderReferenceStep() {
    return `
      <div class="grid gap-5">
        <div class="rounded-3xl border border-white/10 bg-black/25 p-5">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Filtered example
          </p>

          <p class="mt-2 text-sm leading-relaxed text-slate-400">
            Source: ${escapeHtml(MOCK_PROFILE.source)} · Amount: ${escapeHtml(MOCK_PROFILE.amountBand)} · Methods: ${escapeHtml(MOCK_PROFILE.methods.join(", "))}
          </p>

          <div class="mt-4 grid gap-3">
            ${FILTERED_REFERENCES.map(renderReferenceRow).join("")}
          </div>
        </div>

        <div class="rounded-3xl border border-cyan-400/10 bg-cyan-400/5 p-5">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
            Question Core asks
          </p>

          <h4 class="mt-2 text-xl font-black text-slate-50">
            Which reference would this tenant normally use as base before margin?
          </h4>

          <p class="mt-2 text-sm leading-relaxed text-slate-400">
            Core infers the strategy profile from this choice. It does not ask abstract aggressiveness.
          </p>
        </div>
      </div>
    `;
  }

  function renderReferenceRow(reference) {
    const classes = reference.selected
      ? "border-cyan-400/30 bg-cyan-400/10"
      : "border-white/10 bg-black/20";

    return `
      <div class="rounded-2xl border ${classes} p-4">
        <div class="grid gap-3 lg:grid-cols-[120px_1fr_220px] lg:items-center">
          <p class="text-2xl font-black text-slate-50">
            ${escapeHtml(reference.price)}
          </p>

          <div>
            <p class="text-sm font-black text-slate-100">
              ${escapeHtml(reference.method)}
            </p>

            <p class="mt-1 text-xs leading-relaxed text-slate-500">
              ${escapeHtml(reference.note)}
            </p>
          </div>

          <div class="flex justify-start lg:justify-end">
            ${renderPill(reference.selected ? "Chosen base" : reference.behavior, reference.selected ? "active" : "neutral")}
          </div>
        </div>
      </div>
    `;
  }

  function renderResultStep() {
    return `
      <div class="grid gap-5">
        <div class="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
            Tenant Base Reference
          </p>

          <div class="mt-4 grid gap-4 md:grid-cols-3">
            ${renderResultMetric("Suggested base", MOCK_PROFILE.baseValue)}
            ${renderResultMetric("Core benchmark", MOCK_PROFILE.benchmarkValue)}
            ${renderResultMetric("Gap", MOCK_PROFILE.gap)}
          </div>
        </div>

        <div class="rounded-3xl border border-white/10 bg-black/25 p-5">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            Reading
          </p>

          <p class="mt-3 text-sm leading-relaxed text-slate-400">
            This mock tenant uses Binance P2P, checks the 200–500 USDT band and considers Banesco, Banco de Venezuela and Pago móvil. Core infers an operational-control profile because the chosen base favors a compatible method instead of blindly taking the best visible price.
          </p>

          <p class="mt-3 text-sm leading-relaxed text-slate-400">
            Margin is not configured here. Tenant commercial margin, rounding and daily strategy belong to the margin panel.
          </p>
        </div>
      </div>
    `;
  }

  function renderResultMetric(label, value) {
    return `
      <div class="rounded-2xl border border-white/10 bg-black/25 p-4">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          ${escapeHtml(label)}
        </p>

        <p class="mt-2 text-2xl font-black text-slate-50">
          ${escapeHtml(value)}
        </p>
      </div>
    `;
  }

  function renderStepActions() {
    const activeIndex = getActiveStepIndex();
    const previous = STEPS[activeIndex - 1];
    const next = STEPS[activeIndex + 1];

    return `
      <div class="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          data-pricing-capacity-step="${escapeHtml(previous?.id || STEPS[0].id)}"
          class="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-300 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-30"
          ${previous ? "" : "disabled"}
        >
          Previous
        </button>

        <button
          type="button"
          data-pricing-capacity-step="${escapeHtml(next?.id || "result")}"
          class="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 transition hover:border-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-30"
          ${next ? "" : "disabled"}
        >
          Next
        </button>
      </div>
    `;
  }

  function bindPricingCapacityEvents(container) {
    container.querySelectorAll("[data-pricing-capacity-step]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;
        setActiveStep(button.dataset.pricingCapacityStep);
      });
    });
  }

  function renderPricingCapacityPanel() {
    const container = document.getElementById("pricing-capacity-panel");
    if (!container) return;

    container.innerHTML = `
      <div class="grid gap-6">
        <section class="rounded-[2rem] border border-white/10 bg-black/20 p-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
                Remit / Tenant Setup Mock
              </p>

              <h2 class="mt-3 text-3xl font-black text-slate-50">
                Configure how this tenant defines base rates
              </h2>

              <p class="mt-3 max-w-4xl text-sm leading-relaxed text-slate-400">
                Mock wizard for Pricing Capacity Onboarding V1. It is shown at Remit level only for prototype clarity. In the real product, this setup belongs inside each tenant: Remit -> Tenant -> Tenant Setup -> Pricing Capacity.
              </p>
            </div>

            <div class="rounded-3xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-right">
              <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                Final placement
              </p>

              <p class="mt-1 text-sm font-black text-amber-200">
                Inside each tenant
              </p>

              <p class="mt-2 max-w-xs text-xs leading-relaxed text-amber-100/70">
                Prototype location only. Real path: Remit -> Tenant -> Tenant Setup.
              </p>
            </div>
          </div>
        </section>

        <div class="grid gap-6 xl:grid-cols-[0.75fr_1.2fr_0.85fr]">
          ${renderStepper()}
          ${renderStepContent()}
          ${renderSummaryRail()}
        </div>
      </div>
    `;

    bindPricingCapacityEvents(container);
  }

  window.PRICING_CAPACITY_STEPS = STEPS;
  window.renderPricingCapacityPanel = renderPricingCapacityPanel;

  document.addEventListener("DOMContentLoaded", renderPricingCapacityPanel);
})();
