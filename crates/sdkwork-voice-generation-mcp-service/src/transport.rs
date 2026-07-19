use crate::VoiceGenerationMcpService;
use rmcp::{
    service::{RunningService, ServerInitializeError},
    transport::streamable_http_server::{
        session::local::LocalSessionManager, StreamableHttpServerConfig, StreamableHttpService,
    },
    RoleServer, ServiceExt,
};
use std::sync::Arc;
pub type VoiceGenerationMcpHttpService =
    StreamableHttpService<VoiceGenerationMcpService, LocalSessionManager>;
pub fn streamable_http_service(
    service: VoiceGenerationMcpService,
    config: StreamableHttpServerConfig,
) -> VoiceGenerationMcpHttpService {
    StreamableHttpService::new(
        move || Ok(service.clone()),
        Arc::new(LocalSessionManager::default()),
        config,
    )
}
pub async fn serve_stdio(
    service: VoiceGenerationMcpService,
) -> Result<RunningService<RoleServer, VoiceGenerationMcpService>, ServerInitializeError> {
    service.serve(rmcp::transport::stdio()).await
}
