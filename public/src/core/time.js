// public/src/core/time.js
const TZ = 'America/Argentina/Buenos_Aires';

// Horarios base fallback (hora de Argentina)
// Se usan solo si no viene weeklySchedule desde publicConfig.
const OPENING = {
  0: { start: '11:00', end: '17:00' }, // Domingo
  1: { start: '11:00', end: '23:00' },
  2: { start: '11:00', end: '23:00' },
  3: { start: '11:00', end: '23:00' },
  4: { start: '11:00', end: '23:00' },
  5: { start: '11:00', end: '23:00' },
  6: { start: '11:00', end: '23:00' }, // Sábado
};

// Mínimo para considerar “tasa del día” (hora AR)
const UPDATE_READY_HM = '10:30';

const DOW_IDX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DOW_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function partsInBA(d = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const map = {};
  for (const p of fmt.formatToParts(d)) map[p.type] = p.value;

  const w = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(d);

  return {
    y: +map.year,
    m: +map.month,
    d: +map.day,
    h: +map.hour,
    min: +map.minute,
    dow: DOW_IDX[w],
  };
}

function hmToMin(hm) {
  const [h, m] = String(hm || '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function getFallbackScheduleForDow(dow) {
  const sch = OPENING[dow];
  if (!sch) return { active: false, from: '', to: '' };
  return {
    active: true,
    from: sch.start,
    to: sch.end,
  };
}

function normalizeWeeklySchedule(weeklySchedule) {
  const normalized = {};

  for (let dow = 0; dow < 7; dow++) {
    const key = DOW_KEYS[dow];
    const item = weeklySchedule?.[key];

    if (!item) {
      normalized[key] = getFallbackScheduleForDow(dow);
      continue;
    }

    normalized[key] = {
      active: Boolean(item.active),
      from: item.from || '',
      to: item.to || '',
    };
  }

  return normalized;
}

export function isOpenNowBA() {
  const n = partsInBA();
  const sch = OPENING[n.dow];
  if (!sch) return false;

  const mins = n.h * 60 + n.min;
  const start = hmToMin(sch.start);
  const end = hmToMin(sch.end);

  if (start == null || end == null) return false;
  return mins >= start && mins < end;
}

export function isOpenNowByScheduleBA(weeklySchedule) {
  const n = partsInBA();
  const normalized = normalizeWeeklySchedule(weeklySchedule);
  const dayKey = DOW_KEYS[n.dow];
  const rule = normalized[dayKey];

  if (!rule || !rule.active) return false;

  const start = hmToMin(rule.from);
  const end = hmToMin(rule.to);
  if (start == null || end == null) return false;

  const mins = n.h * 60 + n.min;
  return mins >= start && mins < end;
}

export function isRateFreshTodayBA(snapshotTs) {
  if (!snapshotTs) return false;

  const snap = partsInBA(new Date(snapshotTs));
  const now = partsInBA();

  if (snap.y !== now.y || snap.m !== now.m || snap.d !== now.d) return false;
  return (snap.h * 60 + snap.min) >= hmToMin(UPDATE_READY_HM);
}

export function evaluateOps(snapshotTs, manual) {
  const fresh = isRateFreshTodayBA(snapshotTs);

  const calculatorState = manual?.calculatorState || 'schedule';
  const weeklySchedule = normalizeWeeklySchedule(manual?.weeklySchedule);
  const manualMessage = String(manual?.message || '').trim();

  let open;
  let source;

  if (calculatorState === 'open') {
    open = true;
    source = 'manual_open';
  } else if (calculatorState === 'closed') {
    open = false;
    source = 'manual_closed';
  } else {
    open = isOpenNowByScheduleBA(weeklySchedule);
    source = 'schedule';
  }

  const allowWhats = open && fresh;

  const reasons = [];
  if (!open) {
    reasons.push(source === 'schedule' ? 'Fuera de horario' : 'Calculadora cerrada');
  }
  if (!fresh) {
    reasons.push('Tasa desactualizada');
  }

  return {
    open,
    fresh,
    allowWhats,
    source,
    calculatorState,
    weeklySchedule,
    message: manualMessage || reasons.join(' • '),
  };
}

// === Presentación “bonita” en hora local del usuario ===

function utcDateFromBA(parts, hm) {
  const [h, m] = String(hm || '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;

  // BA = UTC-3, sin DST
  return new Date(Date.UTC(parts.y, parts.m - 1, parts.d, h + 3, m));
}

export function openingTextTodayLocal(locale = navigator.language || 'es-ES', weeklySchedule = null) {
  const nowBA = partsInBA();
  const normalized = normalizeWeeklySchedule(weeklySchedule);
  const dayKey = DOW_KEYS[nowBA.dow];
  const rule = normalized[dayKey];

  if (!rule || !rule.active) return 'Hoy: cerrado';

  const startUTC = utcDateFromBA(nowBA, rule.from);
  const endUTC = utcDateFromBA(nowBA, rule.to);

  if (!startUTC || !endUTC) return 'Hoy: cerrado';

  const fmt = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `Horario de: ${fmt.format(startUTC)}–${fmt.format(endUTC)}`;
}