// public/src/ui/shareCanvas.js

import {
  SHARE_PAYLOAD_TYPES,
  formatShareNumber,
  formatShareRateForDisplay,
  formatShareValue,
} from "../core/sharePayload.js";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const EXPORT_SCALE = 2;

const SHARE_SAFE_X = 86;
const SHARE_SAFE_W = CANVAS_WIDTH - SHARE_SAFE_X * 2;

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
  canvas.width = CANVAS_WIDTH * EXPORT_SCALE;
  canvas.height = CANVAS_HEIGHT * EXPORT_SCALE;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo crear el contexto canvas.");
  }

  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);

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

  await drawFooter(ctx, theme, payload);

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
  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bg.addColorStop(0, theme.bgTop);
  bg.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawGlow(ctx, 540, -80, 390, theme.blueGlow);
  drawGlow(ctx, 960, 1460, 430, theme.cyanGlow);
  drawGlow(ctx, 80, 1840, 340, alpha(theme.accent, 0.10));

  drawRoundRect(
    ctx,
    SHARE_SAFE_X,
    86,
    SHARE_SAFE_W,
    CANVAS_HEIGHT - 172,
    56,
    theme.card,
    theme.line,
    1,
  );

  const wash = ctx.createLinearGradient(
    SHARE_SAFE_X,
    86,
    SHARE_SAFE_X + SHARE_SAFE_W,
    CANVAS_HEIGHT - 86,
  );
  wash.addColorStop(0, "rgba(255,255,255,0.040)");
  wash.addColorStop(0.48, "rgba(255,255,255,0.014)");
  wash.addColorStop(1, theme.accentSoft);

  drawRoundRect(
    ctx,
    SHARE_SAFE_X,
    86,
    SHARE_SAFE_W,
    CANVAS_HEIGHT - 172,
    56,
    wash,
    null,
    0,
  );
}

async function drawHeader(ctx, theme, payload) {
  const logo = await loadImage("/logo.png").catch(() => null);

  const x = SHARE_SAFE_X + 44;
  const y = 138;

  drawRoundRect(ctx, x, y, 74, 74, 22, theme.row, theme.rowBorder, 1);

  if (logo) {
    ctx.drawImage(logo, x + 15, y + 15, 44, 44);
  } else {
    ctx.fillStyle = theme.accent;
    ctx.font = font(900, 30);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("B", x + 37, y + 38);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = theme.text;
  ctx.font = font(900, 48);
  ctx.fillText(payload.brand || "ByteTransfer", x + 96, y + 35);

  ctx.fillStyle = theme.accent;
  ctx.font = font(900, 18);
  drawSpacedText(ctx, getTypeLabel(payload.type), x + 98, y + 65, 2);

  drawBadge(ctx, theme, SHARE_SAFE_X + SHARE_SAFE_W - 270, y + 12, 220, 50, "Oficial");
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
  const x = 124;
  const w = 832;
  const top = 500;
  const panelH = 560;

  drawRoundRect(ctx, x, top, w, panelH, 42, theme.card2, theme.line, 1);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = theme.accent;
  ctx.font = font(900, 24);
  ctx.fillText("TASA VIGENTE", x + w / 2, top + 72);

  ctx.fillStyle = theme.text;
  ctx.font = font(900, 70);
  fitText(ctx, payload.subtitle || "", x + w / 2, top + 165, w - 90, 70);

  const heroY = top + 220;
  const heroH = 210;

  const heroGradient = ctx.createLinearGradient(x + 44, heroY, x + w - 44, heroY + heroH);
  heroGradient.addColorStop(0, alpha(theme.accent, 0.15));
  heroGradient.addColorStop(1, alpha(theme.accent, 0.07));

  drawRoundRect(ctx, x + 44, heroY, w - 88, heroH, 30, heroGradient, theme.accentLine, 1);

  ctx.fillStyle = theme.text;
  ctx.font = font(900, 96);
  ctx.textBaseline = "middle";
  fitText(
    ctx,
    formatShareRateForDisplay(payload.primaryValue),
    x + w / 2,
    heroY + heroH / 2 + 8,
    w - 170,
    96
  );

  if (payload.disclaimer) {
    drawNotice(ctx, theme, 124, top + panelH + 80, 832, 88, payload.disclaimer);
  }
}

function drawReferenceLayout(ctx, theme, payload) {
  const x = 124;
  const w = 832;
  const top = 560;
  const panelH = 520;

  drawRoundRect(ctx, x, top, w, panelH, 42, theme.card2, theme.line, 1);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = theme.accent;
  ctx.font = font(900, 24);
  ctx.fillText(String(payload.title || "Referencia BCV").toUpperCase(), x + w / 2, top + 70);

  ctx.fillStyle = theme.text;
  ctx.font = font(900, 72);
  fitText(ctx, payload.subtitle || "", x + w / 2, top + 154, w - 110, 72);

  const heroY = top + 205;
  const heroH = 220;

  const heroGradient = ctx.createLinearGradient(x + 44, heroY, x + w - 44, heroY + heroH);
  heroGradient.addColorStop(0, alpha(theme.accent, 0.16));
  heroGradient.addColorStop(1, alpha(theme.accent, 0.075));

  drawRoundRect(ctx, x + 44, heroY, w - 88, heroH, 30, heroGradient, theme.accentLine, 1);

  ctx.fillStyle = theme.accent;
  ctx.font = font(900, 22);
  ctx.fillText(String(payload.primaryLabel || "").toUpperCase(), x + w / 2, heroY + 52);

  ctx.fillStyle = theme.text;
  ctx.font = font(900, 82);
  ctx.textBaseline = "middle";
  fitText(
    ctx,
    payload.primaryRaw ? String(payload.primaryValue || "—") : formatShareNumber(payload.primaryValue),
    x + w / 2,
    heroY + 122,
    w - 170,
    82
  );

  if (payload.primaryUnit) {
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = 0.9;
    ctx.font = font(900, 34);
    fitText(ctx, payload.primaryUnit, x + w / 2, heroY + 176, w - 170, 34);
    ctx.globalAlpha = 1;
  }
}

function drawRemittanceLayout(ctx, theme, payload) {
  const rows = Array.isArray(payload.rows) ? payload.rows.filter(Boolean) : [];

  const x = SHARE_SAFE_X + 28;
  const w = SHARE_SAFE_W - 56;
  const top = 290;
  const h = 1140;

  drawRoundRect(ctx, x, top, w, h, 42, theme.card2, theme.line, 1);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = theme.accent;
  ctx.font = font(900, 24);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = theme.accent;
  ctx.font = font(900, 24);
  ctx.fillText(String(payload.title || "Cotización").toUpperCase(), x + w / 2, top + 66);

  ctx.fillStyle = theme.text;
  ctx.font = font(900, 76);
  fitText(ctx, payload.subtitle || "", x + w / 2, top + 156, w - 96, 76);

  const heroY = top + 206;
  const heroH = 338;
  const heroColors = getFlowRoleColors(theme, payload.primaryRole);

  const heroGradient = ctx.createLinearGradient(x + 36, heroY, x + w - 36, heroY + heroH);
  heroGradient.addColorStop(0, heroColors.fillStrong);
  heroGradient.addColorStop(1, heroColors.fillSoft);

  drawRoundRect(ctx, x + 36, heroY, w - 72, heroH, 34, heroGradient, heroColors.line, 1);

  ctx.fillStyle = heroColors.label;
  ctx.font = font(900, 26);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = heroColors.label;
  ctx.font = font(900, 24);
  ctx.fillText(String(payload.primaryLabel || "").toUpperCase(), x + w / 2, heroY + 58);

  ctx.fillStyle = theme.text;
  ctx.font = font(900, 118);
  ctx.textBaseline = "middle";
  fitText(
    ctx,
    payload.primaryRaw ? String(payload.primaryValue || "—") : formatShareNumber(payload.primaryValue),
    x + w / 2,
    heroY + 144,
    w - 150,
    118
  );

  if (payload.primaryUnit) {
    ctx.fillStyle = theme.text;
    ctx.font = font(900, 52);
    ctx.globalAlpha = 0.96;
    fitText(ctx, payload.primaryUnit, x + w / 2, heroY + 250, w - 150, 52);
    ctx.globalAlpha = 1;
  }

  const rowTop = heroY + heroH + 38;
  const gap = 18;
  const visibleRows = rows.slice(0, 5);
  const availableH = top + h - 42 - rowTop;
  const rowCount = Math.max(visibleRows.length, 1);

  const rowHeight = Math.max(
    118,
    Math.min(154, Math.floor((availableH - gap * (rowCount - 1)) / rowCount))
  );

  visibleRows.forEach((row, index) => {
    const rowY = rowTop + index * (rowHeight + gap);

    if (row?.type === "flow_side") {
      drawFlowSideRow(ctx, theme, {
        x: x + 24,
        y: rowY,
        w: w - 48,
        h: rowHeight,
        row,
        dense: rowHeight < 126,
      });
      return;
    }

    if (row?.type === "split_metric") {
      drawSplitMetricRow(ctx, theme, {
        x: x + 24,
        y: rowY,
        w: w - 48,
        h: rowHeight,
        row,
        dense: rowHeight < 126,
      });
      return;
    }
    const rawValue = formatShareValue(row);
    const rawText = `${row?.label || ""} ${rawValue || ""}`;
    const variant = /bcv|referenc/i.test(rawText) ? "reference" : "default";

    drawDataRow(ctx, theme, {
      x: x + 24,
      y: rowY,
      w: w - 48,
      h: rowHeight,
      label: row.label,
      value: rawValue,
      dense: rowHeight < 126,
      variant,
      highlighted: false,
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
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = theme.accent;
  ctx.font = font(900, 24);
  ctx.fillText(String(title || "").toUpperCase(), x + w / 2, top + 66);

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
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(String(label || "").toUpperCase(), x + w / 2, heroY + 58);

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

function getFlowRoleColors(theme, role) {
  if (role === "origin") {
    return {
      line: "rgba(34, 197, 94, 0.52)",
      label: "rgba(16, 185, 129, 0.92)",
      fillStrong: "rgba(34, 197, 94, 0.16)",
      fillSoft: "rgba(34, 197, 94, 0.06)",
    };
  }

  if (role === "destination") {
    return {
      line: "rgba(244, 63, 94, 0.44)",
      label: "rgba(225, 82, 112, 0.90)",
      fillStrong: "rgba(244, 63, 94, 0.12)",
      fillSoft: "rgba(244, 63, 94, 0.045)",
    };
  }

  return {
    line: theme.accentLine,
    label: theme.accent,
    fillStrong: alpha(theme.accent, 0.18),
    fillSoft: alpha(theme.accent, 0.09),
  };
}

function drawFlowSideRow(ctx, theme, { x, y, w, h, row, dense }) {
  const colors = getFlowRoleColors(theme, row?.role);
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, colors.fillStrong);
  gradient.addColorStop(1, colors.fillSoft);

  drawRoundRect(ctx, x, y, w, h, 24, gradient, colors.line, 1);
  drawRoundRect(ctx, x + 16, y + 18, 6, h - 36, 4, colors.line, null, 0);

  const side = row?.side || {};
  const actionLabel =
    side.actionLabel || side.label || (row?.role === "origin" ? "Envías" : "Recibes");
  const countryText = side.country || "";
  const amountText = side.value || "—";
  const unitText = side.unit || "";

  const padX = h >= 138 ? 34 : 30;
  const leftW = w * 0.34;
  const rightW = w * 0.42;

  const titleSize = dense ? 24 : h >= 138 ? 28 : 26;
  const countrySize = dense ? 18 : 21;
  const amountSize = dense ? 46 : h >= 138 ? 56 : 52;
  const unitSize = dense ? 22 : 25;

  const centerY = y + h / 2;

  const leftTitleY = centerY - 6;
  const leftCountryY = centerY + 26;

  const amountY = centerY - 2;
  const unitY = centerY + 30;

  ctx.textBaseline = "middle";

  ctx.textAlign = "left";
  ctx.fillStyle = colors.label;
  ctx.font = font(900, titleSize);
  fitText(ctx, actionLabel, x + padX, leftTitleY, leftW, titleSize, "left");

  ctx.fillStyle = theme.muted;
  ctx.font = font(800, countrySize);
  fitText(ctx, countryText, x + padX, leftCountryY, leftW, countrySize, "left");

  ctx.textAlign = "right";
  ctx.fillStyle = theme.text;
  ctx.font = font(900, amountSize);
  fitText(ctx, amountText, x + w - padX, amountY, rightW, amountSize, "right");

  ctx.fillStyle = theme.muted;
  ctx.font = font(800, unitSize);
  fitText(ctx, unitText, x + w - padX, unitY, rightW, unitSize, "right");
}

function drawSplitMetricRow(ctx, theme, { x, y, w, h, row, dense }) {
  const isReference = row?.variant === "reference";

  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, isReference ? "rgba(238, 242, 247, 0.98)" : "rgba(218, 244, 255, 0.98)");
  gradient.addColorStop(1, isReference ? "rgba(248, 250, 252, 0.96)" : "rgba(238, 249, 255, 0.96)");

  const stroke = isReference ? "rgba(148, 163, 184, 0.34)" : "rgba(45, 169, 220, 0.38)";
  const accentLine = isReference ? "rgba(148, 163, 184, 0.48)" : "rgba(19, 230, 198, 0.55)";

  drawRoundRect(ctx, x, y, w, h, 24, gradient, stroke, 1);
  drawRoundRect(ctx, x + 16, y + 20, 6, h - 40, 4, accentLine, null, 0);

  const labelText = row?.label || "";
  const valueText = row?.raw ? String(row?.value || "—") : formatShareNumber(row?.value);
  const unitText = row?.unit || "";

  const sidePad = h >= 138 ? 32 : 28;
  const labelOffset = 18;
  const centerY = y + h / 2;

  const labelSize = isReference ? (dense ? 22 : 25) : (dense ? 22 : 26);
  const valueSize = isReference ? (dense ? 30 : 34) : (dense ? 34 : 40);
  const unitSize = isReference ? (dense ? 17 : 20) : (dense ? 18 : 22);

  const labelWidth = isReference ? w * 0.42 : w * 0.48;
  const valueWidth = isReference ? w * 0.50 : w * 0.44;

  ctx.textBaseline = "middle";

  ctx.textAlign = "left";
  ctx.fillStyle = theme.muted;
  ctx.font = font(800, labelSize);
  fitText(ctx, labelText, x + sidePad + labelOffset, centerY, labelWidth, labelSize, "left");

  ctx.textAlign = "right";
  ctx.fillStyle = theme.text;
  ctx.font = font(900, valueSize);
  fitText(ctx, valueText, x + w - sidePad, centerY - (unitText ? 14 : 0), valueWidth, valueSize, "right");

  if (unitText) {
    ctx.fillStyle = theme.muted;
    ctx.font = font(800, unitSize);
    fitText(ctx, unitText, x + w - sidePad, centerY + 22, valueWidth, unitSize, "right");
  }
}
function drawDataRow(
  ctx,
  theme,
  { x, y, w, h, label, value, dense, variant = "default", highlighted = false }
) {
  let fill = theme.row;
  let stroke = theme.rowBorder;
  let accentLine = null;

  if (variant === "default" && !highlighted) {
    const neutralGradient = ctx.createLinearGradient(x, y, x + w, y + h);
    neutralGradient.addColorStop(0, "rgba(218, 244, 255, 0.98)");
    neutralGradient.addColorStop(1, "rgba(238, 249, 255, 0.96)");
    fill = neutralGradient;
    stroke = "rgba(45, 169, 220, 0.38)";
    accentLine = "rgba(19, 230, 198, 0.55)";
  }

  if (highlighted) {
    const rowGradient = ctx.createLinearGradient(x, y, x + w, y + h);
    rowGradient.addColorStop(0, alpha(theme.accent, 0.18));
    rowGradient.addColorStop(1, alpha(theme.accent, 0.08));
    fill = rowGradient;
    stroke = theme.accentLine;
  }

  drawRoundRect(ctx, x, y, w, h, 24, fill, stroke, 1);

  if (accentLine) {
    drawRoundRect(ctx, x + 16, y + 20, 6, h - 40, 4, accentLine, null, 0);
  }

  ctx.textBaseline = "middle";

  const isReference = variant === "reference";

  const labelSize = isReference
    ? (highlighted ? 24 : dense ? 22 : 26)
    : (highlighted ? 28 : dense ? 24 : h >= 138 ? 30 : 26);

  const valueSize = isReference
    ? (highlighted ? 34 : dense ? 28 : 34)
    : (highlighted ? 48 : dense ? 34 : h >= 138 ? 44 : 38);

  const sidePad = h >= 138 ? 32 : 28;
  const labelOffset = accentLine ? 18 : 0;
  const labelWidth = isReference ? w * 0.40 : w * 0.44;
  const valueWidth = isReference ? w * 0.58 : w * 0.50;

  ctx.fillStyle = highlighted ? theme.accent : theme.muted;
  ctx.font = font(800, labelSize);
  ctx.textAlign = "left";
  fitText(ctx, label || "", x + sidePad + labelOffset, y + h / 2, labelWidth, labelSize, "left");

  ctx.fillStyle = theme.text;
  ctx.font = font(900, valueSize);
  ctx.textAlign = "right";
  fitText(ctx, value || "—", x + w - sidePad, y + h / 2, valueWidth, valueSize, "right");
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

async function drawFooter(ctx, theme, payload) {
  const logo = await loadImage("/logo.png").catch(() => null);

  const dividerY = CANVAS_HEIGHT - 210;

  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(SHARE_SAFE_X + 38, dividerY);
  ctx.lineTo(SHARE_SAFE_X + SHARE_SAFE_W - 38, dividerY);
  ctx.stroke();

  const centerX = CANVAS_WIDTH / 2;
  const logoSize = 112;
  const logoY = dividerY - 120;

  if (logo) {
    ctx.drawImage(
      logo,
      centerX - logoSize / 2,
      logoY - logoSize / 2,
      logoSize,
      logoSize
    );
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = theme.accent;
  ctx.font = font(900, 18);
  drawSpacedTextCentered(ctx, "BYTETRANSFER", centerX, logoY + 84, 5);

  const leftLabel = String(payload.footerLeftLabel || "ACTUALIZADO").toUpperCase();
  const leftValue = payload.footerLeftValue || payload.updatedAt || "Fecha no disponible";
  const rightLabel = payload.footerRightLabel
    ? String(payload.footerRightLabel).toUpperCase()
    : "";
  const rightValue = payload.footerRightValue || "";

  const footerLabelY = dividerY + 62;
  const footerValueY = dividerY + 102;
  const labelSize = 16;
  const valueSize = 24;

  ctx.textAlign = "left";
  ctx.fillStyle = theme.muted;
  ctx.font = font(800, labelSize);
  fitText(
    ctx,
    leftLabel,
    SHARE_SAFE_X + 44,
    footerLabelY,
    430,
    labelSize,
    "left"
  );

  ctx.fillStyle = theme.text;
  ctx.font = font(900, valueSize);
  fitText(
    ctx,
    leftValue,
    SHARE_SAFE_X + 44,
    footerValueY,
    430,
    valueSize,
    "left"
  );

  if (rightLabel || rightValue) {
    ctx.textAlign = "right";
    ctx.fillStyle = theme.muted;
    ctx.font = font(800, labelSize);
    fitText(
      ctx,
      rightLabel,
      SHARE_SAFE_X + SHARE_SAFE_W - 44,
      footerLabelY,
      430,
      labelSize,
      "right"
    );

    ctx.fillStyle = theme.text;
    ctx.font = font(900, valueSize);
    fitText(
      ctx,
      rightValue || "Fecha no disponible",
      SHARE_SAFE_X + SHARE_SAFE_W - 44,
      footerValueY,
      430,
      valueSize,
      "right"
    );
  }
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
