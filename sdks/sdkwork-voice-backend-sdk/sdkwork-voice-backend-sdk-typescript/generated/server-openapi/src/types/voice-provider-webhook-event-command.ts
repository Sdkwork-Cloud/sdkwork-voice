export interface VoiceProviderWebhookEventCommand {
  eventId?: string;
  providerTaskId?: string;
  signature?: string;
  payload: Record<string, unknown>;
}
