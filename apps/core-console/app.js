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