// public/src/state/quoteSession.js

import { QUOTE_MODULES } from "../core/quoteModes.js";

const initialSession = {
  module: null,
  step: "home",

  origen: null,
  destino: null,

  referenceType: null,
  remittanceMode: null,
  bcvReferenceType: null,

  amount: null,
  customBcvRate: null,

  result: null,
};

let session = { ...initialSession };
const listeners = new Set();

export function getQuoteSession() {
  return {
    ...session,
    result: session.result ? { ...session.result } : null,
  };
}

export function resetQuoteSession() {
  session = { ...initialSession };
  emitQuoteSession();
}

export function setQuoteSession(patch = {}) {
  session = {
    ...session,
    ...patch,
  };

  emitQuoteSession();
}

export function startQuoteModule(moduleId) {
  const nextStep =
    moduleId === QUOTE_MODULES.REFERENCES
      ? "reference_type"
      : moduleId === QUOTE_MODULES.RATE
        ? "origin"
        : moduleId === QUOTE_MODULES.REMITTANCE
          ? "origin"
          : "home";

  session = {
    ...initialSession,
    module: moduleId,
    step: nextStep,
  };

  emitQuoteSession();
}

export function goToQuoteStep(step) {
  session = {
    ...session,
    step,
  };

  emitQuoteSession();
}

export function clearQuoteResult() {
  session = {
    ...session,
    result: null,
  };

  emitQuoteSession();
}

export function onQuoteSessionChange(fn) {
  if (typeof fn !== "function") {
    return () => {};
  }

  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emitQuoteSession() {
  const snapshot = getQuoteSession();
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (err) {
      console.error("[quoteSession] listener error:", err);
    }
  });
}