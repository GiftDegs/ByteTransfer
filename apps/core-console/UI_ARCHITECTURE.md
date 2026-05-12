# UI Architecture — Dhemka Core Console

Este documento define la arquitectura visual y la jerarquía de navegación de Dhemka Core Console.

No reemplaza a `ARCHITECTURE.md`.
No reemplaza a `DATA_CONTRACT.md`.
No reemplaza a `ROADMAP.md`.

- `ARCHITECTURE.md` explica cómo está organizado hoy el shell visual.
- `DATA_CONTRACT.md` define reglas futuras de datos, roles, módulos y contratos.
- `ROADMAP.md` define fases de avance.
- `UI_ARCHITECTURE.md` define cómo debe organizarse visualmente la consola.

---

## 1. UI Principle

Dhemka Core debe sentirse como la plataforma madre.

La interfaz no debe parecer un panel de ByteTransfer con módulos alrededor.

La jerarquía visual correcta es:

Dhemka Core
└── Remit
    └── Tenants
        └── ByteTransfer

ByteTransfer no es infraestructura.
ByteTransfer no es una rama.
ByteTransfer no debe aparecer al mismo nivel que Remit.
ByteTransfer debe aparecer únicamente dentro de `Remit > Tenants`, salvo que exista una alerta o evento importante que justifique mostrarlo en el dashboard principal.

---

## 2. Main Navigation Rule

Cada punto principal de la sidebar debe representar una rama, capa o producto importante de Dhemka Core.

La sidebar principal no debe mezclar ramas con detalles internos.

### Main Sidebar

Estructura objetivo:

- Dashboard
- Core Platform
- Remit
- Ledger
- Lending
- Partner Network
- Arbitrage
- Billing
- Identity

### Qué NO debe ir en la sidebar principal

No deben ir como elementos principales:

- ByteTransfer
- Demo Remit
- Tenant Switcher global pesado
- Quote Center de un tenant específico
- Public Calculator de un tenant específico
- Branding de un tenant específico
- Detalles de un cliente
- Detalles de un gestor

Esos elementos viven dentro de su rama correspondiente.

---

## 3. Dashboard Rule

El dashboard principal de Dhemka Core debe mostrar el estado general del ecosistema.

Debe responder rápido:

- ¿Está sano el motor Core?
- ¿Qué ramas existen?
- ¿Qué ramas están activas?
- ¿Hay problemas críticos?
- ¿Hay tenants por vencer?
- ¿Hay demos o trials por terminar?
- ¿Hay fallas de providers?
- ¿Hay alertas de runtime?
- ¿Hay tareas de soporte pendientes?
- ¿Hay algo que requiera acción inmediata?

### Dashboard principal puede mostrar

- resumen de Core Platform
- resumen de Remit
- resumen de Ledger, si existe
- resumen de Lending, si existe
- resumen de Billing
- resumen de Identity
- alertas críticas
- próximos vencimientos
- tenants con riesgo o acción pendiente
- salud global del sistema

### Dashboard principal NO debe mostrar como protagonista

- Tenant Registry completo
- ByteTransfer como card principal permanente
- Demo Remit como card principal permanente
- detalles comerciales de un tenant
- módulos internos de un tenant
- configuraciones de gestores
- branding de tenant
- calculadora pública de tenant

Un tenant solo aparece en el dashboard principal si hay algo accionable:

- pago vencido
- trial por vencer
- problema operativo
- onboarding pendiente
- suspensión
- alerta de margen
- error de configuración
- solicitud de soporte

---

## 4. Core Platform

Core Platform representa el motor central de Dhemka Core.

Debe contener:

- Core Dashboard
- Operational Base
- Core Quote Engine
- Monitoring
- Providers
- Snapshots
- Runtime Health
- Global Audit
- Fallbacks
- Workers / Cron, futuro

### Core Platform owns

- motor base
- providers
- snapshots globales
- referencias externas
- polling
- monitoring
- health checks
- runtime
- auditoría global
- reglas superiores
- fallbacks

### Core Platform does not show as tenant content

Core Platform no debe mostrar:

- Quote Center de tenant
- calculadora pública de tenant
- gestores de tenant
- branding editable de tenant
- historial comercial interno de tenant

Puede mostrar métricas agregadas de tenants, pero no convertirlos en protagonistas.

---

## 5. Remit

Remit es la rama/producto de remesas dentro de Dhemka Core.

Remit no es ByteTransfer.
Remit contiene tenants remeseros.
ByteTransfer es un tenant dentro de Remit.

### Remit internal navigation

Dentro de Remit debe existir navegación interna, no otra sidebar principal pesada.

Puede ser una barra de tabs, pills o subnav horizontal.

Estructura objetivo:

- Remit Dashboard
- Tenants
- Quote Centers
- Public Calculators
- Roles
- Limits
- Operations, futuro
- Shares, futuro
- Schedules, futuro
- Messages, futuro

### Remit Dashboard

Debe mostrar resumen de la rama Remit:

- cantidad de tenants
- tenants activos
- tenants en trial
- tenants suspendidos
- módulos Remit más usados
- actividad reciente de Remit
- alertas de Remit
- tenants con onboarding pendiente
- tenants con pagos o configuración pendiente

No debe mostrar todos los tenants como contenido principal si no hace falta.

### Remit > Tenants

Aquí sí viven:

- ByteTransfer
- Demo Remit
- futuros remeseros
- estado comercial de cada tenant
- módulos contratados por tenant
- detalle del tenant seleccionado
- configuración comercial del tenant permitida
- usuarios/gestores del tenant
- límites del tenant
- quote center del tenant
- public calculator del tenant

---

## 6. Tenant Hierarchy

Un tenant nunca debe estar visualmente por encima de la rama que lo contiene.

Correcto:

Dhemka Core
└── Remit
    └── Tenants
        └── ByteTransfer

Incorrecto:

Dhemka Core
├── Remit
├── ByteTransfer
└── Demo Remit

Incorrecto:

Sidebar principal
- Dashboard
- Operational Base
- Quote Engine
- Monitoring
- Tenants
- ByteTransfer

Incorrecto:

Dashboard principal
- ByteTransfer como protagonista permanente
- Tenant Registry completo siempre visible

---

## 7. Tenant Detail

El detalle de un tenant debe abrirse dentro de `Remit > Tenants`.

El tenant detail puede mostrar:

- perfil del tenant
- estado comercial
- módulos habilitados
- módulos bloqueados
- branding provisioning
- quote center
- public calculator
- gestores
- account holders / receivers
- límites
- horarios
- mensajes
- actividad
- auditoría del tenant
- operaciones, si módulo activo
- ledger, si módulo activo

### Branding rule

Branding pertenece visualmente al tenant, pero es administrado desde Core.

Por eso, en UI no debe aparecer como un módulo editable normal del tenant.

Debe mostrarse como:

- Branding Provisioning
- Managed by Core
- Core configured
- Request-based customization

No como:

- Branding editable
- Tenant can modify branding
- Branding module normal

---

## 8. Ledger

Ledger debe ser una rama separada.

No debe vivir dentro de Remit.

Ledger puede integrarse con Remit, Lending, Partner Network y otros módulos, pero sigue siendo el módulo especializado en movimientos reales y saldos.

### Ledger internal navigation

- Ledger Dashboard
- Accounts
- Balances
- Movements
- Expenses
- Commissions
- Settlements
- Reconciliation

---

## 9. Lending

Lending debe ser una rama separada.

No depende obligatoriamente de Remit.
Puede funcionar solo o conectado con Ledger.

### Lending internal navigation

- Lending Dashboard
- Borrowers
- Loans
- Guarantees
- Payments
- Interest
- Risk
- Delinquency

---

## 10. Partner Network

Partner Network debe ser una rama separada.

No debe quedar escondida dentro de Remit, aunque pueda trabajar con Remit.

Representa relaciones entre tenants o aliados externos.

### Partner Network internal navigation

- Partner Dashboard
- Internal Partners
- External Partners
- Shared Liquidity
- Agreements
- Settlements
- Partner Audit

---

## 11. Arbitrage

Arbitrage / Opportunities debe ser una rama separada.

Puede alimentarse de Core providers, Ledger balances y necesidades de Remit.

### Arbitrage internal navigation

- Opportunities Dashboard
- Provider Comparison
- Balance Opportunities
- Buy/Sell Suggestions
- Liquidity Alerts
- Market Signals

---

## 12. Billing

Billing es la capa de planes, pagos y vencimientos.

No es una rama comercial como Remit o Lending, pero sí es una capa del sistema.

### Billing owns

- planes
- trials
- vencimientos
- pagos
- estado comercial del tenant
- módulos contratados
- past_due
- suspended
- cancelled
- archived

### Billing internal navigation

- Billing Dashboard
- Plans
- Payments
- Trials
- Expirations
- Module Access
- Commercial Status

---

## 13. Identity

Identity es la capa de usuarios, accesos, roles y permisos.

No es una rama comercial. Es una capa de sistema.

### Identity owns

- login
- usuarios
- roles
- permisos
- invitaciones
- reset de contraseña
- sesiones
- acceso de soporte
- auditoría de acceso

### Identity internal navigation

- Identity Dashboard
- Users
- Roles
- Permissions
- Invitations
- Password Resets
- Sessions
- Support Access

---

## 14. Secondary Navigation Rule

No usar una segunda sidebar pesada salvo que sea estrictamente necesario.

Preferencia visual:

- Sidebar izquierda: ramas principales.
- Subnav interno: tabs, pills o barra horizontal dentro de la rama activa.
- Contenido principal: dashboard o detalle seleccionado.

Ejemplo:

Sidebar:
- Dashboard
- Core Platform
- Remit
- Ledger
- Lending

Dentro de Remit:

[Overview] [Tenants] [Quote Centers] [Public Calculators] [Roles] [Limits]

Esto mantiene la UI limpia y evita que todo parezca tener el mismo peso.

---

## 15. Information Weight Rule

No todo merece una card grande.

### Cards grandes deben ser para

- salud del sistema
- motor Core
- ramas principales
- alertas críticas
- vencimientos
- problemas de configuración
- acciones pendientes
- riesgos operativos

### Cards pequeñas o listas deben ser para

- tenants individuales
- módulos internos
- logs recientes
- estados secundarios
- datos de soporte
- detalles configurables

### No mostrar si no aporta

Si algo no requiere acción, no debe ocupar protagonismo innecesario.

Ejemplo:

No mostrar ByteTransfer grande en Dashboard solo porque existe.
Sí mostrar ByteTransfer en Dashboard si:

- su trial vence
- está suspendido
- tiene alerta operativa
- necesita configuración
- tiene error de módulo
- tiene solicitud de soporte

---

## 16. Current UI Problems Detected

Problemas detectados en la UI actual:

- ByteTransfer aparece demasiado visible fuera de `Remit > Tenants`.
- Tenant Registry aparece como bloque fijo en zonas donde no debería dominar.
- Active Tenant y Tenant Switcher ocupan demasiado peso global.
- Tenants aparece como módulo suelto de Core, cuando debe vivir dentro de Remit.
- Dashboard parece más orientado a ByteTransfer/tenants que a Dhemka Core como matriz.
- Core Activity es demasiado genérico y se repite como bloque global.
- Footer muestra `Environment: Production`, pero la consola es mock/prototipo.
- Branding aparece como módulo de tenant, cuando debe ser Core managed.
- Quote Engine puede confundirse con Quote Center si no se refuerza como Core Quote Engine.

---

## 17. Target Refactor Direction

La UI debe moverse hacia esta estructura:

Dhemka Core Console
├── Dashboard
├── Core Platform
│   ├── Overview
│   ├── Operational Base
│   ├── Core Quote Engine
│   ├── Monitoring
│   ├── Audit
│   └── Health
├── Remit
│   ├── Overview
│   ├── Tenants
│   │   ├── ByteTransfer
│   │   └── Demo Remit
│   ├── Quote Centers
│   ├── Public Calculators
│   ├── Roles
│   └── Limits
├── Ledger
├── Lending
├── Partner Network
├── Arbitrage
├── Billing
└── Identity

---

## 18. Refactor Phases

### Phase 1 — Navigation hierarchy

- Main sidebar by branches.
- Remove tenant prominence from global sidebar.
- Move tenants under Remit.
- Rename Quote Engine to Core Quote Engine.
- Change environment label from Production to Mock Prototype.
- Make Dashboard Core-first.

### Phase 2 — Remit branch

- Add Remit dashboard.
- Add Remit internal subnav.
- Move Tenant Registry into Remit.
- Move Tenant Detail into Remit > Tenants.
- Keep ByteTransfer only as tenant record.

### Phase 3 — Future branch placeholders

- Add Ledger placeholder.
- Add Lending placeholder.
- Add Partner Network placeholder.
- Add Arbitrage placeholder.
- Add Billing placeholder.
- Add Identity placeholder.

### Phase 4 — Data alignment

- Update mock data to reflect branches, subnavs, modules, roles and tenant hierarchy.
- Keep everything mock.
- No backend real.

---

## 19. Safety Rules

This UI architecture refactor must not:

- touch `main`
- touch production
- touch `server.js`
- touch real snapshots
- touch real financial logic
- touch current admin
- touch current public quote calculator
- connect real backend
- create real tenants yet

All work stays inside `apps/core-console/` until explicitly approved.
