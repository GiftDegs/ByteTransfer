(() => {
  const escapeHtml = window.escapeHtml;
  const dhemkaState = window.dhemkaState;

  function getMonitoring() {
    return window.coreMonitoring || null;
  }
  
  function getMonitoringStatusStyles(status) {
    if (status === "active" || status === "healthy" || status === "optimized" || status === "controlled") {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    }
  
    if (status === "planned" || status === "watch") {
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
    }
  
    if (status === "critical") {
      return "border-rose-400/20 bg-rose-400/10 text-rose-200";
    }
  
    return "border-white/10 bg-black/20 text-slate-300";
  }
  
  function renderMonitoringStatusPill(status) {
    return `
      <span class="rounded-full border ${getMonitoringStatusStyles(status)} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
        ${escapeHtml(status)}
      </span>
    `;
  }
  
  function renderMonitoringWorkerRows(workers = []) {
    if (!workers.length) {
      return `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
          No workers configured.
        </div>
      `;
    }
  
    return workers
      .map((worker) => `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-bold text-slate-200">
                ${escapeHtml(worker.name)}
              </p>
  
              <p class="mt-1 text-xs leading-relaxed text-slate-500">
                ${escapeHtml(worker.role)}
              </p>
            </div>
  
            ${renderMonitoringStatusPill(worker.status)}
          </div>
        </div>
      `)
      .join("");
  }
  
  function renderMonitoringHealthRows(healthItems = []) {
    if (!healthItems.length) {
      return `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
          No health checks configured.
        </div>
      `;
    }
  
    return healthItems
      .map((item) => `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-bold text-slate-200">
                ${escapeHtml(item.label)}
              </p>
  
              <p class="mt-1 text-xs leading-relaxed text-slate-500">
                ${escapeHtml(item.detail)}
              </p>
            </div>
  
            ${renderMonitoringStatusPill(item.status)}
          </div>
        </div>
      `)
      .join("");
  }
  
  function getAlertSeverityStyles(severity) {
    if (severity === "critical") {
      return "border-rose-400/20 bg-rose-400/10 text-rose-200";
    }
  
    if (severity === "watch") {
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    }
  
    if (severity === "planned") {
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
    }
  
    return "border-white/10 bg-black/20 text-slate-300";
  }
  
  function renderMonitoringAlertRows(alerts = []) {
    if (!alerts.length) {
      return `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
          No global alerts configured.
        </div>
      `;
    }
  
    return alerts
      .map((alert) => `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-bold text-slate-200">
                ${escapeHtml(alert.label)}
              </p>
  
              <p class="mt-1 text-xs leading-relaxed text-slate-500">
                ${escapeHtml(alert.description)}
              </p>
            </div>
  
            <span class="rounded-full border ${getAlertSeverityStyles(alert.severity)} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
              ${escapeHtml(alert.severity)}
            </span>
          </div>
        </div>
      `)
      .join("");
  }
  
  function renderMonitoringPanel() {
    const container = document.getElementById("monitoring-panel");
    if (!container) return;
  
    const monitoring = getMonitoring();
  
    if (dhemkaState.activeSection !== "monitoring" || !monitoring) {
      container.classList.add("hidden");
      container.innerHTML = "";
      return;
    }
  
    container.classList.remove("hidden");
  
    container.innerHTML = `
      <div class="flex items-start justify-between gap-6">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
            Core Monitoring Layer
          </p>
  
          <h3 class="mt-2 text-3xl font-black">
            Runtime & Worker Health
          </h3>
  
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
            ${escapeHtml(monitoring.description)}
          </p>
        </div>
  
        <div class="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-right">
          <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Owner
          </p>
  
          <p class="mt-1 text-sm font-black text-cyan-200">
            ${escapeHtml(monitoring.owner)}
          </p>
        </div>
      </div>
  
      <div class="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
        <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Polling
          </p>
  
          <h4 class="mt-3 text-2xl font-black">
            ${escapeHtml(monitoring.polling.label)}
          </h4>
  
          <p class="mt-3 text-sm leading-relaxed text-slate-400">
            ${escapeHtml(monitoring.polling.description)}
          </p>
  
          <div class="mt-5 grid gap-3 text-sm">
            <div class="flex items-center justify-between gap-4">
              <span class="text-slate-500">Interval</span>
              <span class="font-bold text-slate-200">${escapeHtml(monitoring.polling.interval)}</span>
            </div>
  
            <div class="flex items-center justify-between gap-4">
              <span class="text-slate-500">Owner</span>
              <span class="font-bold text-slate-200">${escapeHtml(monitoring.polling.owner)}</span>
            </div>
  
            <div class="flex items-center justify-between gap-4">
              <span class="text-slate-500">Status</span>
              ${renderMonitoringStatusPill(monitoring.polling.status)}
            </div>
          </div>
        </div>
  
        <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Workers
          </p>
  
          <div class="mt-5 grid gap-3">
            ${renderMonitoringWorkerRows(monitoring.workers)}
          </div>
        </div>
      </div>
  
      <div class="mt-6 grid gap-6 xl:grid-cols-2">
        <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Runtime Health
          </p>
  
          <div class="mt-5 grid gap-3">
            ${renderMonitoringHealthRows(monitoring.health)}
          </div>
        </div>
  
        <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
          <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Global Alerts
          </p>
  
          <div class="mt-5 grid gap-3">
            ${renderMonitoringAlertRows(monitoring.alerts)}
          </div>
        </div>
      </div>
    `;
  }

  window.getMonitoring = getMonitoring;
  window.getMonitoringStatusStyles = getMonitoringStatusStyles;
  window.renderMonitoringStatusPill = renderMonitoringStatusPill;
  window.renderMonitoringWorkerRows = renderMonitoringWorkerRows;
  window.renderMonitoringHealthRows = renderMonitoringHealthRows;
  window.getAlertSeverityStyles = getAlertSeverityStyles;
  window.renderMonitoringAlertRows = renderMonitoringAlertRows;
  window.renderMonitoringPanel = renderMonitoringPanel;
})();

