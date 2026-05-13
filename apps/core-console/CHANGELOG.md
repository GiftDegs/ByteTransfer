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
- Se documentó Core Platform como el corazón de Dhemka Core.
- Se definió Core Market Engine / Core Pricing Engine como la joya principal de la plataforma.
- Se estableció que el nuevo sistema no debe depender de monedas, países, cruces, providers, módulos ni reglas hardcodeadas.
- Se documentó que todo debe venir de contratos, catálogos, fuentes, motor, configuración, tenant o módulos.
- Se agregó protocolo obligatorio de debate antes de implementar nuevas funciones.
- Se documentó una visión futura para fuentes oficiales, P2P, exchanges, stables, normalización, confidence engine, cross engine, opportunity engine, tenant feeds, runtime y audit.
- Se creó backlog de ideas para expansión del motor.

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
- Se creó apps/core-console/UI_ARCHITECTURE.md para definir la jerarquía visual de Dhemka Core Console.
- Se estableció que ByteTransfer no debe aparecer como protagonista global y debe vivir únicamente dentro de Remit > Tenants, salvo alertas o eventos accionables.
- Se documentó que cada rama principal debe tener su propio dashboard y navegación interna.
- Se documentó que el dashboard principal de Dhemka Core debe priorizar salud del motor, ramas activas, alertas, vencimientos, problemas críticos y acciones pendientes.

### Changed

- Se estableció que las cards no son la solución visual por defecto.
- Se agregó regla obligatoria de debate de jerarquía y patrón UI antes de implementar pantallas, módulos, paneles o estructuras visuales.
- Se definió que cada revisión de UI debe incluir sugerencias de mejora futura cuando el mock funcione pero todavía pueda evolucionar a un patrón más correcto.

- Se definió la separación Core Intelligence Universe vs Tenant Operational Feed: Core puede comparar muchas fuentes, pero tenants reciben solo fuentes aprobadas y limpias.
- Se definió Binance P2P como fuente primaria tenant-grade para Remit y Bybit P2P como fuente complementaria para rutas base o huecos de cobertura.
- Se definió que Opportunities sugiere revisión de fuentes/exchanges, no ejecución automática.
- Se dejó Maker Strategy Simulator / Maker Arbitrage como idea futura, priorizando primero Taker Opportunity Scanner.

- Se reorganizó la sidebar principal para separar Command, Platform, Products y System.
- Se reemplazó la navegación anterior de Core Modules por ramas principales de Dhemka Core.
- Se quitó Active Tenant y Tenant Switcher de la sidebar global.
- Se movió Tenant Registry y Tenant Detail dentro de la rama Remit.
- Se evitó que ByteTransfer aparezca como protagonista del dashboard principal.
- Se cambió Environment de Production a Mock Prototype para evitar confusión con producción real.
- Se agregó render contextual para mostrar paneles específicos según la rama activa.
- Se documentó que Remit administra tenants y que cada tenant contiene sus propios recursos: Quote Center, Public Calculator, Branding, Users, Margins, Limits, Operations, Billing y Audit.
- Se documentó que las vistas transversales de Quote Centers o Public Calculators pueden existir como monitoreo, pero no deben ser el flujo principal de navegación.
- Se implementó el tenant registry como accordion inline: la fila completa abre/cierra el workspace del tenant, con cierre por X y despliegue contextual debajo del tenant seleccionado.
- Se pulió el workspace inline del tenant con resumen operativo, setup signals, resource launcher y acciones más realistas por recurso.
- Se corrigió el conteo de módulos habilitados para soportar modules como objeto en el mock data.
- Se pulió el workspace inline del tenant con resumen operativo, setup signals, resource launcher y acciones más realistas por recurso.
- Se corrigió el conteo de módulos habilitados para soportar modules como objeto en el mock data.

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
