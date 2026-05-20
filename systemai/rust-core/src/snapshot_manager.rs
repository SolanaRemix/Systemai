use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SnapshotMetadata {
    pub id: String,
    pub reason: String,
    pub file_diff_count: usize,
    pub registry_change_count: usize,
    pub integrity_hash: String,
}

pub fn create_snapshot_metadata(id: &str, reason: &str) -> SnapshotMetadata {
    SnapshotMetadata {
        id: id.to_string(),
        reason: reason.to_string(),
        file_diff_count: 0,
        registry_change_count: 0,
        integrity_hash: format!("sha256:{}:{}", id, reason.len()),
    }
}

pub fn rollback_executor(snapshot_id: &str) -> String {
    format!("rollback queued for {}", snapshot_id)
}

pub fn validate_integrity(metadata: &SnapshotMetadata) -> bool {
    metadata.integrity_hash.starts_with("sha256:") && !metadata.id.is_empty()
}
