use sdkwork_voice_local_api_proxy_native::{
    config::{
        create_default_voice_local_api_proxy_config,
        normalize_voice_local_api_proxy_requested_port, VOICE_LOCAL_API_PROXY_DEFAULT_PORT,
    },
    package_boundary_name,
    upstream::{
        build_openai_compatible_voice_upstream_request_url, voice_upstream_auth_header,
        VoiceProxyRouteSnapshot,
    },
};

#[test]
fn exposes_voice_native_boundary_and_default_config() {
    let config = create_default_voice_local_api_proxy_config();

    assert_eq!(package_boundary_name(), "sdkwork-voice-local-api-proxy-native");
    assert_eq!(config.bind_host, "127.0.0.1");
    assert_eq!(config.requested_port, 21381);
    assert!(config.client_api_key.starts_with("sk_sdkwork_voice_proxy_"));
    assert_eq!(
        normalize_voice_local_api_proxy_requested_port(Some(19_999)),
        VOICE_LOCAL_API_PROXY_DEFAULT_PORT
    );
}

#[test]
fn builds_voice_upstream_urls_and_auth_headers() {
    let route = VoiceProxyRouteSnapshot {
        api_key: " sk-test ".to_owned(),
        upstream_base_url: "https://api.openai.com/v1/".to_owned(),
        upstream_protocol: "openai-compatible".to_owned(),
    };

    assert_eq!(
        build_openai_compatible_voice_upstream_request_url(
            &route,
            "/audio/speech",
            Some("organization=demo")
        )
        .unwrap(),
        "https://api.openai.com/v1/audio/speech?organization=demo"
    );
    assert_eq!(
        voice_upstream_auth_header(&route),
        ("authorization", "Bearer sk-test".to_owned())
    );

    let azure = VoiceProxyRouteSnapshot {
        api_key: " azure-key ".to_owned(),
        upstream_base_url: "https://example.openai.azure.com".to_owned(),
        upstream_protocol: "azure-openai".to_owned(),
    };
    assert_eq!(
        build_openai_compatible_voice_upstream_request_url(&azure, "audio/transcriptions", None)
            .unwrap(),
        "https://example.openai.azure.com/openai/v1/audio/transcriptions"
    );
    assert_eq!(
        voice_upstream_auth_header(&azure),
        ("x-api-key", "azure-key".to_owned())
    );
}
