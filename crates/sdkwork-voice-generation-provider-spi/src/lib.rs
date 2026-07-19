//! Stable provider port for speech generation.

mod error;
mod model;
mod provider;
mod registry;

pub use error::{VoiceGenerationProviderError, VoiceGenerationProviderResult};
pub use model::*;
pub use provider::*;
pub use registry::*;
