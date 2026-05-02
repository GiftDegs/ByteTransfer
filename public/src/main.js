import { enableSharePreviewTools } from "./ui/sharePreview.js";
import { DOM } from "./ui/dom.js";
import { initRipple } from "./ui/ripple.js";
import { renderQuoteScreen } from "./ui/quoteScreens.js";

function iniciarCotizadorPublico() {
  DOM.mainHeader?.classList.add("hidden");

  const app = document.getElementById("app");
  app?.classList.remove("justify-center");
  app?.classList.add("justify-start");

  DOM.step1Origen?.classList.add("hidden");
  DOM.step2Destino?.classList.add("hidden");
  DOM.tasaWrap?.classList.add("hidden");
  DOM.step1?.classList.add("hidden");
  DOM.step2?.classList.add("hidden");
  DOM.resultado?.classList.add("hidden");

  DOM.quoteApp?.classList.remove("hidden");
  renderQuoteScreen(DOM.quoteApp);
}

window.onload = () => {
  initRipple();
  enableSharePreviewTools();
  iniciarCotizadorPublico();
};