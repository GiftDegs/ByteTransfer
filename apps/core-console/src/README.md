# Core Console source structure

This folder prepares the Dhemka Core Console frontend for progressive modularization.

Current rule:
- Do not move financial logic here yet.
- Do not touch production ByteTransfer logic.
- Keep Core Console changes isolated.
- Split app.js progressively in small validated commits.

Planned structure:
- state: local console state and selectors.
- utils: pure helpers and formatters.
- ui: shared rendering helpers and navigation bindings.
- panels: Core-owned panels such as Operational Base, Quote Engine and Monitoring.
- tenants: tenant registry, tenant detail and tenant surfaces.

