const reglasVisualesCruces = {
  "COP-VES": {
    invertForCustomer: true,
  },
};

export function debeInvertirCruce(origen, destino) {
  return !!reglasVisualesCruces?.[`${origen}-${destino}`]?.invertForCustomer;
}

export function obtenerTasaVisible(origen, destino, tasaInterna) {
  const n = Number(tasaInterna);
  if (!Number.isFinite(n) || n <= 0) return null;

  return debeInvertirCruce(origen, destino) ? 1 / n : n;
}

export function calcularCruce(origen, destino, modo, monto, tasaVisible) {
  const t = Number(tasaVisible);
  const m = Number(monto);

  if (!Number.isFinite(t) || t <= 0) return null;
  if (!Number.isFinite(m) || m <= 0) return null;

  const invertido = debeInvertirCruce(origen, destino);

  if (modo === "enviar") {
    return invertido ? m / t : m * t;
  }

  return invertido ? m * t : m / t;
}