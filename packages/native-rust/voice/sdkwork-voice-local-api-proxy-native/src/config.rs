use std::{fs, path::Path};
use uuid::Uuid;

pub const VOICE_LOCAL_API_PROXY_CONFIG_SCHEMA_VERSION: u32 = 1;
pub const VOICE_LOCAL_API_PROXY_DEFAULT_BIND_HOST: &str = "127.0.0.1";
pub const VOICE_LOCAL_API_PROXY_DEFAULT_PORT: u16 = 21381;
pub const VOICE_LOCAL_API_PROXY_DEFAULT_CLIENT_API_KEY: &str = "sk_sdkwork_voice_proxy_dev";

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoiceLocalApiProxyConfigFile {
    pub schema_version: u32,
    pub bind_host: String,
    pub public_base_host: String,
    pub requested_port: u16,
    pub client_api_key: String,
}

pub fn ensure_voice_local_api_proxy_config(
    config_file_path: &Path,
) -> Result<VoiceLocalApiProxyConfigFile, String> {
    if !config_file_path.exists() {
        let config = create_default_voice_local_api_proxy_config();
        write_voice_local_api_proxy_config_file(config_file_path, &config)?;
        return Ok(config);
    }

    let content = fs::read_to_string(config_file_path).map_err(|error| error.to_string())?;
    let mut config = serde_json::from_str::<VoiceLocalApiProxyConfigFile>(&content)
        .map_err(|error| format!("invalid voice local api proxy config: {error}"))?;

    let normalized_port = normalize_voice_local_api_proxy_requested_port(Some(config.requested_port));
    let mut should_persist = false;
    if config.schema_version != VOICE_LOCAL_API_PROXY_CONFIG_SCHEMA_VERSION {
        config.schema_version = VOICE_LOCAL_API_PROXY_CONFIG_SCHEMA_VERSION;
        should_persist = true;
    }
    if config.bind_host.trim().is_empty() {
        config.bind_host = VOICE_LOCAL_API_PROXY_DEFAULT_BIND_HOST.to_owned();
        should_persist = true;
    }
    if config.public_base_host.trim().is_empty() {
        config.public_base_host = VOICE_LOCAL_API_PROXY_DEFAULT_BIND_HOST.to_owned();
        should_persist = true;
    }
    if config.requested_port != normalized_port {
        config.requested_port = normalized_port;
        should_persist = true;
    }
    if config.client_api_key.trim().is_empty()
        || config.client_api_key == VOICE_LOCAL_API_PROXY_DEFAULT_CLIENT_API_KEY
    {
        config.client_api_key = generate_voice_local_api_proxy_client_api_key();
        should_persist = true;
    }

    if should_persist {
        write_voice_local_api_proxy_config_file(config_file_path, &config)?;
    }

    Ok(config)
}

pub fn create_default_voice_local_api_proxy_config() -> VoiceLocalApiProxyConfigFile {
    VoiceLocalApiProxyConfigFile {
        schema_version: VOICE_LOCAL_API_PROXY_CONFIG_SCHEMA_VERSION,
        bind_host: VOICE_LOCAL_API_PROXY_DEFAULT_BIND_HOST.to_owned(),
        public_base_host: VOICE_LOCAL_API_PROXY_DEFAULT_BIND_HOST.to_owned(),
        requested_port: VOICE_LOCAL_API_PROXY_DEFAULT_PORT,
        client_api_key: generate_voice_local_api_proxy_client_api_key(),
    }
}

pub fn normalize_voice_local_api_proxy_requested_port(raw_requested_port: Option<u16>) -> u16 {
    match raw_requested_port {
        Some(port) if port >= 20_000 => port,
        _ => VOICE_LOCAL_API_PROXY_DEFAULT_PORT,
    }
}

fn write_voice_local_api_proxy_config_file(
    path: &Path,
    config: &VoiceLocalApiProxyConfigFile,
) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::write(
        path,
        format!(
            "{}\n",
            serde_json::to_string_pretty(config).map_err(|error| error.to_string())?
        ),
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

fn generate_voice_local_api_proxy_client_api_key() -> String {
    format!("sk_sdkwork_voice_proxy_{}", Uuid::new_v4().simple())
}
