# Roadmap — Dhemka Core / Remit

Este documento define el plan de avance de Dhemka Core / Remit.

No reemplaza a `ARCHITECTURE.md`.
No reemplaza a `DATA_CONTRACT.md`.

- `ARCHITECTURE.md` describe la organización actual del shell visual.
- `DATA_CONTRACT.md` define reglas futuras, entidades, roles, módulos y contratos conceptuales.
- `ROADMAP.md` define qué se hizo, qué sigue y qué queda para después.
- `CHANGELOG.md` registra los cambios importantes ya realizados.

---

## Documentation Maintenance Rule

Cada vez que se haga algo importante:

1. Actualizar `ROADMAP.md` si una tarea cambia de pendiente a completada, si aparece una nueva fase o si cambia la prioridad.
2. Actualizar `CHANGELOG.md` con lo que se hizo, en lenguaje claro.
3. No mezclar ideas sueltas dentro del contrato formal si todavía no son decisión.
4. Las ideas futuras deben ir a backlog/ideas cuando exista ese documento.
5. Las decisiones estructurales fuertes deben documentarse en `DATA_CONTRACT.md` o en ADRs futuros.

---

## Estado actual

Rama de trabajo:

- `feature/dhemka-core-shell`

Estado actual del producto:

- Dhemka Core Console existe como shell visual aislado.
- La consola usa mock data.
- No conecta backend real.
- No toca producción.
- No toca `server.js`.
- No toca snapshot real.
- No toca admin actual.
- No toca cotizador actual.
- No toca lógica financiera real.

Último objetivo completado:

- Documentar arquitectura, contrato de datos y enlazar ambos documentos.

---

## V0 — Architecture Shell

Estado: completed

Objetivo:

Crear una base visual y documental segura para Dhemka Core sin tocar el sistema real de ByteTransfer.

Tareas:

- [x] Crear carpeta `apps/core-console/`.
- [x] Crear shell visual inicial de Dhemka Core Console.
- [x] Usar solo mock data.
- [x] Modularizar `app.js`.
- [x] Separar state, utils, tenant selectors, tenant UI, surfaces, section renderer y panels.
- [x] Crear `ARCHITECTURE.md`.
- [x] Marcar visualmente la consola como `Prototype · Mock Data`.
- [x] Crear `DATA_CONTRACT.md`.
- [x] Relacionar `ARCHITECTURE.md` con `DATA_CONTRACT.md`.
- [x] Crear UI_ARCHITECTURE.md para fijar la jerarquía visual de Dhemka Core, Remit, Tenants y ramas futuras.
- [x] Mantener todo aislado dentro de `apps/core-console/`.

Resultado:

Dhemka Core ya tiene una primera base visual y documental para seguir creciendo sin contaminar producción.

---

## V1 — Mock Data aligned with Data Contract

Estado: next

Objetivo:

Actualizar la data simulada y la UI del Core Console para que representen mejor el contrato de datos definido.

Tareas:

- [ ] Revisar `apps/core-console/data/mock-data.js`.
- [ ] Agregar estados comerciales de tenant: `trial`, `active`, `past_due`, `paused`, `suspended`, `cancelled`, `archived`.
- [ ] Agregar módulos contratables por tenant.
- [ ] Mostrar Remit como producto/rama y ByteTransfer como tenant inicial.
- [ ] Representar que ByteTransfer no es infraestructura, solo tenant/caso real.
- [ ] Mostrar Quote Center separado de Public Calculator.
- [ ] Mostrar Remit sin Ledger vs Remit con Ledger.
- [ ] Agregar límites conceptuales de operación.
- [ ] Agregar roles conceptuales: CoreOwner, TenantAdmin, Manager, AccountHolder, Processor, Client.
- [ ] Mostrar auditoría conceptual.
- [ ] Mantener todo como mock data.

Reglas de seguridad:

- [ ] No conectar backend real.
- [ ] No tocar `server.js`.
- [ ] No tocar snapshot real.
- [ ] No tocar lógica financiera real.
- [ ] No tocar admin actual.
- [ ] No tocar cotizador actual.

---

## V2 — Core / Tenant Visual Separation

Estado: iniciado.

Avance actual:
- [x] Reorganizar sidebar principal por ramas de Dhemka Core.
- [x] Quitar Tenant Registry del dashboard global.
- [x] Mover Tenant Registry y Tenant Detail dentro de Remit.
- [x] Mantener ByteTransfer únicamente dentro de Remit > Tenants.
- [x] Cambiar Environment de Production a Mock Prototype.
- [x] Documentar jerarquia Remit > Tenants > Tenant > Recursos.
- [x] Crear subnavegación interna formal para Remit.
- [x] Implementar tenant registry como accordion inline.
- [x] Pulir workspace inline del tenant con resource launcher, setup signals y conteo correcto de módulos.
- [ ] Crear subnavegación interna formal para Core Platform.
- [ ] Convertir ramas futuras en placeholders más limpios.

Estado: future

Objetivo:

Hacer que la consola muestre con claridad qué pertenece a Core, qué pertenece a Remit y qué pertenece al Tenant.

Tareas:

- [ ] Crear vista o sección más clara para Core Platform.
- [ ] Crear vista o sección más clara para Remit.
- [ ] Crear vista o sección para Tenant Detail.
- [ ] Separar visualmente configuración Core vs configuración Tenant.
- [ ] Mostrar qué datos son solo lectura para TenantAdmin.
- [ ] Mostrar qué datos solo puede configurar Core.
- [ ] Mostrar módulos habilitados y no habilitados.
- [ ] Mostrar estado comercial del tenant.

---

## V3 — Core Platform / Market Engine Blueprint

Goal: turn Core Platform into the visible heart of Dhemka Core.

### Approved direction

- [x] Define Core Platform as the heart of Dhemka Core.
- [x] Define Core Market Engine / Core Pricing Engine as the crown jewel.
- [x] Document no-hardcode rule for currencies, countries, routes, sources, providers, modules and tenant behavior.
- [x] Document implementation debate protocol before building features.
- [x] Define Core Intelligence Universe vs Tenant Operational Feed.
- [x] Define Binance as primary tenant-grade source for Remit and Bybit as complementary source.
- [x] Define Taker Opportunity Scanner as first opportunity mode and Maker Strategy as future module.
- [ ] Rework Core Platform UI around internal subnavigation.
- [ ] Replace old separated Operational Base / Quote Engine / Monitoring mental model with a unified Core Platform model.
- [ ] Add Market Engine overview.
- [ ] Add Source Network view.
- [ ] Add Cross Engine view.
- [ ] Add Opportunity Engine placeholder.
- [ ] Add Runtime / Workers view.
- [ ] Add Health view.
- [ ] Add Audit view.
- [ ] Keep current engine mock honest while pointing toward the future architecture.

### Future priority after mock

- Currency catalog.
- Market/country catalog.
- Source catalog.
- Provider adapter contracts.
- Route catalog.
- Confidence model.
- Opportunity signal model.
- Tenant market feed model.

## V4 — Auth / Identity Design

Estado: future

Objetivo:

Diseñar login, usuarios, roles y permisos antes de implementar autenticación real.

Tareas:

- [ ] Crear documento futuro `AUTH_RBAC.md`.
- [ ] Definir flujo de creación de CoreOwner.
- [ ] Definir creación de TenantAdmin.
- [ ] Definir invitación o contraseña temporal.
- [ ] Definir cambio obligatorio de contraseña.
- [ ] Definir reset de contraseña.
- [ ] Definir roles y permisos reales.
- [ ] Definir soporte de Core con auditoría.
- [ ] Definir qué puede ver y hacer cada rol.
- [ ] Definir qué acciones deben auditarse.

---

## V5 — API Contract Design

Estado: future

Objetivo:

Diseñar endpoints reales antes de tocar backend.

Tareas:

- [ ] Crear documento futuro `API_CONTRACT.md`.
- [ ] Definir endpoints Core.
- [ ] Definir endpoints Tenant.
- [ ] Definir endpoints Remit.
- [ ] Definir endpoints Public.
- [ ] Definir endpoints Ledger futuros.
- [ ] Definir request/response por endpoint.
- [ ] Definir errores y permisos.
- [ ] Definir qué endpoints son mock, futuros o reales.

---

## V6 — Real Tenant Foundation

Estado: future

Objetivo:

Preparar el primer paso real hacia multi-tenant sin romper producción.

Tareas:

- [ ] Definir estrategia de almacenamiento.
- [ ] Definir si se usa base actual, nueva tabla o nuevo store.
- [ ] Definir cómo crear tenant real sin afectar ByteTransfer actual.
- [ ] Definir migración segura.
- [ ] Crear tenant real inicial: ByteTransfer.
- [ ] Mantener ByteTransfer como tenant, no como infraestructura.
- [ ] Validar separación Core / Tenant.
- [ ] Mantener rollback posible.

---

## V7 — Remit MVP

Estado: future

Objetivo:

Construir la primera versión real de Remit como producto usable por tenants.

Tareas:

- [ ] Login real para TenantAdmin.
- [ ] Login real para gestores.
- [ ] Centro de Cotizaciones interno.
- [ ] Cotizaciones asociadas a gestor.
- [ ] Shares con branding del tenant.
- [ ] Métricas por gestor.
- [ ] Límites mínimos/máximos.
- [ ] Horarios por tenant.
- [ ] Mensajes operativos por tenant.
- [ ] Calculadora pública simple.
- [ ] Links públicos asociados a gestor.
- [ ] Contacto por WhatsApp desde calculadora pública.

---

## V8 — Remit Operations

Estado: future

Objetivo:

Separar cotización de operación real.

Tareas:

- [ ] Quote pendiente.
- [ ] Cliente paga.
- [ ] Gestor reporta monto real recibido.
- [ ] Gestor indica banco/cuenta/exchange/efectivo.
- [ ] TenantAdmin revisa.
- [ ] TenantAdmin aprueba o rechaza.
- [ ] Processor ejecuta salida si aplica.
- [ ] Confirmar salida.
- [ ] Cerrar operación.
- [ ] Calcular utilidad y comisiones si Ledger está activo.

---

## V9 — Ledger / Accounts

Estado: future

Objetivo:

Crear módulo de cuentas, saldos, movimientos, gastos y conciliación.

Tareas:

- [ ] Definir cuentas.
- [ ] Definir bancos.
- [ ] Definir exchanges.
- [ ] Definir billeteras.
- [ ] Definir efectivo.
- [ ] Definir movimientos.
- [ ] Definir gastos operativos.
- [ ] Definir ganancia neta del tenant.
- [ ] Definir owner allocation.
- [ ] Definir cierre semanal de comisiones.
- [ ] Integrar con Remit Operations.

---

## V10 — Partner Network / Partner Liquidity

Estado: future

Objetivo:

Permitir que tenants o aliados externos usen cobertura/cuentas/liquidez de otros.

Tareas:

- [ ] Definir aliados internos.
- [ ] Definir aliados externos.
- [ ] Definir porcentajes configurables.
- [ ] Definir cuentas compartidas.
- [ ] Definir tenant solicitante.
- [ ] Definir tenant proveedor.
- [ ] Definir receptor real.
- [ ] Definir saldo/deuda entre partes.
- [ ] Definir liquidación y auditoría.

---

## V11 — Advanced Modules

Estado: future

Objetivo:

Preparar ramas futuras de Dhemka Core.

Tareas:

- [ ] Lending.
- [ ] Arbitrage / Opportunities.
- [ ] CRM / ClientProfile.
- [ ] Billing avanzado.
- [ ] Comunidad/red de tenants.
- [ ] Workers/cron globales.
- [ ] Notificaciones operativas.

---

## Current Safety Rule

Mientras Dhemka Core esté en construcción:

- no tocar `main`
- no hacer merge a producción
- no tocar `server.js` sin fase aprobada
- no tocar snapshot real
- no tocar lógica financiera real
- no tocar admin actual
- no tocar cotizador actual
- no usar `git add .`
- trabajar por archivos específicos
- validar cada bloque antes de avanzar
