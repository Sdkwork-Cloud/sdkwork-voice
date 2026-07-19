//! Gateway assembly for sdkwork-voice.
//! Application bootstrap lives in `bootstrap.rs`; route inventory is in `assembly-manifest.json`.

mod bootstrap;
mod generated;

pub use bootstrap::{
    assemble_application_router, gateway_contract_fallback_config, ApplicationAssembly,
};
pub use sdkwork_voice_embedded_bootstrap::voice_database_readiness_check;

pub fn assembly_route_count() -> usize {
    generated::ROUTE_CRATE_COUNT
}
