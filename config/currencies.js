const currencies = [
  {
    code: "VES",
    name: "Venezuela",
    flag: "VE",
    active: true,
    order: 1,
    supportsBuy: true,
    supportsSell: true,
  },
  {
    code: "ARS",
    name: "Argentina",
    flag: "AR",
    active: true,
    order: 2,
    supportsBuy: true,
    supportsSell: true,
  },
  {
    code: "COP",
    name: "Colombia",
    flag: "CO",
    active: true,
    order: 3,
    supportsBuy: true,
    supportsSell: true,
  },
  {
    code: "PEN",
    name: "Perú",
    flag: "PE",
    active: true,
    order: 4,
    supportsBuy: true,
    supportsSell: true,
  },
  {
    code: "CLP",
    name: "Chile",
    flag: "CL",
    active: true,
    order: 5,
    supportsBuy: true,
    supportsSell: true,
  },
  {
    code: "MXN",
    name: "México",
    flag: "MX",
    active: true,
    order: 6,
    supportsBuy: true,
    supportsSell: true,
  },
  {
    code: "BRL",
    name: "Brasil",
    flag: "BR",
    active: true,
    order: 7,
    supportsBuy: true,
    supportsSell: true,
  },
];

function getActiveCurrencies() {
  return currencies
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order);
}

function getActiveCurrencyCodes() {
  return getActiveCurrencies().map((c) => c.code);
}

function isSupportedCurrency(code) {
  return getActiveCurrencyCodes().includes(String(code || "").toUpperCase());
}

function getCurrencyByCode(code) {
  const target = String(code || "").toUpperCase();
  return currencies.find((c) => c.code === target) || null;
}

module.exports = {
  currencies,
  getActiveCurrencies,
  getActiveCurrencyCodes,
  isSupportedCurrency,
  getCurrencyByCode,
};