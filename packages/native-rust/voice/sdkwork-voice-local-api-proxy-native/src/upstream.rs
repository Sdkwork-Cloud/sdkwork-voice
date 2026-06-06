#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoiceProxyRouteSnapshot {
    pub api_key: String,
    pub upstream_base_url: String,
    pub upstream_protocol: String,
}

pub fn build_openai_compatible_voice_upstream_request_url(
    route: &VoiceProxyRouteSnapshot,
    endpoint_suffix: &str,
    query: Option<&str>,
) -> Result<String, String> {
    let base = normalize_openai_compatible_voice_upstream_base_url(route);
    let mut url = format!(
        "{}/{}",
        base.trim_end_matches('/'),
        endpoint_suffix.trim_start_matches('/')
    );
    if let Some(query) = query.map(str::trim).filter(|value| !value.is_empty()) {
        url.push('?');
        url.push_str(query);
    }
    Ok(url)
}

pub fn voice_upstream_auth_header(route: &VoiceProxyRouteSnapshot) -> (&'static str, String) {
    if route.upstream_protocol == "azure-openai" {
        ("x-api-key", route.api_key.trim().to_owned())
    } else {
        ("authorization", format!("Bearer {}", route.api_key.trim()))
    }
}

fn normalize_openai_compatible_voice_upstream_base_url(route: &VoiceProxyRouteSnapshot) -> String {
    let trimmed = route.upstream_base_url.trim().trim_end_matches('/');
    if route.upstream_protocol != "azure-openai" {
        return trimmed.to_owned();
    }

    if trimmed.ends_with("/openai/v1") {
        return trimmed.to_owned();
    }
    if trimmed.ends_with("/openai") {
        return format!("{trimmed}/v1");
    }

    format!("{trimmed}/openai/v1")
}
