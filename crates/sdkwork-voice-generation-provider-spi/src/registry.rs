use std::collections::BTreeMap;
use std::sync::Arc;

use crate::{
    VoiceGenerationProvider, VoiceGenerationProviderError, VoiceGenerationProviderResult,
    VoiceVendorId,
};

#[derive(Clone, Default)]
pub struct VoiceGenerationProviderRegistry {
    providers: BTreeMap<String, Arc<dyn VoiceGenerationProvider>>,
    default_provider_id: Option<String>,
}

impl VoiceGenerationProviderRegistry {
    pub fn builder() -> VoiceGenerationProviderRegistryBuilder {
        VoiceGenerationProviderRegistryBuilder::default()
    }

    pub fn select_for_vendor(
        &self,
        vendor: &VoiceVendorId,
    ) -> VoiceGenerationProviderResult<Arc<dyn VoiceGenerationProvider>> {
        if let Some(provider) = self
            .default_provider_id
            .as_deref()
            .and_then(|id| self.providers.get(id))
            .filter(|provider| provider.descriptor().supports_vendor(vendor))
        {
            return Ok(provider.clone());
        }
        self.providers
            .values()
            .find(|provider| provider.descriptor().supports_vendor(vendor))
            .cloned()
            .ok_or_else(|| VoiceGenerationProviderError::UnsupportedVendor(vendor.to_string()))
    }

    pub fn select_by_id(
        &self,
        provider_id: &str,
    ) -> VoiceGenerationProviderResult<Arc<dyn VoiceGenerationProvider>> {
        self.providers.get(provider_id).cloned().ok_or_else(|| {
            VoiceGenerationProviderError::ProviderNotConfigured(provider_id.to_string())
        })
    }

    pub fn descriptors(&self) -> Vec<crate::VoiceGenerationProviderDescriptor> {
        self.providers
            .values()
            .map(|provider| provider.descriptor().clone())
            .collect()
    }
}

#[derive(Default)]
pub struct VoiceGenerationProviderRegistryBuilder {
    providers: BTreeMap<String, Arc<dyn VoiceGenerationProvider>>,
    default_provider_id: Option<String>,
}

impl VoiceGenerationProviderRegistryBuilder {
    pub fn register(
        mut self,
        provider: Arc<dyn VoiceGenerationProvider>,
    ) -> VoiceGenerationProviderResult<Self> {
        let id = provider.descriptor().id.trim().to_string();
        if id.is_empty() {
            return Err(VoiceGenerationProviderError::Configuration(
                "provider id is required".to_string(),
            ));
        }
        if self.providers.insert(id.clone(), provider).is_some() {
            return Err(VoiceGenerationProviderError::Configuration(format!(
                "duplicate provider id: {id}"
            )));
        }
        Ok(self)
    }

    pub fn default_provider(mut self, provider_id: impl Into<String>) -> Self {
        self.default_provider_id = Some(provider_id.into());
        self
    }

    pub fn build(self) -> VoiceGenerationProviderResult<VoiceGenerationProviderRegistry> {
        if let Some(id) = self.default_provider_id.as_deref() {
            if !self.providers.contains_key(id) {
                return Err(VoiceGenerationProviderError::Configuration(format!(
                    "default provider is not registered: {id}"
                )));
            }
        }
        Ok(VoiceGenerationProviderRegistry {
            providers: self.providers,
            default_provider_id: self.default_provider_id,
        })
    }
}
