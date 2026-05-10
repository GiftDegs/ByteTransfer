const dhemkaState = {
  activeSection: "dashboard",

  activeTenant: {
    product: "Remit",
    name: "ByteTransfer",
    status: "operational",
  },
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
  bindSidebarNavigation();

  setActiveSidebarItem(dhemkaState.activeSection);
  renderSectionContent();
});