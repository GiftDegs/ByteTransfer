import { enableSharePreviewTools } from "./ui/sharePreview.js";
import { initRipple } from "./ui/ripple.js";
import { renderQuoteScreen } from "./ui/quoteScreens.js";

function iniciarCotizadorPublico() {
  const app = document.getElementById("app");
  const quoteApp = document.getElementById("quoteApp");

  app?.classList.remove("justify-center");
  app?.classList.add("justify-start");

  quoteApp?.classList.remove("hidden");
  renderQuoteScreen(quoteApp);
}

function shouldEnableSharePreviewTools() {
  const host = window.location.hostname || "";
  const params = new URLSearchParams(window.location.search || "");

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    params.get("sharePreview") === "1"
  );
}

window.onload = () => {
  initRipple();

  if (shouldEnableSharePreviewTools()) {
    enableSharePreviewTools();
  }

  iniciarCotizadorPublico();
};
