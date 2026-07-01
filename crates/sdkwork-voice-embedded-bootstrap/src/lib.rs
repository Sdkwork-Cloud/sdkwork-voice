//! In-process voice application bootstrap for unified-process platform consumers.

mod bootstrap;

pub use bootstrap::{
    assemble_embedded_voice_application_router, assemble_embedded_voice_application_router_from_env,
    EmbeddedVoiceAssembly,
};
