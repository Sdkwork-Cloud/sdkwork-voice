use axum::{
    http::{HeaderName, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use sdkwork_utils_rust::{SdkWorkApiResponse, SdkWorkProblemDetail, SdkWorkResultCode};
use sdkwork_web_core::WebRequestContext;
use serde_json::Value;

use crate::VoiceAuthError;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceRouteError {
    pub status: StatusCode,
    pub result_code: SdkWorkResultCode,
    pub message: String,
}

impl From<VoiceAuthError> for VoiceRouteError {
    fn from(error: VoiceAuthError) -> Self {
        Self {
            status: error.status,
            result_code: SdkWorkResultCode::AuthenticationRequired,
            message: error.message,
        }
    }
}

impl VoiceRouteError {
    pub fn from_wire(status: StatusCode, wire_code: &str, message: impl Into<String>) -> Self {
        Self {
            status,
            result_code: result_code_from_wire(wire_code),
            message: message.into(),
        }
    }

    pub fn into_response_for(self, ctx: &WebRequestContext) -> Response {
        let trace_id = ctx.resolved_trace_id();
        let problem = SdkWorkProblemDetail::platform(self.result_code, self.message, trace_id);
        let mut response = (
            self.status,
            [(axum::http::header::CONTENT_TYPE, "application/problem+json")],
            Json(problem),
        )
            .into_response();
        attach_trace_header(&mut response, &ctx.resolved_trace_id());
        response
    }
}

impl IntoResponse for VoiceRouteError {
    fn into_response(self) -> Response {
        let trace_id = sdkwork_utils_rust::uuid();
        let problem = SdkWorkProblemDetail::platform(self.result_code, self.message, trace_id);
        (
            self.status,
            [(axum::http::header::CONTENT_TYPE, "application/problem+json")],
            Json(problem),
        )
            .into_response()
    }
}

pub fn success_envelope(ctx: &WebRequestContext, status: StatusCode, data: Value) -> Response {
    let trace_id = ctx.resolved_trace_id();
    let envelope = SdkWorkApiResponse::success(data, trace_id.clone());
    let mut response = (status, Json(envelope)).into_response();
    attach_trace_header(&mut response, &trace_id);
    response
}

pub fn finish_success(
    ctx: &WebRequestContext,
    status: StatusCode,
    data: Value,
) -> Result<Response, VoiceRouteError> {
    Ok(success_envelope(ctx, status, data))
}

const VOICE_APP_CREATED_OPERATIONS: &[&str] = &[
    "speech.create",
    "transcriptions.create",
    "translations.create",
    "soundEffects.create",
    "music.create",
    "voiceProfiles.create",
];

const VOICE_BACKEND_CREATED_OPERATIONS: &[&str] = &["providerRoutes.create"];

pub fn success_status_for_voice_app_operation(operation_id: &str) -> StatusCode {
    if VOICE_APP_CREATED_OPERATIONS.contains(&operation_id) {
        StatusCode::CREATED
    } else {
        StatusCode::OK
    }
}

pub fn success_status_for_voice_backend_operation(operation_id: &str) -> StatusCode {
    if VOICE_BACKEND_CREATED_OPERATIONS.contains(&operation_id) {
        StatusCode::CREATED
    } else {
        StatusCode::OK
    }
}

fn attach_trace_header(response: &mut Response, trace_id: &str) {
    if let Ok(value) = HeaderValue::from_str(trace_id) {
        response
            .headers_mut()
            .insert(HeaderName::from_static("x-sdkwork-trace-id"), value);
    }
}

fn result_code_from_wire(wire_code: &str) -> SdkWorkResultCode {
    match wire_code {
        "unauthenticated" => SdkWorkResultCode::AuthenticationRequired,
        "unauthorized" => SdkWorkResultCode::PermissionRequired,
        "not-found" => SdkWorkResultCode::NotFound,
        "conflict" | "invalid-state" => SdkWorkResultCode::Conflict,
        "validation" => SdkWorkResultCode::ValidationError,
        "transport" => SdkWorkResultCode::BadGateway,
        "provider-unavailable" => SdkWorkResultCode::ServiceUnavailable,
        "storage" | "unknown" => SdkWorkResultCode::InternalError,
        _ => SdkWorkResultCode::InternalError,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::to_bytes;
    use sdkwork_web_core::{ServerRequestId, WebApiSurface, WebAuthMode, WebTransportFacts};

    fn test_context() -> WebRequestContext {
        WebRequestContext {
            request_id: ServerRequestId("req-test".to_owned()),
            api_surface: WebApiSurface::AppApi,
            auth_mode: WebAuthMode::DualToken,
            principal: None,
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
            idempotency_key: None,
            trace_id: Some("trace-voice-test".to_owned()),
        }
    }

    #[tokio::test]
    async fn success_envelope_wraps_data_with_zero_code_and_trace_id() {
        let response = success_envelope(
            &test_context(),
            StatusCode::OK,
            serde_json::json!({ "item": { "id": "1" } }),
        );
        let body = to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("body");
        let payload: Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(0, payload["code"].as_i64().unwrap());
        assert_eq!("trace-voice-test", payload["traceId"].as_str().unwrap());
    }

    #[test]
    fn success_status_follows_openapi_contract() {
        assert_eq!(
            StatusCode::CREATED,
            success_status_for_voice_app_operation("speech.create")
        );
        assert_eq!(
            StatusCode::OK,
            success_status_for_voice_app_operation("tasks.list")
        );
        assert_eq!(
            StatusCode::CREATED,
            success_status_for_voice_backend_operation("providerRoutes.create")
        );
    }
}
