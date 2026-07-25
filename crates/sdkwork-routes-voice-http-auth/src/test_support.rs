use sdkwork_web_core::{
    ServerRequestId, WebApiSurface, WebAuthMode, WebRequestContext, WebRequestPrincipal,
    WebTransportFacts,
};

pub const TEST_TENANT_ID: &str = "100001";
pub const TEST_ORGANIZATION_ID: &str = "200001";
pub const TEST_USER_ID: &str = "1";
pub const TEST_SESSION_ID: &str = "session-1";
pub const TEST_APP_ID: &str = "sdkwork-im-pc";

pub fn test_web_request_context() -> WebRequestContext {
    WebRequestContext {
        idempotency_key: None,
        request_id: ServerRequestId("req-test".to_owned()),
        api_surface: WebApiSurface::AppApi,
        auth_mode: WebAuthMode::DualToken,
        principal: Some(
            WebRequestPrincipal::builder()
                .tenant_id(TEST_TENANT_ID)
                .organization_id(Some(TEST_ORGANIZATION_ID.to_owned()))
                .user_id(TEST_USER_ID)
                .session_id(Some(TEST_SESSION_ID.to_owned()))
                .app_id(TEST_APP_ID)
                .build(),
        ),
        transport: WebTransportFacts {
            path: "/app/v3/api/voice/tasks".to_owned(),
            method: "GET".to_owned(),
            auth_token_present: true,
            access_token_present: true,
            api_key_present: false,
            ingress_token_present: false,
            oauth_bearer_present: false,
            agent_token_present: false,
        },
        locale: None,
        client_kind: None,
        operation: None,
        trace_id: None,
    }
}

pub fn test_backend_web_request_context() -> WebRequestContext {
    WebRequestContext {
        api_surface: WebApiSurface::BackendApi,
        transport: WebTransportFacts {
            path: "/backend/v3/api/voice/tasks".to_owned(),
            ..test_web_request_context().transport
        },
        ..test_web_request_context()
    }
}
