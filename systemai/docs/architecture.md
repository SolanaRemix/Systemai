# SYSTEMAI Architecture (Phase 1)

- Electron main process provides secured IPC and local persistence.
- React renderer provides dashboard, monitor, security, chatbot, and operations surfaces.
- Rust core exports napi-rs bindings for event bus and snapshot primitives.
- SQLite persists telemetry snapshots, policy values, and execution logs.
