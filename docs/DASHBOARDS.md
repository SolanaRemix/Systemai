# Role Dashboards (v4.2.0)

All data comes from the local SQLite database (`telemetry_snapshots`, `execution_logs`, `policy_store`, `snapshot_metadata`).

| Route | Audience | IPC channel | SDK method |
|---|---|---|---|
| `/user` | End users | `dashboard:getUser` | `window.systemai.getUserDashboard()` |
| `/developer` | Developers | `dashboard:getDeveloper` | `getDeveloperDashboard()` |
| `/admin` | Administrators | `dashboard:getAdmin` | `getAdminDashboard()` |

## Admin API

| SDK method | Channel | Effect |
|---|---|---|
| `setPolicy(key, value)` | `admin:setPolicy` | Upsert policy (key `[A-Za-z0-9_.-]`, ≤64 chars) |
| `deletePolicy(key)` | `admin:deletePolicy` | Remove policy |
| `createSnapshot(reason)` | `admin:createSnapshot` | Record snapshot with SHA-256 integrity hash |
| `purgeLogs(days)` | `admin:purgeLogs` | Delete logs older than N days |

Each admin mutation is recorded in `execution_logs` with source `admin`, shown as the audit trail.
The full channel catalog is defined in `systemai/src/ipc/channels.ts` (`IPC_CHANNELS`) and displayed on the Developer dashboard.

Note: the desktop app has no authentication layer; role pages are navigation groupings, not access control.

## Logs & rollback

- `listLogs({level, search, limit})` → `logs:list` (LIKE wildcards escaped)
- `verifySnapshot(id)` → `snapshot:verify`: checks record exists, hash is a valid SHA-256 digest and rollback-ready. It does not restore state.

## Telemetry

The Monitor and User dashboards use `TelemetryCollector` (real host data). On non-Linux hosts, disk/network throughput and temperature read 0; GPU needs `nvidia-smi`.
