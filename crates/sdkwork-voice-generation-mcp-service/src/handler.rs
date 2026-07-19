use crate::{
    InMemoryVoiceGenerationMcpTaskStore, McpToolError, SynthesizeVoiceInput,
    VoiceGenerationMcpTaskContext, VoiceGenerationMcpTaskStore, VoiceGenerationResult,
    VoiceTaskInput,
};
use rmcp::{
    handler::server::{router::tool::ToolRouter, wrapper::Parameters},
    model::{
        CallToolResult, ErrorData, GetPromptRequestParams, GetPromptResult, Implementation,
        ListPromptsResult, ListResourcesResult, PaginatedRequestParams, ReadResourceRequestParams,
        ReadResourceResult, ServerCapabilities, ServerInfo, Tool,
    },
    service::RequestContext,
    tool, tool_handler, tool_router, Json, RoleServer, ServerHandler,
};
use sdkwork_voice_service::{VoiceGenerationProviderDescriptor, VoiceGenerationServicePort};
use std::sync::Arc;

#[derive(Clone)]
pub struct VoiceGenerationMcpService {
    generation_service: Arc<dyn VoiceGenerationServicePort>,
    task_store: Arc<dyn VoiceGenerationMcpTaskStore>,
    tool_router: ToolRouter<Self>,
}
impl VoiceGenerationMcpService {
    pub fn new(generation_service: Arc<dyn VoiceGenerationServicePort>) -> Self {
        Self::with_task_store(
            generation_service,
            InMemoryVoiceGenerationMcpTaskStore::shared_default(),
        )
    }
    pub fn with_task_store(
        generation_service: Arc<dyn VoiceGenerationServicePort>,
        task_store: Arc<dyn VoiceGenerationMcpTaskStore>,
    ) -> Self {
        Self {
            generation_service,
            task_store,
            tool_router: Self::tool_router(),
        }
    }
    pub fn tools(&self) -> Vec<Tool> {
        self.tool_router.list_all()
    }
    pub fn provider_descriptors(&self) -> Vec<VoiceGenerationProviderDescriptor> {
        self.generation_service.provider_descriptors()
    }
    fn task_context(&self, handle: &str) -> Result<VoiceGenerationMcpTaskContext, McpToolError> {
        let handle = handle.trim();
        if handle.is_empty() {
            return Err(McpToolError::invalid_request("taskHandle is required"));
        }
        self.task_store
            .load(handle)?
            .ok_or_else(|| McpToolError::task_not_found(handle))
    }
}

#[tool_router]
impl VoiceGenerationMcpService {
    #[tool(
        name = "voice.synthesize",
        description = "Synthesize speech through the unified voice generation service."
    )]
    async fn synthesize(
        &self,
        Parameters(input): Parameters<SynthesizeVoiceInput>,
    ) -> Result<Json<VoiceGenerationResult>, Json<McpToolError>> {
        let submission = self
            .generation_service
            .generate_speech(input.try_into().map_err(Json)?)
            .await
            .map_err(|error| Json(error.into()))?;
        let task_handle = match submission.result.provider_task_id.as_deref() {
            Some(provider_task_id) => Some(
                self.task_store
                    .save(VoiceGenerationMcpTaskContext {
                        dispatch_plan: submission.dispatch_plan.clone(),
                        provider_task_id: provider_task_id.into(),
                    })
                    .map_err(Json)?,
            ),
            None => None,
        };
        Ok(Json(VoiceGenerationResult::from_submission(
            &submission,
            task_handle,
        )))
    }
    #[tool(
        name = "voice.retrieve",
        description = "Retrieve a voice generation task by the task handle returned from voice.synthesize."
    )]
    async fn retrieve(
        &self,
        Parameters(input): Parameters<VoiceTaskInput>,
    ) -> Result<Json<VoiceGenerationResult>, Json<McpToolError>> {
        let context = self.task_context(&input.task_handle).map_err(Json)?;
        let result = self
            .generation_service
            .retrieve(&context.dispatch_plan, &context.provider_task_id)
            .await
            .map_err(|error| Json(error.into()))?;
        Ok(Json(VoiceGenerationResult::from_normalized(
            &result,
            Some(input.task_handle),
        )))
    }
    #[tool(
        name = "voice.cancel",
        description = "Cancel a voice generation task by the task handle returned from voice.synthesize."
    )]
    async fn cancel(
        &self,
        Parameters(input): Parameters<VoiceTaskInput>,
    ) -> Result<Json<VoiceGenerationResult>, Json<McpToolError>> {
        let context = self.task_context(&input.task_handle).map_err(Json)?;
        let result = self
            .generation_service
            .cancel(&context.dispatch_plan, &context.provider_task_id)
            .await
            .map_err(|error| Json(error.into()))?;
        Ok(Json(VoiceGenerationResult::from_normalized(
            &result,
            Some(input.task_handle),
        )))
    }
    #[tool(
        name = "voice.capabilities",
        description = "List registered voice generation vendors and capabilities."
    )]
    async fn capabilities(&self) -> CallToolResult {
        CallToolResult::structured(crate::catalog::catalog(self.provider_descriptors()))
    }
}

#[tool_handler(router = self.tool_router)]
impl ServerHandler for VoiceGenerationMcpService {
    fn get_info(&self) -> ServerInfo {
        ServerInfo::new(ServerCapabilities::builder().enable_tools().enable_resources().enable_prompts().build()).with_server_info(Implementation::new("sdkwork-voice-generation-mcp-service", env!("CARGO_PKG_VERSION"))).with_instructions("Use provider-neutral speech synthesis tools and inspect capability resources before setting vendor-specific parameters.")
    }
    async fn list_resources(
        &self,
        _: Option<PaginatedRequestParams>,
        _: RequestContext<RoleServer>,
    ) -> Result<ListResourcesResult, ErrorData> {
        Ok(crate::catalog::resources())
    }
    async fn read_resource(
        &self,
        request: ReadResourceRequestParams,
        _: RequestContext<RoleServer>,
    ) -> Result<ReadResourceResult, ErrorData> {
        crate::catalog::read(&request.uri, self.provider_descriptors())
            .map(|content| ReadResourceResult::new(vec![content]))
            .ok_or_else(|| ErrorData::resource_not_found("voice MCP resource was not found", None))
    }
    async fn list_prompts(
        &self,
        _: Option<PaginatedRequestParams>,
        _: RequestContext<RoleServer>,
    ) -> Result<ListPromptsResult, ErrorData> {
        Ok(crate::catalog::prompts())
    }
    async fn get_prompt(
        &self,
        request: GetPromptRequestParams,
        _: RequestContext<RoleServer>,
    ) -> Result<GetPromptResult, ErrorData> {
        if request.name == crate::catalog::GENERATION_PROMPT {
            Ok(crate::catalog::prompt())
        } else {
            Err(ErrorData::invalid_params(
                "voice MCP prompt was not found",
                None,
            ))
        }
    }
}
