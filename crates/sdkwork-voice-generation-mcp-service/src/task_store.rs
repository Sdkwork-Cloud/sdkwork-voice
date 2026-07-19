use crate::McpToolError;
use sdkwork_voice_service::VoiceProviderDispatchPlan;
use std::{
    collections::{HashMap, VecDeque},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Mutex,
    },
};

#[derive(Clone, Debug)]
pub struct VoiceGenerationMcpTaskContext {
    pub dispatch_plan: VoiceProviderDispatchPlan,
    pub provider_task_id: String,
}
pub trait VoiceGenerationMcpTaskStore: Send + Sync {
    fn save(&self, context: VoiceGenerationMcpTaskContext) -> Result<String, McpToolError>;
    fn load(&self, handle: &str) -> Result<Option<VoiceGenerationMcpTaskContext>, McpToolError>;
}
pub struct InMemoryVoiceGenerationMcpTaskStore {
    capacity: usize,
    sequence: AtomicU64,
    state: Mutex<TaskStoreState>,
}
#[derive(Default)]
struct TaskStoreState {
    order: VecDeque<String>,
    contexts: HashMap<String, VoiceGenerationMcpTaskContext>,
}

impl InMemoryVoiceGenerationMcpTaskStore {
    pub const DEFAULT_CAPACITY: usize = 2_048;
    pub fn new(capacity: usize) -> Result<Self, McpToolError> {
        if capacity == 0 {
            return Err(McpToolError::invalid_request(
                "voice MCP task store capacity must be greater than zero",
            ));
        }
        Ok(Self {
            capacity,
            sequence: AtomicU64::new(1),
            state: Mutex::new(TaskStoreState::default()),
        })
    }
    pub fn shared_default() -> Arc<dyn VoiceGenerationMcpTaskStore> {
        Arc::new(Self::new(Self::DEFAULT_CAPACITY).expect("valid voice MCP task store capacity"))
    }
}
impl VoiceGenerationMcpTaskStore for InMemoryVoiceGenerationMcpTaskStore {
    fn save(&self, context: VoiceGenerationMcpTaskContext) -> Result<String, McpToolError> {
        let handle = format!(
            "voice-task-{}",
            self.sequence.fetch_add(1, Ordering::Relaxed)
        );
        let mut state = self
            .state
            .lock()
            .map_err(|_| McpToolError::store_unavailable())?;
        while state.contexts.len() >= self.capacity {
            if let Some(expired) = state.order.pop_front() {
                state.contexts.remove(&expired);
            }
        }
        state.order.push_back(handle.clone());
        state.contexts.insert(handle.clone(), context);
        Ok(handle)
    }
    fn load(&self, handle: &str) -> Result<Option<VoiceGenerationMcpTaskContext>, McpToolError> {
        Ok(self
            .state
            .lock()
            .map_err(|_| McpToolError::store_unavailable())?
            .contexts
            .get(handle.trim())
            .cloned())
    }
}
