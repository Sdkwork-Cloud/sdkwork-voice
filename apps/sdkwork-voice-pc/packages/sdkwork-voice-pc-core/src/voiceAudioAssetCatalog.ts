export interface VoiceAudioAssetOption {
  id: string;
  name: string;
  description: string;
  previewUrl?: string;
}

export interface VoiceAudioAssetListClient {
  voice: {
    audioAssets: {
      list: (params?: { q?: string; pageSize?: number }) => Promise<{ items?: Record<string, unknown>[] }>;
    };
  };
}

export function mapRecordToVoiceAudioAssetOption(
  item: Record<string, unknown>,
): VoiceAudioAssetOption | null {
  const id = typeof item.id === 'string' ? item.id.trim() : '';
  if (!id) {
    return null;
  }

  const fileName = typeof item.fileName === 'string' && item.fileName.trim()
    ? item.fileName.trim()
    : id;
  const mimeType = typeof item.mimeType === 'string' ? item.mimeType : undefined;
  const previewUrl = typeof item.url === 'string'
    ? item.url
    : typeof item.publicUrl === 'string'
      ? item.publicUrl
      : undefined;

  return {
    id,
    name: fileName,
    description: mimeType ?? 'Voice asset',
    previewUrl,
  };
}

export async function listVoiceAudioAssetOptions(
  client: VoiceAudioAssetListClient,
  params?: { q?: string; pageSize?: number },
): Promise<VoiceAudioAssetOption[]> {
  const page = await client.voice.audioAssets.list({
    q: params?.q?.trim() || undefined,
    pageSize: params?.pageSize ?? 50,
  });
  return (page.items ?? [])
    .map((item) => mapRecordToVoiceAudioAssetOption(item))
    .filter((item): item is VoiceAudioAssetOption => item !== null);
}
