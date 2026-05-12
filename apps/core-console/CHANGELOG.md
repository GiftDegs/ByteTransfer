# Changelog — Dhemka Core / Remit

Este documento registra cambios importantes realizados en Dhemka Core / Remit.

No reemplaza a Git.  
Git guarda el historial técnico.  
Este changelog explica en lenguaje claro qué cambió y por qué importa.

---

## Documentation Maintenance Rule

Cada vez que se haga algo importante:

1. Actualizar `ROADMAP.md` si una tarea cambia de pendiente a completada, si aparece una nueva fase o si cambia la prioridad.
2. Actualizar `CHANGELOG.md` con lo que se hizo, en lenguaje claro.
3. Mantener el changelog enfocado en cambios relevantes.
4. No registrar cada microcambio si no aporta contexto.
5. Registrar siempre cambios de arquitectura, contrato, seguridad, flujo, módulos, permisos o datos.

---

## 2026-05-12

### Added

- Se creó `apps/core-console/DATA_CONTRACT.md`.
- Se documentó el contrato inicial de datos entre Dhemka Core, Remit, Tenants, módulos futuros y experiencias públicas.
- Se definió Dhemka Core como plataforma madre.
- Se definió Remit como rama/producto de remesas.
- Se definió ByteTransfer como primer tenant real dentro de Remit, no como infraestructura central.
- Se documentaron módulos futuros: Ledger / Accounts, Lending, Arbitrage / Opportunities, Partner Network, CRM / ClientProfile, Billing e Identity.
- Se documentaron roles conceptuales: CoreOwner, TenantAdmin, Manager / Gestor, AccountHolder / Receiver, Processor / Operator y Client / Public User.
- Se documentó la separación entre Quote Center y Public Calculator.
- Se documentó el flujo conceptual de Quote hacia Operation.
- Se documentó la diferencia entre Remit sin Ledger y Remit con Ledger.
- Se documentaron estados conceptuales de Quote y Operation.
- Se documentaron límites mínimos/máximos de operación por tenant, cruce, moneda o equivalente USDT/USD.
- Se documentaron reglas futuras de comisiones, elegibilidad de comisiones y cierre semanal.
- Se documentó la separación entre ganancia del tenant y owner allocation.
- Se documentó Partner Network / Partner Liquidity como módulo futuro.
- Se documentaron reglas de auditoría obligatoria.
- Se documentaron endpoints conceptuales futuros.
- Se documentó un catálogo inicial de entidades conceptuales.

### Changed

- Se actualizó `apps/core-console/ARCHITECTURE.md` para referenciar `DATA_CONTRACT.md`.
- Se dejó clara la diferencia entre:
  - `ARCHITECTURE.md`: organización actual del shell visual.
  - `DATA_CONTRACT.md`: reglas futuras antes de conectar backend real.

### Safety

- No se tocó `main`.
- No se hizo merge.
- No se tocó producción.
- No se tocó `server.js`.
- No se tocó snapshot real.
- No se tocó lógica financiera real.
- No se tocó admin actual.
- No se tocó cotizador actual.
- Todo quedó dentro de `apps/core-console/`.
- Los cambios fueron subidos a `origin/feature/dhemka-core-shell`.

### Commits

- `05020ca` — Documentar contrato de datos Core Tenant.
- `c819460` — Relacionar arquitectura con contrato de datos.

---

## Previous foundation

### Added

- Se creó `apps/core-console/` como shell visual de Dhemka Core.
- Se creó mock data para representar la consola sin datos reales.
- Se modularizó la consola.
- Se creó `apps/core-console/ARCHITECTURE.md`.
- Se agregó badge visible `Prototype · Mock Data`.
- Se dejó `app.js` como archivo limpio de arranque/control.
- Se separaron módulos de state, utils, tenants, UI, surfaces y panels.

### Safety

- La Core Console quedó aislada del backend real.
- La Core Console no lee Postgres.
- La Core Console no lee snapshots reales.
- La Core Console no consume Binance, BCV ni PTAX reales.
- La Core Console no modifica producción.
