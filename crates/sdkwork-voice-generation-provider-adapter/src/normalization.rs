use base64::Engine;
use sdkwork_voice_generation_provider_spi::{
    NormalizedVoiceGenerationResult, VoiceGeneratedAudio, VoiceGeneratedAudioSource,
    VoiceGenerationStatus, VoiceSpeechGenerationCommand,
};

pub(crate) fn normalize_speech_result(
    command: &VoiceSpeechGenerationCommand,
    payload: Vec<u8>,
) -> NormalizedVoiceGenerationResult {
    // create_speech returns raw audio bytes. Keep the legacy text behavior
    // (provider URL passthrough / inline base64) when the payload is a
    // UTF-8 text representation; binary audio payloads are used as-is.
    let source = match std::str::from_utf8(&payload) {
        Ok(text) => {
            let text = text.trim();
            if text.starts_with("http://")
                || text.starts_with("https://")
                || text.starts_with("provider://")
            {
                VoiceGeneratedAudioSource::ProviderUrl(text.to_string())
            } else {
                VoiceGeneratedAudioSource::Inline(decode_inline_payload(text))
            }
        }
        Err(_) => VoiceGeneratedAudioSource::Inline(payload),
    };
    NormalizedVoiceGenerationResult {
        vendor: command.vendor.to_string(),
        provider_task_id: None,
        status: VoiceGenerationStatus::Succeeded,
        terminal: true,
        outputs: vec![VoiceGeneratedAudio {
            output_index: 0,
            source,
            file_name: format!("speech-0000.{}", command.response_format.as_str()),
            mime_type: command.response_format.mime_type().to_string(),
        }],
        error_code: None,
        error_message: None,
    }
}

fn decode_inline_payload(payload: &str) -> Vec<u8> {
    let encoded = payload
        .split_once(";base64,")
        .map(|(_, value)| value)
        .unwrap_or(payload);
    base64::engine::general_purpose::STANDARD
        .decode(encoded)
        .unwrap_or_else(|_| payload.as_bytes().to_vec())
}
