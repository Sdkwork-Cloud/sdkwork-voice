//! API assembly for sdkwork-voice.
//! Application bootstrap lives in `bootstrap.rs`; route inventory is in `assembly-manifest.json`.
// SDKWORK-ASSEMBLY-LIB-CUSTOM

mod bootstrap;
mod generated;

pub use bootstrap::{assemble_api_router, ApiAssembly, ApiAssemblyContribution, assemble_api_router_with_pool, assemble_contribution_with_pool, gateway_contract_fallback_config, run_database_migrate_only, web_module, web_module_with_pool};
pub use sdkwork_voice_embedded_bootstrap::voice_database_readiness_check;

pub fn assembly_route_count() -> usize {
    generated::ROUTE_CRATE_COUNT
}
