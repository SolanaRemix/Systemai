use serde::{Deserialize, Serialize};
use std::collections::{HashSet, VecDeque};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq, Hash)]
pub struct Event {
    pub id: String,
    pub topic: String,
    pub payload: String,
    pub priority: u8,
    pub created_at_ms: u128,
}

#[derive(Default)]
pub struct EventBus {
    queue: VecDeque<Event>,
    seen_ids: HashSet<String>,
    last_dispatch_ms: u128,
    max_per_second: u32,
    journal: Vec<String>,
}

impl EventBus {
    pub fn new(max_per_second: u32) -> Self {
        Self {
            queue: VecDeque::new(),
            seen_ids: HashSet::new(),
            last_dispatch_ms: 0,
            max_per_second,
            journal: vec![],
        }
    }

    pub fn enqueue(&mut self, event: Event) -> bool {
        if self.seen_ids.contains(&event.id) {
            return false;
        }
        self.seen_ids.insert(event.id.clone());
        self.queue.push_back(event);
        self.queue
            .make_contiguous()
            .sort_by(|a, b| b.priority.cmp(&a.priority));
        true
    }

    pub fn dispatch_next(&mut self) -> Option<Event> {
        let now_ms = now_ms();
        if self.last_dispatch_ms > 0 {
            let elapsed = now_ms.saturating_sub(self.last_dispatch_ms);
            let min_gap = if self.max_per_second == 0 {
                0
            } else {
                1000 / self.max_per_second as u128
            };
            if elapsed < min_gap {
                return None;
            }
        }

        let event = self.queue.pop_front()?;
        self.last_dispatch_ms = now_ms;
        self.journal.push(format!("{}:{}", event.id, event.topic));
        Some(event)
    }

    pub fn journal_snapshot(&self) -> Vec<String> {
        self.journal.clone()
    }
}

fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}
