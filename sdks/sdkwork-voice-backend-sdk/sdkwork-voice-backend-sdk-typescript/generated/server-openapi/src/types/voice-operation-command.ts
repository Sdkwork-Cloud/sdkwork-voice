import type { MediaResource } from './media-resource';

/** Operation-specific command payload for SDKWork Voice administrative operations and provider extension commands. */
export interface VoiceOperationCommand {
  mediaResource?: MediaResource;
}
