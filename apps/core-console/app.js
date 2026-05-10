const dhemkaState = {
  activeSection: "dashboard",
  activeTenantId: "bytetransfer",
};

function setActiveSidebarItem(section) {
  document.querySelectorAll("[data-section]").forEach((button) => {
    const isActive = button.dataset.section === section;
    button.classList.toggle("active", isActive);
  });
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
  renderSectionCards(section.cards || []);
}

function renderSectionCards(cards = []) {
  const container = document.getElementById("section-cards");
  if (!container) return;

  container.innerHTML = cards
    .map((card) => `
      <div class="core-card glass rounded-3xl p-6">
        <p class="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
          ${card.eyebrow}
        </p>

        <h3 class="mt-4 text-3xl font-black">
          ${card.title}
        </h3>

        <p class="mt-3 text-sm leading-relaxed text-slate-400">
          ${card.description}
        </p>
      </div>
    `)
    .join("");
}

function getActiveTenant() {
  return (window.coreTenants || []).find((tenant) => tenant.id === dhemkaState.activeTenantId) || null;
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

  const dotClass = tenant.status === "operational" ? "bg-emerald-400" : "bg-amber-400";

  container.innerHTML = `
    <div class="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300/70">
            ${tenant.product}
          </p>

          <h2 class="mt-2 text-2xl font-black">
            ${tenant.name}
          </h2>
        </div>

        <div class="status-dot h-3 w-3 rounded-full ${dotClass}"></div>
      </div>

      <p class="mt-3 text-sm text-slate-300">
        ${tenant.description}
      </p>
    </div>
  `;
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

document.addEventListener("DOMContentLoaded", () => {
  renderActiveTenantCard();
  bindSidebarNavigation();

  setActiveSidebarItem(dhemkaState.activeSection);
  renderSectionContent();
});