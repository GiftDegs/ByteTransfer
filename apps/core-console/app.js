const dhemkaState = {
  activeSection: "dashboard",
  activeTenant: {
    product: "Remit",
    name: "ByteTransfer",
    status: "operational",
    description: "First operational tenant running inside the Remit infrastructure.",
  },
};

function setActiveSidebarItem(section) {
  document.querySelectorAll("[data-section]").forEach((button) => {
    const isActive = button.dataset.section === section;
    button.classList.toggle("active", isActive);
  });
}

function bindSidebarNavigation() {
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => {
      dhemkaState.activeSection = button.dataset.section;
      setActiveSidebarItem(dhemkaState.activeSection);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindSidebarNavigation();
  setActiveSidebarItem(dhemkaState.activeSection);
});