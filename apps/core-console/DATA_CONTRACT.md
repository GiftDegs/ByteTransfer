# Data Contract — Dhemka Core / Remit v0.1

Este documento define el contrato inicial de datos entre Dhemka Core, Remit, Tenants, módulos futuros y experiencias públicas.

No es una implementación técnica todavía.  
No conecta backend real.  
No modifica `server.js`.  
No modifica snapshots reales.  
No toca producción.

Su objetivo es evitar que Dhemka Core nazca como un parche encima de ByteTransfer y asegurar que la arquitectura crezca separada, vendible y escalable.

---

## 1. Product Hierarchy

Jerarquía conceptual:

Dhemka Core
└── Remit
    └── ByteTransfer

### Dhemka Core

Dhemka Core es la plataforma madre.

Controla la base operativa, permisos globales, tenants, módulos, salud del sistema, auditoría y configuración superior.

Core no es una remesadora.  
Core es la arquitectura donde pueden correr distintos productos y tenants.

### Remit

Remit es la rama/producto de Dhemka Core especializada en negocios de remesas.

Remit maneja:

- tenants remeseros
- centro de cotizaciones interno
- calculadora pública simple
- cotizaciones
- operaciones de remesa
- márgenes
- horarios
- mensajes operativos
- shares
- gestores
- receptores
- permisos comerciales del tenant

### ByteTransfer

ByteTransfer es el primer tenant real dentro de Remit.

ByteTransfer no debe tratarse como el centro del sistema.  
Debe tratarse como el primer caso probado que corre dentro de Dhemka Core / Remit.

---

## 2. Future Product Modules

Dhemka Core debe contemplar módulos futuros separados pero conectables.

### Remit

Sistema para remeseros y casas de cambio.

### Ledger / Accounts

Sistema de cuentas, saldos, bancos, billeteras, exchanges, efectivo, entradas, salidas, gastos y conciliación.

Puede funcionar solo o integrado con Remit, Lending, Partner Network y otros módulos.

### Lending

Sistema para prestamistas.

Puede manejar:

- deudores
- préstamos
- intereses
- cuotas
- garantías
- pagos
- mora
- deuda pendiente

Puede funcionar solo o conectado con Ledger.

### Arbitrage / Opportunities

Módulo futuro para detectar oportunidades.

Puede analizar:

- precios de providers
- balances
- liquidez
- spreads
- necesidades de fondeo
- oportunidades de compra/venta
- recomendaciones de balanceo

### Partner Network / Partner Liquidity

Módulo futuro para que tenants o aliados externos puedan usar cobertura, cuentas o liquidez de otros.

Puede manejar:

- tenant solicitante
- tenant proveedor
- aliado externo
- cuenta utilizada
- porcentaje cobrado
- porcentaje pagado a receptor
- utilidad del tenant proveedor
- saldo/deuda entre aliados

### CRM / ClientProfile

Módulo futuro para clientes finales, leads, contactos, historial de solicitudes y relación con gestores.

### Billing

Módulo para planes, pagos, vencimientos, estado comercial del tenant y módulos contratados.

### Identity

Sistema global de usuarios, roles, permisos, login, sesiones, resets de contraseña y seguridad.

---

## 3. Core vs Tenant Boundary

Principio rector:

Core controla la verdad operativa base.  
Tenant controla la operación comercial sobre esa base.

### Core Owns

Core controla:

- tenants
- módulos habilitados
- branding provisioning
- permisos globales
- roles base
- motor base
- providers
- snapshots base
- polling
- health checks
- runtime info
- auditoría global
- configuración global de proveedores
- estado comercial del tenant
- acceso de soporte
- vencimientos y planes
- reglas superiores del sistema

### Tenant Owns

Tenant controla:

- usuarios gestores
- horarios operativos
- mensajes operativos
- márgenes comerciales
- límites de operación
- configuración comercial
- historial propio
- cotizaciones propias
- operaciones propias, si el módulo operativo está activo
- reglas internas permitidas por Core

### Tenant Does Not Own

Tenant no puede modificar:

- provider configuration
- snapshot Core
- motor base
- polling global
- reglas globales
- health/runtime
- módulos contratados
- branding directamente
- acceso a otros tenants
- auditoría global

---

## 4. Branding Rule

El branding pertenece visualmente al tenant, pero se configura desde Core.

El remesero puede entregar:

- nombre comercial
- logo
- colores
- datos públicos
- textos comerciales
- estilo visual deseado

Pero no puede modificar branding directamente desde su panel normal.

Core configura:

- branding del admin tenant
- branding del centro de cotizaciones
- branding de calculadora pública
- branding de shares
- presencia `Powered by Dhemka Core`
- paleta visual permitida

Esto permite vender personalización como extra y evita que cada tenant rompa su identidad visual.

---

## 5. Tenant Commercial Status

Estados comerciales posibles del tenant:

- `trial`
- `active`
- `past_due`
- `paused`
- `suspended`
- `cancelled`
- `archived`

No se recomienda usar `deleted` como estado normal.

`archived` significa que el tenant dejó de operar, pero su historial se conserva.

---

## 6. Tenant Module Access

Core puede activar o desactivar módulos por tenant.

Ejemplo:

- `remit_quote_center`
- `public_calculator`
- `shares`
- `remit_operations`
- `ledger`
- `lending`
- `partner_network`
- `arbitrage_opportunities`
- `crm_client_profile`
- `billing`

El tenant no puede activar módulos por sí mismo.

---

## 7. Roles

### CoreOwner

Usuario superior de Dhemka Core.

Puede:

- crear tenants
- pausar tenants
- suspender tenants
- archivar tenants
- configurar branding
- habilitar módulos
- ver salud global
- ver pagos y vencimientos
- ver configuración de márgenes de tenants
- entrar como soporte
- revisar auditoría global

Todo acceso de soporte a un tenant debe quedar auditado.

### TenantAdmin

Administrador del tenant/remesero.

Puede:

- crear gestores
- suspender gestores
- eliminar gestores
- enviar reset de contraseña
- ver precios base Core en solo lectura
- ver cruces base en solo lectura
- ver cotizaciones por gestor
- ver actividad de gestores
- aprobar operaciones, si el módulo operativo está activo
- configurar márgenes
- configurar horarios
- configurar mensajes operativos
- configurar límites de operación
- ver historial propio

No puede:

- ver contraseñas
- cambiar branding directamente
- tocar providers
- tocar snapshots Core
- tocar motor base
- tocar reglas globales
- activar módulos no contratados

### Manager / Gestor

Usuario interno del tenant que usa el Centro de Cotizaciones.

Puede:

- entrar con usuario y contraseña
- usar el centro de cotizaciones
- generar cotizaciones
- generar shares dentro de horario
- compartir shares
- ver tasa final comercial
- usar calculadora interna del centro
- quedar asociado a métricas de volumen y conversión

Si Remit Operations / Ledger está activo y tiene permiso:

- reportar monto real recibido
- indicar banco/cuenta/exchange/efectivo de entrada
- enviar operación a revisión del admin

Por defecto no ve:

- precio base Core
- margen interno
- provider interno
- snapshot global

### AccountHolder / Receiver

Persona dueña o responsable de cuentas que reciben dinero.

Puede:

- recibir dinero en cuentas propias o asignadas
- cobrar comisión por recepción
- estar vinculado a cuentas, bancos, exchanges o efectivo
- ser también gestor
- tener o no tener login

Una persona puede acumular roles.

Ejemplo:

- gestiona cliente: gana comisión de gestor
- recibe dinero en su cuenta: gana comisión de receptor
- si hace ambas cosas, puede acumular ambas comisiones

### Processor / Operator

Rol futuro para quien ejecuta salidas.

Puede:

- ejecutar pagos de destino
- registrar cuenta de salida
- confirmar salida
- quedar asociado a una operación
- operar con permisos limitados

En algunas operaciones este rol puede ser el TenantAdmin.

### Client / Public User

Cliente final sin login, al menos en la etapa inicial.

Puede:

- usar calculadora pública
- cotizar básico
- ver resultado
- solicitar servicio
- contactar por WhatsApp al gestor asociado

En el futuro puede convertirse en `ClientProfile`.

---

## 8. Password and Login Rules

Nadie debe poder ver contraseñas.

Core no ve contraseñas.  
TenantAdmin no ve contraseñas.  
Gestores no ven contraseñas de otros.

Flujo recomendado:

- Core crea tenant.
- Core crea usuario inicial TenantAdmin.
- Sistema genera invitación o contraseña temporal.
- TenantAdmin entra y cambia contraseña.
- TenantAdmin crea gestores.
- Sistema genera invitación o contraseña temporal.
- Gestor entra y cambia contraseña.
- Si alguien olvida contraseña, se envía reset.
- Todo reset queda auditado.

---

## 9. Quote Center vs Public Calculator

### Quote Center

Centro interno de cotizaciones.

Características:

- requiere login
- pertenece al tenant
- usado por gestores y admins
- tiene calculadora interna
- permite cotizar
- genera shares
- respeta horarios
- respeta límites
- respeta módulos contratados
- registra actividad por gestor
- puede iniciar operación real si el módulo está activo

Una cotización cuenta como realizada cuando el share se genera correctamente.

Si falla la generación del share, puede quedar como intento fallido o draft.

### Public Calculator

Calculadora pública simple.

Características:

- no requiere login para el cliente final
- es básica
- no tiene herramientas internas
- no genera shares avanzados
- puede estar asociada a tenant
- puede estar asociada a gestor
- permite cotizar
- permite solicitar servicio
- puede abrir WhatsApp del gestor con mensaje automático
- atribuye visitas, cotizaciones, leads y solicitudes al gestor

---

## 10. Quote Flow

La cotización no es una operación real.

Flujo base:

1. Gestor cotiza.
2. Sistema genera share.
3. Share queda pendiente.
4. Cliente ve cuánto recibe o cuánto debe pagar.
5. Cliente paga.
6. Gestor confirma monto real recibido.
7. Gestor indica dónde entró el dinero:
   - banco
   - cuenta
   - exchange
   - billetera
   - efectivo
8. Gestor envía a procesar.
9. TenantAdmin revisa datos.
10. TenantAdmin procesa o manda a procesar la salida.
11. Se ejecuta salida.
12. Se confirma salida.
13. Si todo salió bien, operación pasa a completada.
14. Si falta confirmación, queda pendiente.
15. Al completarse:
   - se actualizan saldos si Ledger está activo
   - se calcula ganancia
   - se registra gestor
   - se calculan comisiones
   - se guarda auditoría

---

## 11. Remit Without Ledger

Si Ledger no está activo:

Remit puede:

- cotizar
- generar shares
- medir cotizaciones
- medir volumen cotizado
- medir gestor
- registrar leads
- hacer seguimiento básico

Remit no puede:

- actualizar saldos reales
- registrar caja completa
- calcular balances finales
- hacer conciliación completa

---

## 12. Remit With Ledger

Si Ledger está activo:

Remit puede enviar operaciones completadas a Ledger.

Ledger puede:

- sumar saldo recibido
- descontar saldo enviado
- registrar banco/cuenta/exchange
- registrar efectivo
- calcular utilidad
- registrar comisiones
- reflejar gastos
- reflejar saldos por moneda, país, cuenta o módulo

Regla:

Remit no es dueño absoluto de los saldos.  
Ledger es el módulo especializado en movimientos reales y saldos.

---

## 13. Quote Status

Estados posibles de una cotización:

- `draft`
- `share_generated`
- `pending_client_payment`
- `client_paid_reported`
- `sent_to_admin_review`
- `affected_by_rate_update`
- `manually_kept`
- `expired_by_rate_update`
- `expired_end_of_day`
- `converted_to_operation`
- `cancelled`
- `failed_share_generation`

Reglas:

- Todas las cotizaciones vencen al cierre del día.
- Si una actualización de tasas afecta directamente el cruce cotizado, la cotización debe marcarse como afectada.
- El gestor puede solicitar mantener la cotización.
- TenantAdmin decide si se mantiene o vence.
- La decisión debe quedar auditada.

---

## 14. Operation Status

Estados futuros de operación:

- `admin_review`
- `approved_to_process`
- `processing_payout`
- `payout_executed_pending_confirmation`
- `completed`
- `rejected`
- `cancelled`
- `manual_hold`

Una comisión solo se vuelve efectiva cuando la operación está `completed`.

---

## 15. Operation Limits

Los mínimos y máximos deben ser configurables por tenant.

Pueden definirse por:

- tenant
- cruce
- moneda origen
- moneda destino
- equivalente USDT
- equivalente USD
- referencia oficial aplicable por moneda

Regla recomendada:

El sistema debe validar límites usando una referencia estable, preferiblemente USDT/USD equivalente.

Ejemplo:

- mínimo general: equivalente a 10 USDT
- máximo general: equivalente a 1.000 USDT
- ARS → VES puede tener límites propios
- CLP → COP puede tener límites propios

Aplican en:

- Quote Center
- Public Calculator

Por defecto, si el monto está fuera de rango, debe bloquear cotización.  
Excepciones pueden existir solo con permiso.

---

## 16. Single vs Split Operations

MVP inicial:

- una entrada
- un destino
- una salida

Futuro:

- `split_inbound_payments`
- `split_destinations`
- `split_payouts`

Ejemplo futuro:

Entrada:

- 55.000 efectivo
- 25.000 transferencia banco X

Salida:

- 30.500 CLP desde cuenta X
- 2.500 VES a cuenta X
- 3.900 VES a cuenta Y

El contrato debe permitir esta evolución sin romper el modelo inicial.

---

## 17. Commission Rules

Las comisiones deben ser configurables.

Pueden depender de:

- tenant
- gestor
- receptor
- processor/operator
- aliado externo
- tenant proveedor
- moneda
- país
- cruce
- cuenta usada
- monto
- volumen semanal
- módulo usado

### Base actual referencial

- receptor: 1.5% base por recibir
- gestor: 2% base por gestionar
- gestor + receptor: puede acumular ambas
- bonos semanales: pueden agregar 0.5% o más según umbral
- todo debe ser configurable

Ejemplo:

Si una persona gestiona y recibe:

- 2% por gestión
- 1.5% por recepción
- total base: 3.5%

Si gestiona en un país pero otro receptor recibe:

- gestor: 2%
- receptor: 1.5%

---

## 18. Commission Eligibility

Solo genera comisión el dinero que viene de clientes y forma parte de una operación de cambio/remesa.

No genera comisión:

- balanceo interno
- fondos propios del tenant
- fondeo de cuentas
- movimientos entre cuentas internas
- entrega de dinero a receptor para liquidez
- ajustes operativos sin cliente final

Caso efectivo:

Si un gestor recibe efectivo pero no es receptor oficial:

- debe avisar al admin
- ese efectivo no genera comisión de receptor todavía
- cuando el efectivo se entregue/deposite al receptor correspondiente, puede generarse comisión de recepción si aplica

---

## 19. Weekly Commission Settlement

Las comisiones pueden acumularse por moneda.

Al cierre semanal:

- se suma comisión por moneda
- se convierte cada saldo a USDT
- se calcula total equivalente
- se paga en la moneda elegida por el colaborador
- el pago debe ser transferible, no efectivo

Monedas posibles de pago:

- ARS
- COP
- VES
- USDT
- otras configurables

---

## 20. Tenant Profit and Owner Allocation

La ganancia del tenant debe separarse de la ganancia personal del owner.

Una operación puede calcular:

Gross Profit
- Manager Commission
- Receiver Commission
- Processor Commission
- Partner Commission
= Tenant Net Profit

Luego el tenant puede distribuir:

Tenant Net Profit
- Owner Allocation
- Operational Reserves
- Business Expenses
- Growth Fund
= Remaining Business Balance

El dueño del tenant puede tener:

- sueldo fijo
- porcentaje de ganancia
- regla configurable
- meta de retiro
- separación para crecimiento

Esto evita que todo el dinero disponible se trate como dinero personal.

---

## 21. Tenant Expenses

Ledger debe contemplar gastos del tenant.

Ejemplos:

- dominio
- hosting
- herramientas
- ChatGPT / API
- electricidad
- internet
- publicidad
- comisiones bancarias
- gastos administrativos
- otros configurables

---

## 22. PublicCalculatorLead

Cuando un cliente usa una calculadora pública, el sistema puede crear un lead.

Datos posibles:

- tenant
- gestor asociado
- moneda origen
- moneda destino
- monto ingresado
- resultado mostrado
- fecha/hora
- click en WhatsApp
- mensaje generado
- estado de solicitud
- posible conversión a operación

---

## 23. ClientProfile

Entidad futura opcional.

Puede guardar:

- nombre
- teléfono
- país
- gestor asociado
- historial de solicitudes
- historial de cotizaciones
- historial de operaciones
- notas comerciales

El cliente final no necesita login en la primera etapa.

---

## 24. Partner Network / Partner Liquidity

Un aliado puede ser:

- tenant interno de Dhemka Core
- aliado externo registrado manualmente

Caso ejemplo:

- Tenant A tiene cuentas en Chile.
- Tenant B necesita recibir Chile.
- Tenant B usa cuenta/cobertura de Tenant A.
- Tenant A cobra 6%.
- Receptor real cobra 1.5%.
- Tenant A retiene 4.5%.
- El sistema registra porcentajes, saldos y deudas.

Datos necesarios:

- tenant solicitante
- tenant proveedor
- aliado externo, si aplica
- país
- moneda
- cuenta usada
- receptor asociado
- porcentaje cobrado al aliado
- porcentaje pagado al receptor
- utilidad neta del proveedor
- saldo/deuda entre partes

Los porcentajes deben ser configurables por relación, país, moneda, cuenta o tipo de operación.

---

## 25. Audit Rules

Todo cambio sensible debe quedar auditado.

Debe auditarse:

- acceso Core como soporte
- creación de tenant
- suspensión de tenant
- cambio de estado comercial
- activación/desactivación de módulos
- cambio de branding
- cambio de margen
- cambio de límites
- cambio de horario
- cambio de mensaje operativo
- creación/suspensión/eliminación de gestor
- reset de contraseña
- aprobación de operación
- rechazo de operación
- edición manual de monto
- edición de comisión
- cambio de cuenta
- cambio de receptor
- confirmación de salida
- cierre de operación
- acceso a datos sensibles del tenant

---

## 26. Core Support Access

Core puede entrar a un tenant en modo soporte.

Reglas:

- debe quedar auditado
- debe registrar usuario Core
- debe registrar tenant
- debe registrar fecha/hora
- debe registrar acciones sensibles
- idealmente debe registrar motivo

Core puede asistir, pero no debe operar de forma invisible.

---

## 27. Future API Contract

Endpoints conceptuales.  
No implementar todavía.

### Core

- `GET /api/core/runtime`
- `GET /api/core/health`
- `GET /api/core/tenants`
- `POST /api/core/tenants`
- `PATCH /api/core/tenants/:tenantId/status`
- `GET /api/core/tenants/:tenantId/modules`
- `PATCH /api/core/tenants/:tenantId/modules`
- `GET /api/core/audit`
- `GET /api/core/providers`
- `GET /api/core/snapshots/latest`

### Tenant

- `GET /api/tenant/:tenantId/settings`
- `PATCH /api/tenant/:tenantId/settings`
- `GET /api/tenant/:tenantId/users`
- `POST /api/tenant/:tenantId/users`
- `PATCH /api/tenant/:tenantId/users/:userId/status`
- `POST /api/tenant/:tenantId/users/:userId/reset-password`
- `GET /api/tenant/:tenantId/margins`
- `PATCH /api/tenant/:tenantId/margins`
- `GET /api/tenant/:tenantId/operation-limits`
- `PATCH /api/tenant/:tenantId/operation-limits`
- `GET /api/tenant/:tenantId/quotes`
- `GET /api/tenant/:tenantId/manager-activity`

### Remit

- `POST /api/remit/:tenantId/quotes`
- `POST /api/remit/:tenantId/quotes/:quoteId/share`
- `PATCH /api/remit/:tenantId/quotes/:quoteId/status`
- `POST /api/remit/:tenantId/operations`
- `PATCH /api/remit/:tenantId/operations/:operationId/review`
- `PATCH /api/remit/:tenantId/operations/:operationId/process`
- `PATCH /api/remit/:tenantId/operations/:operationId/complete`

### Public

- `GET /api/public/:tenantSlug/rates`
- `POST /api/public/:tenantSlug/quote`
- `POST /api/public/:tenantSlug/leads`
- `POST /api/public/:tenantSlug/g/:managerSlug/quote`
- `POST /api/public/:tenantSlug/g/:managerSlug/contact`

### Ledger

- `GET /api/ledger/:tenantId/accounts`
- `GET /api/ledger/:tenantId/balances`
- `POST /api/ledger/:tenantId/movements`
- `GET /api/ledger/:tenantId/expenses`
- `POST /api/ledger/:tenantId/expenses`

### Partner Network

- `GET /api/partners/:tenantId/relationships`
- `POST /api/partners/:tenantId/relationships`
- `POST /api/partners/:tenantId/shared-liquidity-operation`

---

## 28. Entity Catalog

### CoreTenant

Representa un tenant dentro de Dhemka Core.

Campos conceptuales:

- id
- name
- slug
- commercialStatus
- enabledModules
- createdAt
- updatedAt
- archivedAt

### TenantBranding

Branding visual configurado desde Core.

Campos conceptuales:

- tenantId
- displayName
- logo
- colorPalette
- shareTheme
- publicTheme
- poweredByDhemkaVisible

### TenantSettings

Configuración comercial del tenant.

Campos conceptuales:

- tenantId
- schedules
- operationalMessages
- defaultMargins
- quoteCenterSettings
- publicCalculatorSettings

### TenantOperationLimits

Límites mínimos y máximos.

Campos conceptuales:

- tenantId
- currency
- route
- minAmount
- maxAmount
- stableReferenceCurrency
- stableReferenceAmount
- enforcementMode

### User

Usuario del sistema.

Campos conceptuales:

- id
- tenantId
- name
- email
- phone
- role
- status
- mustChangePassword
- createdAt

### StaffProfile

Perfil operativo interno.

Campos conceptuales:

- userId
- tenantId
- managerCode
- publicSlug
- commissionRules
- canQuoteOutsideSchedule
- canReportInboundPayment
- canRequestQuoteKeep

### AccountHolder

Receptor o dueño/responsable de cuenta.

Campos conceptuales:

- id
- tenantId
- name
- accounts
- commissionRules
- canAlsoManageClients
- status

### Quote

Cotización.

Campos conceptuales:

- id
- tenantId
- managerId
- sourceCurrency
- targetCurrency
- sourceAmount
- targetAmount
- appliedRate
- visibleRate
- status
- expiresAt
- affectedByRateUpdate
- createdAt

### QuoteShare

Share generado.

Campos conceptuales:

- quoteId
- generatedAt
- generatedBy
- imageStatus
- sharedStatus
- shareTemplate
- brandingSnapshot

### RemitOperation

Operación real de remesa.

Campos conceptuales:

- id
- quoteId
- tenantId
- managerId
- status
- receivedAmount
- payoutAmount
- inboundPayments
- outboundPayouts
- profitSummary
- commissionSummary
- completedAt

### InboundPayment

Entrada real de dinero.

Campos conceptuales:

- operationId
- amount
- currency
- method
- bank
- account
- exchange
- cashLocation
- receivedBy
- verifiedBy
- isClientMoney
- createsReceiverCommission

### OutboundPayout

Salida real de dinero.

Campos conceptuales:

- operationId
- amount
- currency
- destinationAccount
- processorId
- status
- fee
- confirmedAt

### CommissionRule

Regla de comisión configurable.

Campos conceptuales:

- tenantId
- roleType
- personId
- currency
- route
- percentage
- threshold
- bonusRule
- settlementCurrency

### CommissionRecord

Comisión generada por operación completada.

Campos conceptuales:

- operationId
- beneficiaryId
- roleType
- amount
- currency
- equivalentUSDT
- status
- settlementWeek

### LedgerAccount

Cuenta, banco, exchange, billetera o efectivo.

Campos conceptuales:

- tenantId
- accountType
- country
- currency
- institution
- owner
- balance
- status

### LedgerMovement

Movimiento real en Ledger.

Campos conceptuales:

- tenantId
- moduleSource
- operationId
- accountId
- movementType
- amount
- currency
- equivalentUSDT
- createsCommission
- createdAt

### PartnerRelationship

Relación entre tenant y aliado.

Campos conceptuales:

- tenantId
- partnerType
- partnerTenantId
- externalPartnerId
- country
- currency
- commissionRules
- settlementRules
- status

### AuditLog

Registro de acción sensible.

Campos conceptuales:

- actorId
- actorRole
- tenantId
- action
- entityType
- entityId
- before
- after
- reason
- createdAt

---

## 29. Language Rule

Los nombres técnicos deben estar en inglés.

Las explicaciones internas pueden estar en español.

La interfaz futura debe poder adaptarse al idioma del dispositivo o configuración del usuario.

---

## 30. Implementation Phases

### V0 — Architecture Shell

- Core Console visual
- mock data
- documentación
- separación conceptual Core/Tenant
- sin backend real

### V1 — Remit MVP

- login real
- creación real de tenant
- TenantAdmin
- gestores
- centro de cotizaciones
- shares
- métricas por gestor
- calculadora pública simple

### V2 — Remit Operations

- quote to operation
- admin review
- received amount
- payout confirmation
- operation status
- auditoría operativa

### V3 — Ledger Integration

- cuentas
- saldos
- entradas
- salidas
- gastos
- utilidad
- comisiones
- cierre semanal

### V4 — Partner Network

- aliados internos
- aliados externos
- cuentas compartidas
- porcentajes configurables
- saldos/deudas entre partes

### V5 — Advanced Modules

- Lending
- Arbitrage / Opportunities
- CRM / ClientProfile
- Billing avanzado

---

## 31. Current Safety Rule

Mientras este contrato esté en etapa de diseño:

- no conectar backend real
- no tocar `server.js`
- no tocar snapshot real
- no tocar lógica financiera real
- no tocar producción
- no hacer merge a main
- trabajar únicamente en rama segura
- usar archivos específicos en Git
