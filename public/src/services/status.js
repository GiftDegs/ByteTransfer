// public/src/services/status.js

async function fetchSnapshotPublicConfig() {
  const res = await fetch('/api/snapshot?ts=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  return data?.publicConfig || null;
}

export async function obtenerStatus() {
  // Overrides locales de prueba siguen teniendo prioridad máxima
  const forceOpen = localStorage.getItem('bt_force_open') === '1';
  const forceClosed = localStorage.getItem('bt_force_closed') === '1';

  if (forceOpen || forceClosed) {
    return {
      source: 'local_override',
      calculatorState: forceOpen && !forceClosed ? 'open' : 'closed',
      open: forceOpen && !forceClosed,
      message: forceOpen ? 'Apertura manual (test)' : 'Cierre manual (test)',
      weeklySchedule: null,
    };
  }

  // Compatibilidad temporal con el modo anterior
  const legacyMode = localStorage.getItem('bt_status_mode') || 'off';

  // NUEVA fuente principal: snapshot.publicConfig
  try {
    const publicConfig = await fetchSnapshotPublicConfig();

    if (publicConfig) {
      const calculatorState = publicConfig?.calculatorState || 'schedule';
      const message = String(publicConfig?.message || '').trim();
      const weeklySchedule = publicConfig?.weeklySchedule || null;

      const open =
        calculatorState === 'open'
          ? true
          : calculatorState === 'closed'
            ? false
            : null;

      return {
        source: 'snapshot_public_config',
        calculatorState,
        open,
        message,
        weeklySchedule,
      };
    }
  } catch (err) {
    console.warn('No se pudo leer publicConfig desde snapshot:', err);
  }

  // === Fallbacks viejos, por si todavía los necesitas ===
  if (legacyMode === 'off') {
    return {
      source: 'legacy_off',
      calculatorState: 'schedule',
      open: null,
      message: '',
      weeklySchedule: null,
    };
  }

  if (legacyMode === 'static') {
    try {
      const res = await fetch('/status.json?ts=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();

      const open = typeof data?.open === 'boolean' ? data.open : null;

      return {
        source: 'legacy_static',
        calculatorState: open === true ? 'open' : open === false ? 'closed' : 'schedule',
        open,
        message: data?.message || '',
        weeklySchedule: null,
      };
    } catch {
      return {
        source: 'legacy_static_error',
        calculatorState: 'schedule',
        open: null,
        message: '',
        weeklySchedule: null,
      };
    }
  }

  if (legacyMode === 'api') {
    try {
      const res = await fetch('/api/status?ts=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();

      const open = typeof data?.open === 'boolean' ? data.open : null;

      return {
        source: 'legacy_api',
        calculatorState: open === true ? 'open' : open === false ? 'closed' : 'schedule',
        open,
        message: data?.message || '',
        weeklySchedule: null,
      };
    } catch {
      return {
        source: 'legacy_api_error',
        calculatorState: 'schedule',
        open: null,
        message: '',
        weeklySchedule: null,
      };
    }
  }

  return {
    source: 'fallback',
    calculatorState: 'schedule',
    open: null,
    message: '',
    weeklySchedule: null,
  };
}