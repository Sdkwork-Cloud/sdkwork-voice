use axum::http::StatusCode;
use sdkwork_web_core::{
    ServerRequestId, WebApiSurface, WebAuthMode, WebRequestContext, WebTransportFacts,
};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceRequestContext {
    pub tenant_id: String,
    pub organization_id: Option<String>,
    pub user_id: String,
    pub session_id: String,
    pub app_id: String,
    pub permission_scopes: Vec<String>,
    pub trace_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceAuthError {
    pub status: StatusCode,
    pub code: &'static str,
    pub message: String,
}

impl VoiceAuthError {
    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            code: "unauthenticated",
            message: message.into(),
        }
    }
}

pub fn voice_request_context_from_web(
    app_ctx: &WebRequestContext,
) -> Result<VoiceRequestContext, VoiceAuthError> {
    let principal = app_ctx
        .principal
        .as_ref()
        .ok_or_else(|| VoiceAuthError::unauthorized("authenticated request context is required"))?;

    Ok(VoiceRequestContext {
        tenant_id: principal.tenant_id().to_owned(),
        organization_id: principal.organization_id().map(str::to_owned),
        user_id: principal.user_id().to_owned(),
        session_id: principal
            .session_id()
            .map(str::to_owned)
            .unwrap_or_else(|| format!("{}:{}", principal.app_id(), principal.user_id())),
        app_id: principal.app_id().to_owned(),
        permission_scopes: extract_permission_scopes(principal),
        trace_id: app_ctx.resolved_trace_id(),
    })
}

fn extract_permission_scopes(principal: &sdkwork_web_core::WebRequestPrincipal) -> Vec<String> {
    principal
        .scopes
        .permission_scope
        .iter()
        .filter(|scope| scope.starts_with("voice.") || scope.as_str() == "voice.*")
        .cloned()
        .collect()
}

pub fn webhook_ingress_web_request_context(trace_id: String) -> WebRequestContext {
    WebRequestContext {
        request_id: ServerRequestId(trace_id.clone()),
        api_surface: WebApiSurface::BackendApi,
        auth_mode: WebAuthMode::Public,
        principal: None,
        transport: WebTransportFacts {
            path: "/backend/v3/api/voice/provider_webhooks".to_owned(),
            method: "POST".to_owned(),
            auth_token_present: false,
            access_token_present: false,
            api_key_present: false,
            oauth_bearer_present: false,
            agent_token_present: false,
        },
        locale: None,
        client_kind: None,
        operation: None,
        trace_id: Some(trace_id),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sdkwork_web_core::WebRequestPrincipal;

    #[test]
    fn maps_web_request_context_into_voice_context() {
        let app_ctx = crate::test_support::test_web_request_context();
        let context = voice_request_context_from_web(&app_ctx).expect("context");
        assert_eq!(context.tenant_id, crate::test_support::TEST_TENANT_ID);
        assert_eq!(
            context.organization_id.as_deref(),
            Some(crate::test_support::TEST_ORGANIZATION_ID),
        );
        assert_eq!(context.user_id, crate::test_support::TEST_USER_ID);
    }

    #[test]
    fn rejects_missing_principal() {
        let mut app_ctx = crate::test_support::test_web_request_context();
        app_ctx.principal = None;
        let error = voice_request_context_from_web(&app_ctx).expect_err("missing principal");
        assert_eq!(error.code, "unauthenticated");
    }

    #[test]
    fn extracts_voice_permission_scopes_from_principal() {
        let principal = WebRequestPrincipal::builder()
            .tenant_id("100001")
            .user_id("1")
            .app_id("app-1")
            .permission_scope(vec![
                "voice.tasks.read".to_owned(),
                "commerce.orders.read".to_owned(),
            ])
            .build();

        assert_eq!(
            extract_permission_scopes(&principal),
            vec!["voice.tasks.read".to_owned()]
        );
    }

    #[test]
    fn webhook_ingress_context_uses_public_auth_and_trace_id() {
        let context = webhook_ingress_web_request_context("trace-webhook".to_owned());
        assert_eq!(context.resolved_trace_id(), "trace-webhook");
        assert_eq!(context.auth_mode, WebAuthMode::Public);
        assert!(context.principal.is_none());
    }
}
