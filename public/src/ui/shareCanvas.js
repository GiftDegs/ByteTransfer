// public/src/ui/shareCanvas.js

import {
  SHARE_PAYLOAD_TYPES,
  formatShareNumber,
  formatShareValue,
} from "../core/sharePayload.js";

const CANVAS_SIZE = 1080;

const THEMES = {
  dark: {
    bgTop: "#081B46",
    bgBottom: "#020817",
    card: "#13223B",
    card2: "#071326",
    panel: "#0B172C",
    line: "rgba(255,255,255,0.115)",
    lineSoft: "rgba(255,255,255,0.075)",

    text: "#F8FAFC",
    muted: "#B3BED3",
    muted2: "#8996B1",

    accent: "#12E1D2",
    accentSoft: "rgba(18,225,210,0.105)",
    accentLine: "rgba(18,225,210,0.28)",
    blueGlow: "rgba(31,107,255,0.16)",
    cyanGlow: "rgba(18,225,210,0.095)",

    row: "rgba(72,88,126,0.30)",
    rowBorder: "rgba(170,190,235,0.105)",

    warningBgA: "rgba(255,193,7,0.105)",
    warningBgB: "rgba(18,225,210,0.105)",
    warningText: "#F7EFD2",

    shadow: "rgba(0,0,0,0.38)",
    },

  light: {
    bgTop: "#F8FBFF",
    bgBottom: "#EAF6FA",
    card: "#FFFFFF",
    card2: "#F8FBFE",
    panel: "#F3F7FB",
    line: "rgba(10,23,56,0.12)",
    lineSoft: "rgba(10,23,56,0.075)",

    text: "#071434",
    muted: "#65728E",
    muted2: "#8792AA",

    accent: "#00BFA6",
    accentSoft: "rgba(0,191,166,0.12)",
    accentLine: "rgba(0,191,166,0.26)",
    blueGlow: "rgba(31,107,255,0.12)",
    cyanGlow: "rgba(19,230,198,0.15)",

    row: "rgba(10,23,56,0.035)",
    rowBorder: "rgba(10,23,56,0.085)",

    warningBgA: "rgba(255,193,7,0.14)",
    warningBgB: "rgba(0,191,166,0.09)",
    warningText: "#5B4A14",

    shadow: "rgba(10,23,56,0.14)",
  },
};

export async function generatePremiumShareBlob(payload) {
  if (!payload) {
    throw new Error("No hay datos para generar imagen.");
  }

  await waitForFonts();

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo crear el contexto canvas.");
  }

  const theme = THEMES[payload.theme || "dark"] || THEMES.dark;

  drawBackground(ctx, theme);
  await drawHeader(ctx, theme, payload);

  if (payload.type === SHARE_PAYLOAD_TYPES.RATE) {
    drawRateLayout(ctx, theme, payload);
  } else if (payload.type === SHARE_PAYLOAD_TYPES.REFERENCE) {
    drawReferenceLayout(ctx, theme, payload);
  } else {
    drawRemittanceLayout(ctx, theme, payload);
  }

  drawFooter(ctx, theme, payload);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png", 1);
  });

  if (!blob) {
    throw new Error("No se pudo generar el PNG.");
  }

  return blob;
}

async function waitForFonts() {
  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch (_) {}
}

function font(weight, size) {
  return `${weight} ${size}px Poppins, Arial, sans-serif`;
}

function drawBackground(ctx, theme) {
  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_SIZE);
  bg.addColorStop(0, theme.bgTop);
  bg.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  drawGlow(ctx, 540, -30, 290, theme.blueGlow);
  drawGlow(ctx, 930, 930, 300, theme.cyanGlow);

  drawRoundRect(ctx, 78, 78, 924, 924, 48, theme.card, theme.line, 1);

  const wash = ctx.createLinearGradient(78, 78, 1002, 1002);
  wash.addColorStop(0, "rgba(255,255,255,0.035)");
  wash.addColorStop(0.55, "rgba(255,255,255,0.012)");
  wash.addColorStop(1, theme.accentSoft);
  drawRoundRect(ctx, 78, 78, 924, 924, 48, wash, null, 0);
}

async function drawHeader(ctx, theme, payload) {
  const logo = await loadImage("/logo.png").catch(() => null);

  const x = 126;
  const y = 126;

  drawRoundRect(ctx, x, y, 58, 58, 18, theme.row, theme.rowBorder, 1);

  if (logo) {
    ctx.drawImage(logo, x + 13, y + 13, 32, 32);
  } else {
    ctx.fillStyle = theme.accent;
    ctx.font = font(900, 24);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("B", x + 29, y + 30);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = theme.text;
  ctx.font = font(900, 38);
  ctx.fillText(payload.brand || "ByteTransfer", 202, 158);

  ctx.fillStyle = theme.accent;
  ctx.font = font(900, 15);
  drawSpacedText(ctx, getTypeLabel(payload.type), 203, 184, 5);

  drawBadge(ctx, theme, 768, 120, 190, 44, "Cotización oficial");
}

function drawBadge(ctx, theme, x, y, w, h, text) {
  drawRoundRect(ctx, x, y, w, h, h / 2, theme.card2, theme.accentLine, 1);

  ctx.fillStyle = theme.text;
  ctx.font = font(900, 15);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  fitText(ctx, text, x + w / 2, y + h / 2 + 1, w - 34, 15, "center");
}

function drawRateLayout(ctx, theme, payload) {
  drawHeroBlock(ctx, theme, {
    top: 276,
    title: payload.title || "Tasa de cambio",
    subtitle: payload.subtitle || "",
    label: "Tasa vigente",
    value: formatShareNumber(payload.primaryValue),
    unit: payload.primaryUnit || "",
    compact: false,
  });

  if (payload.disclaimer) {
    drawNotice(ctx, theme, 124, 704, 832, 58, payload.disclaimer);
  }
}

function drawReferenceLayout(ctx, theme, payload) {
  drawHeroBlock(ctx, theme, {
    top: 306,
    title: payload.title || "Referencia BCV",
    subtitle: payload.subtitle || "",
    label: payload.primaryLabel || "",
    value: formatShareNumber(payload.primaryValue),
    unit: payload.primaryUnit || "",
    compact: false,
  });
}

function drawRemittanceLayout(ctx, theme, payload) {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const dense = rows.length >= 4;

  drawHeroBlock(ctx, theme, {
    top: dense ? 238 : 250,
    title: payload.title || "Cotización",
    subtitle: payload.subtitle || "",
    label: payload.primaryLabel || "",
    value: formatShareNumber(payload.primaryValue),
    unit: payload.primaryUnit || "",
    compact: dense,
  });

  const rowTop = dense ? 610 : 648;
  const rowHeight = dense ? 54 : 62;
  const gap = dense ? 10 : 12;

  rows.forEach((row, index) => {
    drawDataRow(ctx, theme, {
      x: 124,
      y: rowTop + index * (rowHeight + gap),
      w: 832,
      h: rowHeight,
      label: row.label,
      value: formatShareValue(row),
      dense,
    });
  });
}

function drawHeroBlock(ctx, theme, config) {
  const {
    top,
    title,
    subtitle,
    label,
    value,
    unit,
    compact = false,
  } = config;

  const x = 124;
  const w = 832;
  const h = compact ? 338 : 360;

  drawRoundRect(ctx, x, top, w, h, 38, theme.card2, theme.line, 1);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = theme.accent;
  ctx.font = font(900, compact ? 23 : 25);
  drawSpacedTextCentered(ctx, String(title || "").toUpperCase(), x + w / 2, top + 70, 6);

  ctx.fillStyle = theme.text;
  ctx.font = font(900, compact ? 50 : 58);
  fitText(ctx, subtitle || "", x + w / 2, top + (compact ? 130 : 145), w - 90, compact ? 50 : 58);

  const heroY = top + (compact ? 164 : 190);
  const heroH = compact ? 136 : 142;

  const heroGradient = ctx.createLinearGradient(0, heroY, 0, heroY + heroH);
  heroGradient.addColorStop(0, theme.accentSoft);
  heroGradient.addColorStop(1, alpha(theme.accent, 0.07));

  drawRoundRect(ctx, x + 44, heroY, w - 88, heroH, 28, heroGradient, theme.accentLine, 1);

  ctx.fillStyle = theme.accent;
  ctx.font = font(900, compact ? 16 : 17);
  drawSpacedTextCentered(ctx, String(label || "").toUpperCase(), x + w / 2, heroY + 37, 5);

  ctx.fillStyle = theme.text;
  ctx.font = font(900, compact ? 60 : 68);
  ctx.textBaseline = "middle";
  fitText(ctx, value, x + w / 2, heroY + (unit ? 82 : 88), w - 170, compact ? 60 : 68);

  if (unit) {
    ctx.fillStyle = theme.text;
    ctx.font = font(900, compact ? 26 : 28);
    ctx.globalAlpha = 0.92;
    fitText(ctx, unit, x + w / 2, heroY + 116, w - 170, compact ? 26 : 28);
    ctx.globalAlpha = 1;
  }
}

function drawDataRow(ctx, theme, { x, y, w, h, label, value, dense }) {
  drawRoundRect(ctx, x, y, w, h, 22, theme.row, theme.rowBorder, 1);

  ctx.textBaseline = "middle";

  ctx.fillStyle = theme.muted;
  ctx.font = font(800, dense ? 17 : 19);
  ctx.textAlign = "left";
  fitText(ctx, label || "", x + 24, y + h / 2, w * 0.45, dense ? 17 : 19, "left");

  ctx.fillStyle = theme.text;
  ctx.font = font(900, dense ? 21 : 23);
  ctx.textAlign = "right";
  fitText(ctx, value || "—", x + w - 24, y + h / 2, w * 0.48, dense ? 21 : 23, "right");
}

function drawNotice(ctx, theme, x, y, w, h, text) {
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, theme.warningBgA);
  g.addColorStop(1, theme.warningBgB);

  drawRoundRect(ctx, x, y, w, h, 22, g, theme.rowBorder, 1);

  ctx.fillStyle = theme.warningText;
  ctx.font = font(900, 20);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitText(ctx, text, x + w / 2, y + h / 2, w - 60, 20);
}

function drawFooter(ctx, theme, payload) {
  const y = 868;

  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(124, y);
  ctx.lineTo(956, y);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = theme.muted;
  ctx.font = font(800, 15);
  drawSpacedText(ctx, "ACTUALIZADO", 124, 916, 5);

  ctx.fillStyle = theme.text;
  ctx.font = font(900, 25);
  ctx.fillText(payload.updatedAt || "Fecha no disponible", 124, 950);

  ctx.textAlign = "right";

  ctx.fillStyle = theme.muted;
  ctx.font = font(700, 14);
  fitText(
    ctx,
    "Tasa sujeta a disponibilidad operativa",
    956,
    916,
    390,
    14,
    "right"
  );

  ctx.fillStyle = theme.accent;
  ctx.font = font(900, 25);
  ctx.fillText("ByteTransfer", 956, 950);
}

function drawRoundRect(ctx, x, y, w, h, r, fill, stroke = null, strokeWidth = 1) {
  const radius = Math.min(r, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

function drawGlow(ctx, x, y, r, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function fitText(ctx, text, x, y, maxWidth, startSize, align = "center") {
  const value = String(text ?? "");
  let size = startSize;

  ctx.textAlign = align;

  while (size > 10) {
    ctx.font = ctx.font.replace(/\d+px/, `${size}px`);
    if (ctx.measureText(value).width <= maxWidth) break;
    size -= 1;
  }

  ctx.fillText(value, x, y);
}

function drawSpacedText(ctx, text, x, y, spacing = 4) {
  const value = String(text || "").toUpperCase();
  let cursor = x;

  for (const char of value) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + spacing;
  }
}

function drawSpacedTextCentered(ctx, text, centerX, y, spacing = 4) {
  const value = String(text || "").toUpperCase();
  let width = 0;

  for (const char of value) {
    width += ctx.measureText(char).width + spacing;
  }

  width -= spacing;

  drawSpacedText(ctx, value, centerX - width / 2, y, spacing);
}

function alpha(hexOrRgb, opacity) {
  if (String(hexOrRgb).startsWith("rgba")) return hexOrRgb;
  if (String(hexOrRgb).startsWith("rgb(")) {
    return String(hexOrRgb).replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
  }

  const hex = String(hexOrRgb).replace("#", "");
  const bigint = parseInt(hex, 16);

  if (Number.isNaN(bigint)) return hexOrRgb;

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getTypeLabel(type) {
  if (type === SHARE_PAYLOAD_TYPES.REFERENCE) return "Referencia";
  if (type === SHARE_PAYLOAD_TYPES.RATE) return "Tasa";
  if (type === SHARE_PAYLOAD_TYPES.REMITTANCE) return "Remesa";
  return "Consulta";
}