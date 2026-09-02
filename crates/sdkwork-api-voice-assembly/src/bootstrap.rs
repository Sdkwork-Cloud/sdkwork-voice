//! API assembly bootstrap for sdkwork-voice.
//! Authored bootstrap preserved by the assembly materializer.
//!
//! The assembly exports the indivisible `ApiAssemblyContribution` contract
//! (API_ASSEMBLY_SPEC.md §4): the executable business router, the combined
//! route manifest inventory, the derived OpenAPI document, the permission
//! catalog, domain context injectors, and the readiness check.

use axum::Router;
use sdkwork_web_bootstrap::{ContractFallbackConfig, DatabasePoolReadinessCheck, WebModule};
use sdkwork_web_core::HttpRouteManifest;
use std::sync::Arc;

pub use sdkwork_web_bootstrap::ApiAssemblyContribution;

pub type ApiAssembly = ApiAssemblyContribution;

fn contribution_from_router_and_pool(
    router: Router,
    voice_pool: sdkwork_database_sqlx::DatabasePool,
) -> Result<ApiAssembly, String> {
    let mut routes = Vec::new();
    routes.extend_from_slice(sdkwork_routes_voice_app_api::gateway_route_manifest().routes());
    routes.extend_from_slice(sdkwork_routes_voice_backend_api::gateway_route_manifest().routes());
    ApiAssemblyContribution::from_manifest(
        "sdkwork-voice",
        "SDKWork Voice API",
        router,
        HttpRouteManifest::from_owned_routes(routes),
        Vec::new(),
        Arc::new(DatabasePoolReadinessCheck::new(voice_pool)),
    )
}

pub async fn assemble_api_router() -> Result<ApiAssembly, String> {
    let assembly =
        sdkwork_voice_embedded_bootstrap::assemble_embedded_voice_application_router_from_env()
            .await?;
    contribution_from_router_and_pool(assembly.router, assembly.voice_pool)
}

/// Assemble the voice contribution against a caller-provided database pool so the
/// platform cloud gateway can share its process-wide PostgreSQL pool.
pub async fn assemble_api_router_with_pool(
    pool: sdkwork_database_sqlx::DatabasePool,
) -> Result<ApiAssembly, String> {
    let assembly =
        sdkwork_voice_embedded_bootstrap::assemble_embedded_voice_application_router(pool).await?;
    contribution_from_router_and_pool(assembly.router, assembly.voice_pool)
}

/// Build the complete host-neutral voice contribution for gateway embedding.
pub async fn assemble_contribution_with_pool(
    pool: sdkwork_database_sqlx::DatabasePool,
) -> Result<ApiAssemblyContribution, String> {
    assemble_api_router_with_pool(pool).await
}

pub fn gateway_contract_fallback_config() -> ContractFallbackConfig {
    let app_manifest = sdkwork_routes_voice_app_api::gateway_route_manifest();
    let backend_manifest = sdkwork_routes_voice_backend_api::gateway_route_manifest();

    let mut config = ContractFallbackConfig::from_manifest(&app_manifest);
    config.manifest_paths.extend(
        ContractFallbackConfig::from_manifest(&backend_manifest)
            .manifest_paths
            .into_iter(),
    );
    config
}

/// Database migration-only lifecycle for the `db-migrate` CLI mode of the
/// thin standalone gateway. The assembly owns database bootstrap concerns
/// (API_ASSEMBLY_SPEC §6.1); the gateway must not import implementation
/// crates such as `sdkwork-voice-database-host`.
pub async fn run_database_migrate_only() -> Result<(), String> {
    std::env::set_var("SDKWORK_DATABASE_AUTO_MIGRATE", "true");
    sdkwork_voice_database_host::bootstrap_voice_database_from_env().await?;
    tracing::info!("voice database migration completed");
    Ok(())
}

/// Canonical Web Module definition for this application
/// (API_ASSEMBLY_SPEC §4.1.1): the complete HTTP surface — every route,
/// manifest, and OpenAPI document of this owner — as one installable module.
pub async fn web_module() -> Result<WebModule, String> {
    Ok(WebModule::from_contribution(assemble_api_router().await?))
}

/// Same as [`web_module`] but composed on a process-shared database pool
/// (platform gateways, API_ASSEMBLY_SPEC §4.1.1).
pub async fn web_module_with_pool(
    pool: sdkwork_database_sqlx::DatabasePool,
) -> Result<WebModule, String> {
    Ok(WebModule::from_contribution(assemble_api_router_with_pool(pool).await?))
}
