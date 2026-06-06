pub mod config;
pub mod upstream;

pub const NATIVE_BOUNDARY_NAME: &str = "sdkwork-voice-local-api-proxy-native";

pub fn package_boundary_name() -> &'static str {
    NATIVE_BOUNDARY_NAME
}
