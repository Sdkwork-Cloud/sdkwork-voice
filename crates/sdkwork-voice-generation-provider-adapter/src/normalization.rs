use base64::Engine;
use sdkwork_voice_generation_provider_spi::{
    NormalizedVoiceGenerationResult, VoiceGeneratedAudio, VoiceGeneratedAudioSource,
    VoiceGenerationStatus, VoiceSpeechGenerationCommand,
};

pub(crate) fn normalize_speech_result(
    command: &VoiceSpeechGenerationCommand,
    payload: String,
) -> NormalizedVoiceGenerationResult {
    let payload = payload.trim().to_string();
    let source = if payload.starts_with("http://")
        || payload.starts_with("https://")
        || payload.starts_with("provider://")
    {
        VoiceGeneratedAudioSource::ProviderUrl(payload)
    } else {
        VoiceGeneratedAudioSource::Inline(decode_inline_payload(&payload))
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
