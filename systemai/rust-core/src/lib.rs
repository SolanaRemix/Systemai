mod event_bus;
mod snapshot_manager;

use event_bus::{Event, EventBus};
use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use snapshot_manager::{create_snapshot_metadata, rollback_executor, validate_integrity};
use std::sync::Mutex;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TelemetryIngest {
    pub source: String,
    pub metric: String,
    pub value: f64,
}

#[napi(object)]
pub struct TelemetryIngestInput {
    pub source: String,
    pub metric: String,
    pub value: f64,
}

#[napi(object)]
pub struct EventInput {
    pub id: String,
    pub topic: String,
    pub payload: String,
    pub priority: u32,
}

static EVENT_BUS: Mutex<Option<EventBus>> = Mutex::new(None);

#[napi]
pub fn init_event_bus(max_per_second: u32) {
    let mut guard = EVENT_BUS.lock().expect("event bus mutex poisoned");
    *guard = Some(EventBus::new(max_per_second));
}

#[napi]
pub fn ingest_telemetry(input: TelemetryIngestInput) -> String {
    let event = TelemetryIngest {
        source: input.source,
        metric: input.metric,
        value: input.value,
    };
    serde_json::to_string(&event).unwrap_or_else(|_| "{}".to_string())
}

#[napi]
pub fn enqueue_event(input: EventInput) -> bool {
    let mut guard = EVENT_BUS.lock().expect("event bus mutex poisoned");
    let Some(bus) = guard.as_mut() else {
        return false;
    };

    bus.enqueue(Event {
        id: input.id,
        topic: input.topic,
        payload: input.payload,
        priority: input.priority as u8,
        created_at_ms: 0,
    })
}

#[napi]
pub fn dispatch_event() -> Option<String> {
    let mut guard = EVENT_BUS.lock().expect("event bus mutex poisoned");
    let Some(bus) = guard.as_mut() else {
        return None;
    };
    bus.dispatch_next()
        .and_then(|event| serde_json::to_string(&event).ok())
}

#[napi]
pub fn create_snapshot(id: String, reason: String) -> String {
    let metadata = create_snapshot_metadata(&id, &reason);
    serde_json::to_string(&metadata).unwrap_or_else(|_| "{}".to_string())
}

#[napi]
pub fn execute_rollback(snapshot_id: String) -> String {
    rollback_executor(&snapshot_id)
}

#[napi]
pub fn verify_snapshot(snapshot_json: String) -> bool {
    let parsed: Result<snapshot_manager::SnapshotMetadata, _> = serde_json::from_str(&snapshot_json);
    parsed.map(|s| validate_integrity(&s)).unwrap_or(false)
}
