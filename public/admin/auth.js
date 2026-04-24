"use strict";

// =====================================================
// AUTH
// =====================================================
function getAdminKey() {
  return sessionStorage.getItem("BT_ADMIN_KEY") || "";
}

function setAdminKey(key) {
  sessionStorage.setItem("BT_ADMIN_KEY", key);
}

function clearAdminKey() {
  sessionStorage.removeItem("BT_ADMIN_KEY");
}

function ensureAuthModal() {
  if (document.getElementById("bt-auth-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "bt-auth-overlay";
  overlay.className =
    "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4";

  overlay.innerHTML = `
    <div class="w-full max-w-md rounded-3xl overflow-hidden border border-white/10 bg-white dark:bg-slate-950 shadow-2xl">
      <div class="px-6 py-5 bg-slate-950 text-white dark:bg-slate-900">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-lg font-semibold tracking-tight">ByteTransfer Admin</div>
            <div class="text-sm opacity-80 mt-1">Acceso restringido</div>
          </div>
          <img src="/logo.png" alt="ByteTransfer" class="h-10 w-10 rounded-xl bg-white/10 p-1.5 object-contain" />
        </div>
      </div>

      <div class="p-6">
        <label class="text-sm font-medium text-slate-700 dark:text-slate-200">Admin Key</label>

        <div class="mt-2 relative">
          <input
            id="bt-auth-key"
            type="password"
            class="w-full pr-12 px-4 py-3 rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••••••••"
            autocomplete="current-password"
          />

          <button
            id="bt-auth-toggle"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-300"
            aria-label="Mostrar clave"
          >
            <svg id="bt-eye-open" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
              <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
            </svg>
            <svg id="bt-eye-closed" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" class="hidden">
              <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18"/>
              <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 1.42-.36"/>
              <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9.88 5.09A10.3 10.3 0 0 1 12 5c6.5 0 10 7 10 7a17.5 17.5 0 0 1-4.2 5.1"/>
              <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6.11 6.11C3.8 8 2 12 2 12s3.5 7 10 7c1.1 0 2.1-.17 3.02-.49"/>
            </svg>
          </button>
        </div>

        <div id="bt-auth-error" class="mt-3 text-sm text-red-600 hidden"></div>

        <div class="mt-5 flex items-center justify-between gap-3">
          <button
            id="bt-auth-clear"
            class="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
          >
            Limpiar
          </button>
          <button
            id="bt-auth-submit"
            class="px-5 py-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = overlay.querySelector("#bt-auth-key");
  const toggle = overlay.querySelector("#bt-auth-toggle");
  const eyeOpen = overlay.querySelector("#bt-eye-open");
  const eyeClosed = overlay.querySelector("#bt-eye-closed");

  overlay.querySelector("#bt-auth-clear").addEventListener("click", () => {
    input.value = "";
    hideAuthError();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") overlay.querySelector("#bt-auth-submit").click();
  });

  toggle.addEventListener("click", () => {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    eyeOpen.classList.toggle("hidden", !showing);
    eyeClosed.classList.toggle("hidden", showing);
  });
}

function showAuthError(msg) {
  const el = document.getElementById("bt-auth-error");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideAuthError() {
  const el = document.getElementById("bt-auth-error");
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
}

function lockUI() {
  ensureAuthModal();
  document.getElementById("bt-auth-overlay")?.classList.remove("hidden");
}

function unlockUI() {
  document.getElementById("bt-auth-overlay")?.classList.add("hidden");
}

async function verifyAdminKey(key) {
  const res = await fetch("/api/admin/verify", {
    method: "GET",
    headers: { "x-admin-key": key },
    cache: "no-store",
  });

  if (res.ok) return { ok: true };

  const j = await res.json().catch(() => null);
  return { ok: false, status: res.status, error: j?.error || `HTTP ${res.status}` };
}

async function requireAdminAccess() {
  lockUI();

  const existing = getAdminKey();
  if (existing) {
    const v = await verifyAdminKey(existing);
    if (v.ok) {
      unlockUI();
      return true;
    }
    clearAdminKey();
  }

  const btn = document.getElementById("bt-auth-submit");
  const input = document.getElementById("bt-auth-key");

  return await new Promise((resolve) => {
    btn.addEventListener("click", async () => {
      hideAuthError();
      const key = (input.value || "").trim();
      if (!key) return showAuthError("Ingresa la clave.");

      btn.disabled = true;
      btn.textContent = "Verificando...";

      const v = await verifyAdminKey(key);

      btn.disabled = false;
      btn.textContent = "Entrar";

      if (!v.ok) {
        if (v.status === 503) {
          return showAuthError("Admin deshabilitado: falta configurar ADMIN_KEY.");
        }
        return showAuthError("Clave incorrecta.");
      }

      setAdminKey(key);
      unlockUI();
      resolve(true);
    });
  });
}