# CHANGELOG

All notable changes to SYSTEMAI.EXE are documented here.

---

# [4.2.0] — 2026-10-22

## Added

- Log viewer wired to `execution_logs` with level/search filters (`logs:list`, `listLogs` SDK)
- Rollback panel lists snapshots and verifies integrity records (`snapshot:verify`, `verifySnapshot` SDK)

## Fixed

- ESLint no longer fails on `postcss.config.cjs`, so `npm run build` lint step passes

---

# [4.1.0] — 2026-10-22

## Added

- Role-based dashboards: User (`/user`), Developer (`/developer`), Admin (`/admin`) backed by persisted SQLite data
- Dashboard service (`systemai/backend/dashboard-service`) with validated IPC channels `dashboard:getUser|getDeveloper|getAdmin`
- Admin API: `admin:setPolicy`, `admin:deletePolicy`, `admin:createSnapshot` (SHA-256 integrity hash), `admin:purgeLogs`; every admin action is written to the audit trail
- Preload SDK methods and typed `window.systemai` declarations for all new channels
- Release workflow (`.github/workflows/release.yml`) publishing GitHub releases from `v*` tags using these changelog notes
- `docs/DASHBOARDS.md`

---

# [4.0.0] — 2026-05-16

## Added

- Deterministic AI state machine
- Python Runtime Layer
- Rust event bus
- Secure IPC model
- Rollback orchestration
- AI swarm governance
- Policy engine
- Human override mode
- Local AI runtime integration
- FastAPI orchestration
- Telemetry expiration rules
- STRIDE threat model

---

## Improved

- Stability-first orchestration
- Resource-aware execution
- Telemetry performance
- Repair validation
- Windows recovery workflows

---

## Security

- Signed validation
- Sandboxed execution
- Least privilege enforcement
- Anti-recursive orchestration
- Policy-based execution control

---

# [3.2.0]

## Added

- Unified event bus
- Permission levels
- Operational SLOs
- Human override mode

---

# [3.1.2]

## Stabilized

- Rollback runtime
- Security dashboard
- Repair engine

---

# [3.0.0]

## Initial Release

- Electron frontend
- Rust core
- AI orchestration
- Windows diagnostics

---