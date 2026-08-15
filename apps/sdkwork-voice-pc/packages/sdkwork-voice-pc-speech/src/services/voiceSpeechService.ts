import {
  getConfiguredVoiceAppSdkClient,
  listVoiceAudioAssetOptions,
  type SdkworkAppClient,
  type VoiceAudioAssetOption,
} from 'sdkwork-voice-pc-core';

import {
  resolveDefaultSpeechModel,
  resolveDefaultSpeechVoiceId,
} from './voiceSpeechRuntime';

export const PC_VOICE_SPEECH_CONTRACT_UNAVAILABLE =
  'Voice speech synthesis requires text, model, and voice selection through sdkwork-voice-app-sdk.';

export interface VoiceSpeechGenerateInput {
  text: string;
  model?: string;
  voice?: string;
}

export interface VoiceSpeechResult {
  taskId: string;
  status: string;
  audioUrl?: string;
  mimeType?: string;
}

const TERMINAL_TASK_STATUSES = new Set(['succeeded', 'failed', 'cancelled', 'expired']);

function resolveVoiceAppClient(): SdkworkAppClient {
  return getConfiguredVoiceAppSdkClient() as SdkworkAppClient;
}

function buildSpeechCommand(input: VoiceSpeechGenerateInput) {
  const normalizedText = input.text.trim();
  const model = input.model?.trim() || resolveDefaultSpeechModel();
  const voice = input.voice?.trim() || resolveDefaultSpeechVoiceId();

  if (!normalizedText || !model || !voice) {
    throw new Error(PC_VOICE_SPEECH_CONTRACT_UNAVAILABLE);
  }

  return {
    input: normalizedText,
    model,
    voice,
  };
}

function readTaskId(payload: Record<string, unknown>): string | null {
  const directId = payload.id ?? payload.taskId;
  if (typeof directId === 'string' && directId.trim()) {
    return directId;
  }
  if (typeof directId === 'number') {
    return String(directId);
  }
  return null;
}

function readMediaUrl(mediaResource: unknown): { url?: string; mimeType?: string } {
  if (!mediaResource || typeof mediaResource !== 'object' || Array.isArray(mediaResource)) {
    return {};
  }
  const resource = mediaResource as Record<string, unknown>;
  const urlCandidate =
    resource.url ??
    resource.sourceUri ??
    resource.source ??
    resource.playbackUrl ??
    resource.downloadUrl;
  const mimeType = resource.mimeType;
  return {
    url: typeof urlCandidate === 'string' && urlCandidate.trim() ? urlCandidate : undefined,
    mimeType: typeof mimeType === 'string' ? mimeType : undefined,
  };
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class VoiceSpeechService {
  async listVoiceOptions(): Promise<VoiceAudioAssetOption[]> {
    return listVoiceAudioAssetOptions(resolveVoiceAppClient());
  }

  async generate(input: VoiceSpeechGenerateInput): Promise<Record<string, unknown>> {
    const command = buildSpeechCommand(input);
    return resolveVoiceAppClient().voice.speech.create(command);
  }

  async generateAndWait(
    input: VoiceSpeechGenerateInput,
    options?: { pollIntervalMs?: number; timeoutMs?: number },
  ): Promise<VoiceSpeechResult> {
    const pollIntervalMs = options?.pollIntervalMs ?? 1_500;
    const timeoutMs = options?.timeoutMs ?? 120_000;
    const created = await this.generate(input);
    const taskId = readTaskId(created);
    if (!taskId) {
      throw new Error('Speech task was accepted but no task id was returned.');
    }

    const client = resolveVoiceAppClient();
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const task = await client.voice.tasks.retrieve(taskId);
      const status = typeof task.status === 'string' ? task.status : 'queued';

      if (status === 'failed') {
        const message =
          typeof task.errorMessage === 'string'
            ? task.errorMessage
            : 'Speech synthesis failed.';
        throw new Error(message);
      }

      if (TERMINAL_TASK_STATUSES.has(status)) {
        const assets = await client.voice.audioAssets.list({ taskId, page: 1, pageSize: 10 });
        const firstAsset = Array.isArray(assets.items) ? assets.items[0] : undefined;
        if (firstAsset && typeof firstAsset === 'object' && !Array.isArray(firstAsset)) {
          const assetRecord = firstAsset as Record<string, unknown>;
          const assetId =
            typeof assetRecord.id === 'string'
              ? assetRecord.id
              : typeof assetRecord.id === 'number'
                ? String(assetRecord.id)
                : null;
          const inlineMedia = readMediaUrl(assetRecord.mediaResource);
          if (inlineMedia.url) {
            return { taskId, status, audioUrl: inlineMedia.url, mimeType: inlineMedia.mimeType };
          }
          if (assetId) {
            const asset = await client.voice.audioAssets.retrieve(assetId);
            const media = readMediaUrl(asset.mediaResource);
            if (media.url) {
              return { taskId, status, audioUrl: media.url, mimeType: media.mimeType };
            }
          }
        }
        return { taskId, status };
      }

      await delay(pollIntervalMs);
    }

    throw new Error(`Speech synthesis timed out after ${timeoutMs}ms (taskId: ${taskId}).`);
  }
}

export const voiceSpeechService = new VoiceSpeechService();
