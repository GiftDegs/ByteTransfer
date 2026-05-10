const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const WEEKDAY_LABELS = {
  sunday: "domingo",
  monday: "lunes",
  tuesday: "martes",
  wednesday: "miércoles",
  thursday: "jueves",
  friday: "viernes",
  saturday: "sábado",
};

const OPEN_PHRASES = [
  "Estamos activos",
  "Operación disponible",
  "Listos para cotizar",
  "Servicio activo",
  "Atención disponible",
  "Operando ahora",
  "Cotizaciones activas",
  "Estamos en línea",
  "Remesas disponibles",
  "Activos en este momento",
];

const CLOSING_SOON_PHRASES = [
  "Cerramos pronto",
  "Últimos minutos activos",
  "Última hora operativa",
  "Atención por cerrar",
  "Queda poco tiempo",
  "Horario casi finalizado",
  "Cotiza antes del cierre",
  "Seguimos por poco tiempo",
  "Último tramo del día",
  "Aún estamos activos",
];

const OPENING_SOON_PHRASES = [
  "Abrimos pronto",
  "Ya casi volvemos",
  "Atención por iniciar",
  "Falta poco para abrir",
  "Preparando atención",
  "Volvemos en breve",
  "Cotizaciones pronto disponibles",
  "Servicio por activarse",
  "Atención casi disponible",
  "Ya casi estamos activos",
];

const CLOSED_SCHEDULE_PHRASES = [
  "Fuera de horario",
  "Atención cerrada",
  "Servicio no disponible",
  "Horario finalizado",
  "Cotización referencial",
  "Operación en pausa horaria",
  "Volvemos pronto",
  "Consulta referencial",
  "Servicio fuera de turno",
  "Atención no disponible",
];

const DEFAULT_WEEKLY_SCHEDULE = {
  monday: { active: true, from: "11:00", to: "22:00" },
  tuesday: { active: true, from: "11:00", to: "22:00" },
  wednesday: { active: true, from: "11:00", to: "22:00" },
  thursday: { active: true, from: "11:00", to: "22:00" },
  friday: { active: true, from: "11:00", to: "22:00" },
  saturday: { active: true, from: "11:00", to: "22:00" },
  sunday: { active: false, from: "11:00", to: "14:00" },
};

let publicOperationConfig = null;
let publicOperationStatus = buildFallbackOpenStatus();
let publicOperationTicker = null;
let lastStatusFingerprint = "";

export async function loadPublicOperationStatus() {
  try {
    const snapshot = await fetchSnapshotForPublicOperation();
    publicOperationConfig = normalizePublicConfig(snapshot?.publicConfig);
  } catch (err) {
    console.warn("[publicOperation] No se pudo cargar configuración pública:", err);
    publicOperationConfig = normalizePublicConfig(null);
  }

  publicOperationStatus = buildPublicOperationStatus(publicOperationConfig);
  lastStatusFingerprint = getStatusFingerprint(publicOperationStatus);

  return publicOperationStatus;
}

export function startPublicOperationTicker(onChange) {
  stopPublicOperationTicker();

  publicOperationTicker = window.setInterval(() => {
    publicOperationStatus = buildPublicOperationStatus(publicOperationConfig);
    const fingerprint = getStatusFingerprint(publicOperationStatus);

    if (fingerprint === lastStatusFingerprint) return;

    lastStatusFingerprint = fingerprint;

    if (typeof onChange === "function") {
      onChange(publicOperationStatus);
    }
  }, 30 * 1000);

  return publicOperationTicker;
}

export function stopPublicOperationTicker() {
  if (!publicOperationTicker) return;
  window.clearInterval(publicOperationTicker);
  publicOperationTicker = null;
}

export function getPublicOperationStatus() {
  return publicOperationStatus || buildFallbackOpenStatus();
}

export function isPublicOperationClosed() {
  const status = getPublicOperationStatus();
  return Boolean(status?.isClosed);
}

export function canUsePublicOperationShare() {
  const status = getPublicOperationStatus();
  return Boolean(status?.canShare);
}

export function canUsePublicOperationWhatsapp() {
  const status = getPublicOperationStatus();
  return Boolean(status?.canWhatsapp);
}

async function fetchSnapshotForPublicOperation() {
  const ctrl = new AbortController();
  const id = window.setTimeout(() => ctrl.abort(), 4500);

  try {
    const res = await fetch("/api/snapshot", {
      cache: "no-store",
      signal: ctrl.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  } finally {
    window.clearTimeout(id);
  }
}

function normalizePublicConfig(config) {
  if (!config || typeof config !== "object") {
    return {
      calculatorState: "open",
      message: "",
      weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
      hasSchedule: false,
    };
  }

  return {
    calculatorState: String(config.calculatorState || "open"),
    message: String(config.message || "").trim(),
    weeklySchedule: normalizeWeeklySchedule(config.weeklySchedule),
    hasSchedule: Boolean(config.weeklySchedule && typeof config.weeklySchedule === "object"),
  };
}

function normalizeWeeklySchedule(schedule = {}) {
  const output = {};

  for (const key of DAY_KEYS) {
    const item = schedule?.[key] || DEFAULT_WEEKLY_SCHEDULE[key] || {};
    output[key] = {
      active: Boolean(item.active),
      from: isValidTime(item.from) ? item.from : DEFAULT_WEEKLY_SCHEDULE[key]?.from || "11:00",
      to: isValidTime(item.to) ? item.to : DEFAULT_WEEKLY_SCHEDULE[key]?.to || "22:00",
    };
  }

  return output;
}

function buildPublicOperationStatus(config, now = new Date()) {
  const cfg = normalizePublicConfig(config);
  const calculatorState = String(cfg.calculatorState || "schedule").toLowerCase();

  const manualClosedStates = new Set([
    "closed",
    "close",
    "paused",
    "pause",
    "manual",
    "manual_closed",
    "closed_manual",
  ]);

  if (manualClosedStates.has(calculatorState)) {
    return buildManualClosedStatus(cfg);
  }

  if (calculatorState === "open") {
    return buildFallbackOpenStatus(now);
  }

  if (!cfg.hasSchedule) {
    return buildFallbackOpenStatus(now);
  }

  const activeWindow = getActiveWindow(cfg.weeklySchedule, now);

  if (activeWindow) {
    const minutesToClose = getMinutesUntil(activeWindow.closeAt, now);
    const isClosingSoon = minutesToClose <= 60;

    return {
      status: isClosingSoon ? "closing_soon" : "open",
      tone: isClosingSoon ? "warning" : "success",
      phrase: pickDailyPhrase(isClosingSoon ? CLOSING_SOON_PHRASES : OPEN_PHRASES, now),
      detail: isClosingSoon
        ? `Quedan ${formatMinutes(minutesToClose)}`
        : `Atención disponible hasta las ${formatTimeForVisitor(activeWindow.closeAt)}`,
      isClosed: false,
      isReferenceOnly: false,
      canQuote: true,
      canWhatsapp: true,
      canShare: true,
      modalRequired: false,
      progress: getWindowProgress(activeWindow.openAt, activeWindow.closeAt, now),
      openedAt: activeWindow.openAt,
      closeAt: activeWindow.closeAt,
      nextOpeningAt: null,
    };
  }

  const nextOpening = getNextOpeningWindow(cfg.weeklySchedule, now);

  if (!nextOpening) {
    return {
      status: "closed_schedule",
      tone: "muted",
      phrase: pickDailyPhrase(CLOSED_SCHEDULE_PHRASES, now),
      detail: "Atención no disponible",
      isClosed: true,
      isReferenceOnly: true,
      canQuote: true,
      canWhatsapp: false,
      canShare: false,
      modalRequired: true,
      progress: null,
      openedAt: null,
      closeAt: null,
      nextOpeningAt: null,
    };
  }

  const minutesToOpen = getMinutesUntil(nextOpening.openAt, now);

  if (minutesToOpen <= 60) {
    return {
      status: "opening_soon",
      tone: "info",
      phrase: pickDailyPhrase(OPENING_SOON_PHRASES, now),
      detail: `Abrimos en ${formatMinutes(minutesToOpen)}`,
      isClosed: true,
      isReferenceOnly: true,
      canQuote: true,
      canWhatsapp: false,
      canShare: false,
      modalRequired: true,
      progress: null,
      openedAt: null,
      closeAt: null,
      nextOpeningAt: nextOpening.openAt,
    };
  }

  return {
    status: "closed_schedule",
    tone: "muted",
    phrase: pickDailyPhrase(CLOSED_SCHEDULE_PHRASES, now),
    detail: buildNextOpeningText(nextOpening.openAt, now),
    isClosed: true,
    isReferenceOnly: true,
    canQuote: true,
    canWhatsapp: false,
    canShare: false,
    modalRequired: true,
    progress: null,
    openedAt: null,
    closeAt: null,
    nextOpeningAt: nextOpening.openAt,
  };
}

function buildFallbackOpenStatus(now = new Date()) {
  return {
    status: "open",
    tone: "success",
    phrase: pickDailyPhrase(OPEN_PHRASES, now),
    detail: "Operación disponible",
    isClosed: false,
    isReferenceOnly: false,
    canQuote: true,
    canWhatsapp: true,
    canShare: true,
    modalRequired: false,
    progress: null,
    openedAt: null,
    closeAt: null,
    nextOpeningAt: null,
  };
}

function buildManualClosedStatus(config) {
  return {
    status: "closed_manual",
    tone: "danger",
    phrase: "Servicio pausado",
    detail: config.message || "Operación temporalmente pausada",
    isClosed: true,
    isReferenceOnly: true,
    canQuote: true,
    canWhatsapp: false,
    canShare: false,
    modalRequired: true,
    progress: null,
    openedAt: null,
    closeAt: null,
    nextOpeningAt: null,
  };
}

function getActiveWindow(schedule, now) {
  const argentinaDate = getDatePartsInTimeZone(now, ARGENTINA_TIME_ZONE);

  const previousDate = addDaysToDateParts(argentinaDate, -1);
  const previousWindow = buildScheduleWindowForDate(schedule, previousDate);

  if (previousWindow && now >= previousWindow.openAt && now < previousWindow.closeAt) {
    return previousWindow;
  }

  const todayWindow = buildScheduleWindowForDate(schedule, argentinaDate);

  if (todayWindow && now >= todayWindow.openAt && now < todayWindow.closeAt) {
    return todayWindow;
  }

  return null;
}


function getNextOpeningWindow(schedule, now) {
  const argentinaDate = getDatePartsInTimeZone(now, ARGENTINA_TIME_ZONE);

  for (let offset = 0; offset <= 8; offset += 1) {
    const dateParts = addDaysToDateParts(argentinaDate, offset);
    const window = buildScheduleWindowForDate(schedule, dateParts);

    if (!window) continue;

    if (window.openAt > now) {
      return window;
    }
  }

  return null;
}


function buildScheduleWindowForDate(schedule, dateParts) {
  const dayKey = getDayKeyFromDateParts(dateParts);
  const item = schedule?.[dayKey];

  if (!item?.active) return null;

  const openAt = dateFromArgentinaLocal(dateParts, item.from);
  let closeAt = dateFromArgentinaLocal(dateParts, item.to);

  const fromMinutes = parseTimeToMinutes(item.from);
  const toMinutes = parseTimeToMinutes(item.to);

  if (toMinutes <= fromMinutes) {
    closeAt = new Date(closeAt.getTime() + DAY_MS);
  }

  return { openAt, closeAt, dayKey };
}

function dateFromArgentinaLocal(dateParts, time) {
  const minutes = parseTimeToMinutes(time);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return new Date(
    Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      hours + 3,
      mins,
      0,
      0
    )
  );
}

function buildNextOpeningText(openAt, now) {
  const time = formatTimeForVisitor(openAt);
  const dayDiff = getVisitorDayDifference(now, openAt);

  if (dayDiff === 0) {
    return `Atención disponible desde las ${time}`;
  }

  if (dayDiff === 1) {
    return `Volvemos mañana a las ${time}`;
  }

  const visitorDate = getDatePartsInTimeZone(openAt, getVisitorTimeZone());
  const dayKey = getDayKeyFromDateParts(visitorDate);

  return `Volvemos el ${WEEKDAY_LABELS[dayKey] || "próximo día"} a las ${time}`;
}

function getWindowProgress(openAt, closeAt, now) {
  const total = closeAt.getTime() - openAt.getTime();
  const elapsed = now.getTime() - openAt.getTime();

  if (!Number.isFinite(total) || total <= 0) return null;

  return Math.max(0, Math.min(1, elapsed / total));
}

function getMinutesUntil(targetDate, now = new Date()) {
  return Math.max(1, Math.ceil((targetDate.getTime() - now.getTime()) / MINUTE_MS));
}

function formatMinutes(minutes) {
  const safe = Math.max(1, Math.round(Number(minutes) || 1));
  return safe === 1 ? "1 minuto" : `${safe} minutos`;
}

function formatTimeForVisitor(date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: getVisitorTimeZone(),
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("es-AR", {
      timeZone: getVisitorTimeZone(),
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .format(date)
      .replace(/^24:/, "00:");
  }
}


function getVisitorDayDifference(now, target) {
  const visitorTimeZone = getVisitorTimeZone();
  const nowParts = getDatePartsInTimeZone(now, visitorTimeZone);
  const targetParts = getDatePartsInTimeZone(target, visitorTimeZone);

  const nowUtc = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day);
  const targetUtc = Date.UTC(targetParts.year, targetParts.month - 1, targetParts.day);

  return Math.round((targetUtc - nowUtc) / DAY_MS);
}

function getVisitorTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ARGENTINA_TIME_ZONE;
  } catch {
    return ARGENTINA_TIME_ZONE;
  }
}

function getDatePartsInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

function addDaysToDateParts(dateParts, days) {
  const date = new Date(
    Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day + days)
  );

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function getDayKeyFromDateParts(dateParts) {
  const date = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day));
  return DAY_KEYS[date.getUTCDay()] || "monday";
}

function pickDailyPhrase(phrases, date) {
  const list = Array.isArray(phrases) && phrases.length ? phrases : OPEN_PHRASES;
  const argentinaDate = getDatePartsInTimeZone(date, ARGENTINA_TIME_ZONE);
  const dayNumber = Math.floor(
    Date.UTC(argentinaDate.year, argentinaDate.month - 1, argentinaDate.day) / DAY_MS
  );

  return list[dayNumber % list.length];
}

function parseTimeToMinutes(value) {
  const [h, m] = String(value || "").split(":").map(Number);

  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;

  return Math.max(0, Math.min(1439, h * 60 + m));
}

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(String(value || ""));
}

function getStatusFingerprint(status) {
  return [
    status?.status || "",
    status?.phrase || "",
    status?.detail || "",
    status?.tone || "",
    status?.canWhatsapp ? "w1" : "w0",
    status?.canShare ? "s1" : "s0",
    status?.isReferenceOnly ? "r1" : "r0",
    status?.progress === null || status?.progress === undefined
      ? "p"
      : Math.round(status.progress * 100),
  ].join("|");
}
