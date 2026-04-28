function traducirConfianza(confidence) {
  if (confidence === "high") return "Confiable";
  if (confidence === "medium") return "Revisar";
  if (confidence === "low") return "Atención";
  return "Sin evaluar";
}

function traducirProvider(provider) {
  if (provider === "binance") return "Mercado P2P";
  if (provider === "ptax") return "Referencia oficial BRL";
  if (provider === "bcv") return "Referencia BCV";
  if (provider === "snapshot") return "Base guardada del día";
  if (provider === "derived") return "Calculado desde otra referencia";
  return "Fuente externa";
}

function traducirSource(source) {
  if (!source) return "Sin fuente";
  if (source === "binance_p2p") return "Mercado P2P";
  if (source === "ptax") return "PTAX Brasil";
  if (source === "mercantil") return "Referencia publicada por Mercantil";
  if (source === "bancoexterior") return "Referencia publicada por Banco Exterior";
  if (source === "latest_snapshot") return "Base guardada del día";
  if (String(source).startsWith("derived:")) return "Cálculo interno del sistema";
  return "Fuente externa";
}

function traducirWarningCotizacion(warning) {
  const w = String(warning || "");

  const moneda = w.match(/^([A-Z]{3})/)?.[1] || "";

  if (w.includes("spread alto")) {
    return `${moneda} tiene una diferencia alta entre compra y venta. Conviene revisar esa referencia antes de guardar nuevas tasas.`;
  }

  if (w.includes("usa fallback")) {
    return `${moneda} está usando un respaldo temporal porque la fuente principal no respondió correctamente.`;
  }

  if (w.includes("está stale")) {
    return `${moneda} está usando un dato anterior. Puedes verlo, pero conviene revisar antes de guardar cambios.`;
  }

  return w;
}