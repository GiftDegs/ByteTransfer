import { DOM } from "./ui/dom.js";
import { initRipple } from "./ui/ripple.js";
import { initSharing } from "./ui/sharing.js";
import { wireEvents, mostrarPaso1, getLastCalc, getOpsState } from "./ui/steps.js";

window.onload = () => {
  initRipple();
  initSharing(DOM, getLastCalc, getOpsState);

  // Mostrar header desde el inicio para que el estado abierto/cerrado se vea apenas carga
  DOM.mainHeader.classList.remove("hidden");

  // La tasa todavía no hace falta mostrarla en el arranque
  DOM.tasaWrap.classList.add("hidden");

  DOM.step1.classList.add("hidden");
  DOM.step2.classList.add("hidden");
  DOM.resultado.classList.add("hidden");
  DOM.step2Destino.classList.add("hidden");
  DOM.step1Origen.classList.remove("hidden");

  wireEvents();
  mostrarPaso1();
};
