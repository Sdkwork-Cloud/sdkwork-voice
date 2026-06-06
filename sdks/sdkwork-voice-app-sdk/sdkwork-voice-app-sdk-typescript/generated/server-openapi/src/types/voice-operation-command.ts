import type { MediaResource } from './media-resource';

/** Operation-specific command payload for SDKWork Voice speech, transcription, translation, provider route, and artifact operations. */
export interface VoiceOperationCommand {
  mediaResource?: MediaResource;
}
