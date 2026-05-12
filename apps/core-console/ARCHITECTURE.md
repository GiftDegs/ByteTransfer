# Dhemka Core Console Architecture

Checkpoint interno de arquitectura para apps/core-console.

## Estado actual

La Core Console es una maqueta frontend aislada para la futura plataforma Dhemka Core.
Actualmente NO esta conectada a datos reales.
Todo lo que se ve en esta consola viene de data mock.

Fuente actual:
apps/core-console/data/mock-data.js

## Jerarquia estrategica

Dhemka Core
- Remit
  - ByteTransfer

Dhemka Core es la plataforma madre.
Remit es la linea/producto de remesas.
ByteTransfer es el primer tenant/modelo real dentro de Remit.
Futuros remeseros entrarian como tenants dentro de Remit.

## Que es mock actualmente

Actualmente son datos de prueba:
- Tenants.
- ByteTransfer / Demo Remit.
- Branding.
- Modulos habilitados.
- Estados operativos.
- Quote Engine.
- Providers.
- Monitoring.
- Alerts.
- Polling.
- Runtime health.
- Operational Base.

## Que NO esta conectado todavia

La Core Console NO lee todavia desde:
- server.js
- Postgres.
- Snapshots reales.
- Admin actual.
- Cotizador publico actual.
- Binance real.
- BCV real.
- PTAX real.
- Endpoints reales del motor de cotizacion.

## Frontera segura

Este trabajo NO toca:
- Produccion.
- main.
- server.js.
- Logica financiera real.
- Snapshot real.
- Admin actual.
- Cotizador actual.

Todo esta aislado dentro de apps/core-console/

## Orden actual de scripts

1. data/mock-data.js
2. src/state/console-state.js
3. src/utils/html.js
4. src/tenants/tenant-selectors.js
5. src/tenants/tenant-ui.js
6. src/panels/operational-base-panel.js
7. src/panels/quote-engine-panel.js
8. src/panels/monitoring-panel.js
9. src/ui/section-renderer.js
10. src/tenants/tenant-surfaces.js
11. app.js

## Mapa de modulos

app.js:
- Archivo de arranque/control.
- Selecciona tenant activo.
- Enlaza navegacion del sidebar.
- Enlaza seleccion de tenants.
- Ejecuta render inicial en DOMContentLoaded.
- No debe volver a contener templates grandes.

src/state/console-state.js:
- Estado temporal frontend: activeSection y activeTenantId.

src/utils/html.js:
- Helper compartido para escapar HTML.

src/tenants/tenant-selectors.js:
- Selectores de tenants desde mock data.

src/tenants/tenant-ui.js:
- Helpers visuales de tenants.
- Estados, modulos, metricas y access surfaces.

src/tenants/tenant-surfaces.js:
- Renderiza active tenant card.
- Renderiza tenant switcher.
- Renderiza tenant ecosystem list.
- Renderiza tenant detail panel.

src/ui/section-renderer.js:
- Render general de secciones.
- Dashboard, Operational Base, Quote Engine, Monitoring y Tenants.

src/panels/operational-base-panel.js:
- Panel mock de base operativa Core.
- Representa snapshot base, referencias de mercado, provider health y controles Core-only.

src/panels/quote-engine-panel.js:
- Panel mock del motor de cotizaciones Core.
- Representa providers, aggregation strategies, fallback systems y tenant boundaries.

src/panels/monitoring-panel.js:
- Panel mock de monitoreo Core.
- Representa polling, workers, runtime health y global alerts.

## Core vs Tenant

Core debe controlar:
- Motor base.
- Snapshot base.
- Providers.
- Fallbacks.
- Polling.
- Monitoring.
- Runtime health.
- Permisos globales.
- Provisioning de tenants.

Tenant debe controlar:
- Marca visible.
- Colores.
- Logo.
- Configuracion comercial.
- Usuarios.
- Horarios.
- Mensajes operativos.
- Modulos habilitados.
- Configuracion de calculadora.

Tenant NO debe controlar:
- Market base global.
- Provider strategy global.
- Polling global.
- Runtime health global.
- Snapshot engine global.
- Datos de otros tenants.

## Proximo camino seguro

Antes de conectar datos reales:
1. Mantener la Core Console aislada.
2. Definir contratos de datos Core/Tenant.
3. Marcar visualmente que la data actual es mock.
4. Disenar endpoints reales.
5. Conectar datos por partes, nunca directo a produccion.
