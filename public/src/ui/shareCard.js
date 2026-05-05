// public/src/ui/shareCard.js

import {
  SHARE_PAYLOAD_TYPES,
  formatShareNumber,
  formatShareValue,
} from "../core/sharePayload.js";

export function renderShareCard(payload) {
  if (!payload) return "";

  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const dense = rows.length >= 4;

  return `
    <div
      data-share-card="1"
      class="relative h-[1080px] w-[1080px] overflow-hidden bg-slate-950 text-white"
      style="font-family: Poppins, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;"
    >
      <div class="absolute inset-0">
        <div class="absolute -top-56 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#1F6BFF]/35 blur-3xl"></div>
        <div class="absolute -bottom-56 right-[-120px] h-[620px] w-[620px] rounded-full bg-[#13E6C6]/20 blur-3xl"></div>
        <div class="absolute inset-0 opacity-[0.12]"
          style="background-image: linear-gradient(rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.22) 1px, transparent 1px); background-size: 56px 56px;">
        </div>
      </div>

      <div class="relative z-10 flex h-full flex-col px-20 py-14">
        ${renderShareHeader(payload)}

        <main class="mt-10 flex flex-1 flex-col justify-center">
          ${renderShareMain(payload, dense)}
          ${rows.length ? renderRows(rows, dense) : ""}
          ${payload.disclaimer ? renderDisclaimer(payload.disclaimer, dense) : ""}
        </main>

        ${renderShareFooter(payload, dense)}
      </div>
    </div>
  `;
}

export function ensureShareCardHost() {
  let host = document.getElementById("shareCardHost");

  if (!host) {
    host = document.createElement("div");
    host.id = "shareCardHost";
    host.className = "fixed left-[-9999px] top-0 z-[-1] pointer-events-none";
    document.body.appendChild(host);
  }

  return host;
}

export function mountShareCard(payload) {
  const host = ensureShareCardHost();
  host.innerHTML = renderShareCard(payload);
  return host.querySelector("[data-share-card]");
}

function renderShareHeader(payload) {
  return `
    <header class="flex items-center justify-between gap-8">
      <div class="flex items-center gap-5">
        <div class="grid h-20 w-20 place-items-center rounded-[28px] border border-white/10 bg-white/10 shadow-2xl">
          <img src="/logo.png" alt="ByteTransfer" class="h-12 w-12 object-contain" />
        </div>

        <div>
          <div class="text-4xl font-black tracking-tight">
            ${escapeHtml(payload.brand || "ByteTransfer")}
          </div>
          <div class="mt-1 text-lg font-semibold tracking-[0.24em] text-[#13E6C6] uppercase">
            ${getTypeLabel(payload.type)}
          </div>
        </div>
      </div>

      <div class="rounded-full border border-white/10 bg-white/10 px-6 py-3 text-base font-bold text-slate-200">
        Cotización oficial
      </div>
    </header>
  `;
}

function renderShareMain(payload, dense = false) {
  return `
    <section class="rounded-[44px] border border-white/10 bg-white/[0.075] ${dense ? "p-8" : "p-10"} shadow-2xl backdrop-blur-xl">
      <div class="text-center">
        <div class="${dense ? "text-xl" : "text-2xl"} font-bold uppercase tracking-[0.24em] text-[#13E6C6]">
          ${escapeHtml(payload.title || "Cotización")}
        </div>

        ${payload.subtitle ? `
          <div class="${dense ? "mt-5 text-[48px]" : "mt-6 text-5xl"} font-black leading-tight tracking-tight">
            ${escapeHtml(payload.subtitle)}
          </div>
        ` : ""}

        <div class="${dense ? "mt-6 rounded-[32px] px-8 py-7" : "mt-8 rounded-[36px] px-10 py-9"} border border-[#13E6C6]/25 bg-[#13E6C6]/10">
          <div class="${dense ? "text-lg" : "text-xl"} font-bold uppercase tracking-[0.22em] text-[#13E6C6]">
            ${escapeHtml(payload.primaryLabel || "Resultado")}
          </div>

          <div class="${dense ? "mt-4 text-6xl" : "mt-5 text-7xl"} font-black leading-none tracking-tight">
            ${formatShareNumber(payload.primaryValue)}
          </div>

          ${payload.primaryUnit ? `
            <div class="${dense ? "mt-4 text-[28px]" : "mt-5 text-3xl"} font-bold text-slate-200">
              ${escapeHtml(payload.primaryUnit)}
            </div>
          ` : ""}
        </div>
      </div>
    </section>
  `;
}

function renderRows(rows, dense = false) {
  return `
    <section class="${dense ? "mt-4" : "mt-6"} grid grid-cols-1 ${dense ? "gap-2" : "gap-3"}">
      ${rows.map((row) => renderRow(row, dense)).join("")}
    </section>
  `;
}

function renderRow(row, dense = false) {
  return `
    <div class="flex items-center justify-between gap-6 rounded-[28px] border border-white/10 bg-black/20 ${dense ? "px-6 py-4" : "px-7 py-5"}">
      <div class="${dense ? "text-lg" : "text-xl"} font-bold text-slate-400">
        ${escapeHtml(row.label || "")}
      </div>

      <div class="text-right ${dense ? "text-xl" : "text-2xl"} font-black text-white">
        ${escapeHtml(formatShareValue(row))}
      </div>
    </div>
  `;
}

function renderDisclaimer(disclaimer, dense = false) {
  return `
    <div class="${dense ? "mt-5 px-6 py-4 text-lg" : "mt-8 px-8 py-5 text-xl"} rounded-[28px] border border-amber-300/20 bg-amber-300/10 text-center font-bold text-amber-100">
      ${escapeHtml(disclaimer)}
    </div>
  `;
}

function renderShareFooter(payload, dense = false) {
  const leftLabel = payload.footerLeftLabel || "Actualizado";
  const leftValue = payload.footerLeftValue || payload.updatedAt || "Fecha no disponible";
  const rightLabel = payload.footerRightLabel || "";
  const rightValue = payload.footerRightValue || "Fecha no disponible";
  const hasRightFooter = Boolean(rightLabel);

  return `
    <footer class="${dense ? "mt-5 pt-4" : "mt-8 pt-6"} flex items-end ${
      hasRightFooter ? "justify-between" : "justify-start"
    } gap-8 border-t border-white/10">
      <div>
        <div class="${dense ? "text-xs" : "text-sm"} font-semibold uppercase tracking-[0.18em] text-slate-500">
          ${escapeHtml(leftLabel)}
        </div>
        <div class="${dense ? "mt-1 text-lg" : "mt-2 text-xl"} font-black text-white">
          ${escapeHtml(leftValue)}
        </div>
      </div>

      ${
        hasRightFooter
          ? `<div class="text-right">
              <div class="${dense ? "text-xs" : "text-sm"} font-semibold uppercase tracking-[0.18em] text-slate-500">
                ${escapeHtml(rightLabel)}
              </div>
              <div class="${dense ? "mt-1 text-lg" : "mt-2 text-xl"} font-black text-white">
                ${escapeHtml(rightValue)}
              </div>
            </div>`
          : ""
      }
    </footer>
  `;
}

function getTypeLabel(type) {
  if (type === SHARE_PAYLOAD_TYPES.REFERENCE) return "Referencia";
  if (type === SHARE_PAYLOAD_TYPES.RATE) return "Tasa";
  if (type === SHARE_PAYLOAD_TYPES.REMITTANCE) return "Remesa";
  return "Consulta";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
