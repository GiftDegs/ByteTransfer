// public/src/core/quoteModes.js

export const QUOTE_MODULES = {
  REFERENCES: "references",
  RATE: "rate",
  REMITTANCE: "remittance",
};

export const REFERENCE_TYPES = {
  BCV_USD: "bcv_usd",
  BCV_EUR: "bcv_eur",
};

export const REMITTANCE_MODES = {
  SEND_AMOUNT: "send_amount",
  RECEIVE_AMOUNT: "receive_amount",
  RECEIVE_BCV_USD: "receive_bcv_usd",
};

export const BCV_REFERENCE_TYPES = {
  USD: "usd",
  EUR: "eur",
  CUSTOM: "custom",
};

export function getMainModules() {
  return [
    {
      id: QUOTE_MODULES.REFERENCES,
      title: "Referencias",
      description: "Consulta dólar BCV o euro BCV.",
      action: "Consultar referencia",
    },
    {
      id: QUOTE_MODULES.RATE,
      title: "Consultar tasa",
      description: "Consulta la tasa actual entre dos países.",
      action: "Consultar tasa",
    },
    {
      id: QUOTE_MODULES.REMITTANCE,
      title: "Cotizar remesa",
      description: "Calcula cuánto envía o cuánto recibe el cliente.",
      action: "Cotizar remesa",
    },
  ];
}

export function getReferenceOptions() {
  return [
    {
      id: REFERENCE_TYPES.BCV_USD,
      title: "Dólar BCV",
      description: "Referencia oficial en bolívares.",
    },
    {
      id: REFERENCE_TYPES.BCV_EUR,
      title: "Euro BCV",
      description: "Referencia oficial en bolívares.",
    },
  ];
}

export function getRemittanceModeOptions({ origenLabel, destinoLabel, origenCurrency, destinoCurrency, destino }) {
  const options = [
    {
      id: REMITTANCE_MODES.SEND_AMOUNT,
      title: `Calcular cuántos ${destinoCurrency} recibe`,
      description: `El cliente sabe cuántos ${origenCurrency} quiere enviar.`,
    },
    {
      id: REMITTANCE_MODES.RECEIVE_AMOUNT,
      title: `Calcular cuántos ${origenCurrency} debe enviar`,
      description: `El cliente sabe cuántos ${destinoCurrency} quiere recibir.`,
    },
  ];

  if (destino === "VES") {
    options.push({
      id: REMITTANCE_MODES.RECEIVE_BCV_USD,
      title: "Calcular dólares a BCV",
      description: "El cliente quiere recibir un equivalente en dólares en Venezuela.",
    });
  }

  return options.map((option) => ({
    ...option,
    routeLabel: `${origenLabel} → ${destinoLabel}`,
  }));
}

export function getBcvReferenceOptions() {
  return [
    {
      id: BCV_REFERENCE_TYPES.USD,
      title: "Dólar BCV",
      description: "Usar referencia BCV del dólar.",
    },
    {
      id: BCV_REFERENCE_TYPES.EUR,
      title: "Euro BCV",
      description: "Usar referencia BCV del euro.",
    },
    {
      id: BCV_REFERENCE_TYPES.CUSTOM,
      title: "Precio personalizado",
      description: "Ingresar una referencia manual para esta cotización.",
    },
  ];
}