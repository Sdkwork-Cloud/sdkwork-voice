import { describe, expect, it } from "vitest";
import {
  createCloudRouterVoiceProviderAdapter,
  normalizeVoiceProviderGeneratedArtifacts,
  type CloudRouterVoiceProviderClient,
} from "../src/index.ts";

describe("@sdkwork/voice-provider-adapter", () => {
  it("normalizes OpenAI-compatible image lists for multi-output Drive ingestion", () => {
    const artifacts = normalizeVoiceProviderGeneratedArtifacts(
      {
        data: [
          {
            mime_type: "image/png",
            revised_prompt: "A refined prompt",
            url: "https://cdn.example.test/image-a.png",
          },
          {
            b64_json: "AQIDBA==",
            mime_type: "image/png",
          },
        ],
      },
      "openai",
      { kind: "image", mediaKind: "image", operation: "image" },
    );

    expect(artifacts).toMatchObject([
      {
        artifactIndex: 0,
        fileName: "image-0000.png",
        kind: "image",
        metadata: { revisedPrompt: "A refined prompt" },
        source: "external_url",
        sourceUri: "https://cdn.example.test/image-a.png",
      },
      {
        artifactIndex: 1,
        contentLength: 4,
        fileName: "image-0001.png",
        kind: "image",
        source: "data_url",
      },
    ]);
  });

  it("invokes cloud-router generated SDK surfaces for OpenAI-compatible speech", async () => {
    const calls: unknown[] = [];
    const client: CloudRouterVoiceProviderClient = {
      audio: {
        speech: {
          async create(body) {
            calls.push(body);
            return new Blob(["audio"], { type: "audio/mpeg" });
          },
        },
      },
    };
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

    const result = await adapter.startSpeech({
      input: "hello",
      model: "gpt-4o-mini-tts",
      responseFormat: "mp3",
      voice: "alloy",
    });

    expect(result.status).toBe("completed");
    expect(result.providerCode).toBe("openai");
    expect(calls).toEqual([
      {
        input: "hello",
        model: "gpt-4o-mini-tts",
        response_format: "mp3",
        voice: "alloy",
      },
    ]);
  });

  it("calls generated SDK methods with their owning resource binding", async () => {
    class BoundSpeechResource {
      readonly calls: unknown[] = [];

      async create(body: unknown) {
        this.calls.push(body);
        return new Blob(["audio"], { type: "audio/mpeg" });
      }
    }

    const speech = new BoundSpeechResource();
    const client = {
      audio: {
        speech,
      },
    } as CloudRouterVoiceProviderClient;
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

    await adapter.startSpeech({
      input: "hello",
      model: "gpt-4o-mini-tts",
      voice: "alloy",
    });

    expect(speech.calls).toEqual([
      {
        input: "hello",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    ]);
  });

  it("normalizes synchronous speech bytes into generated artifacts for Drive ingestion", async () => {
    const client: CloudRouterVoiceProviderClient = {
      audio: {
        speech: {
          async create() {
            return new Blob(["audio"], { type: "audio/mpeg" });
          },
        },
      },
    };
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

    const result = await adapter.startSpeech({
      input: "hello",
      model: "gpt-4o-mini-tts",
      responseFormat: "mp3",
      voice: "alloy",
    });

    expect(result).toMatchObject({
      generatedArtifacts: [
        {
          artifactIndex: 0,
          contentLength: 5,
          fileName: "speech-0000.mp3",
          kind: "audio",
          mediaKind: "audio",
          mimeType: "audio/mpeg",
          providerCode: "openai",
          source: "generated",
          sourceUri: "provider://openai/speech/0000",
        },
      ],
      status: "completed",
    });
  });

  it("uses cloud-router generated SDK surfaces for voice catalog operations", async () => {
    const calls: unknown[] = [];
    const client: CloudRouterVoiceProviderClient = {
      audio: {
        voices: {
          async create(body) {
            calls.push(["create", body]);
            return {
              id: "voice-created",
              name: "Narrator",
              object: "voice",
            };
          },
          async list(params) {
            calls.push(["list", params]);
            return {
              data: [{ id: "voice-a", object: "voice" }],
              object: "list",
            };
          },
          async retrieve(voiceId) {
            calls.push(["retrieve", voiceId]);
            return {
              id: voiceId,
              object: "voice",
              status: "ready",
            };
          },
        },
      },
    };
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

    const listResult = await adapter.listVoices({ limit: 20, order: "asc", provider: { providerCode: "openai" } });
    const createResult = await adapter.createVoice({
      description: "Studio narrator",
      metadata: { locale: "en-US" },
      name: "Narrator",
    });
    const retrieveResult = await adapter.retrieveVoice({ voiceId: "voice-a" });

    expect(calls).toEqual([
      ["list", { limit: 20, order: "asc" }],
      ["create", { description: "Studio narrator", metadata: { locale: "en-US" }, name: "Narrator" }],
      ["retrieve", "voice-a"],
    ]);
    expect(listResult).toMatchObject({
      providerCode: "openai",
      providerResponse: {
        object: "list",
      },
    });
    expect(createResult).toMatchObject({
      providerCode: "openai",
      providerResponse: {
        id: "voice-created",
        object: "voice",
      },
    });
    expect(retrieveResult).toMatchObject({
      providerCode: "openai",
      providerResponse: {
        id: "voice-a",
        object: "voice",
      },
    });
  });

  it("uses cloud-router generated SDK surfaces for voice consent operations", async () => {
    const calls: unknown[] = [];
    const client: CloudRouterVoiceProviderClient = {
      audio: {
        voiceConsents: {
          async create(body) {
            calls.push(["create", body]);
            return {
              id: "consent-created",
              object: "voice.consent",
            };
          },
          async delete(consentId) {
            calls.push(["delete", consentId]);
            return {
              deleted: true,
              id: consentId,
              object: "voice.consent.deleted",
            };
          },
          async list(params) {
            calls.push(["list", params]);
            return {
              data: [{ id: "consent-a", object: "voice.consent" }],
              object: "list",
            };
          },
          async retrieve(consentId) {
            calls.push(["retrieve", consentId]);
            return {
              id: consentId,
              object: "voice.consent",
              status: "active",
            };
          },
          async update(consentId, body) {
            calls.push(["update", consentId, body]);
            return {
              id: consentId,
              name: "Updated consent",
              object: "voice.consent",
            };
          },
        },
      },
    };
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

    await adapter.listVoiceConsents({ after: "consent-0", limit: 10 });
    await adapter.createVoiceConsent({
      consentDocument: { signer: "Jane Doe" },
      metadata: { source: "studio" },
      name: "Primary consent",
    });
    await adapter.retrieveVoiceConsent({ consentId: "consent-a" });
    await adapter.updateVoiceConsent({
      consentId: "consent-a",
      metadata: { source: "updated" },
      name: "Updated consent",
    });
    const deleteResult = await adapter.deleteVoiceConsent({ consentId: "consent-a" });

    expect(calls).toEqual([
      ["list", { after: "consent-0", limit: 10 }],
      [
        "create",
        {
          consent_document: { signer: "Jane Doe" },
          metadata: { source: "studio" },
          name: "Primary consent",
        },
      ],
      ["retrieve", "consent-a"],
      ["update", "consent-a", { metadata: { source: "updated" }, name: "Updated consent" }],
      ["delete", "consent-a"],
    ]);
    expect(deleteResult).toMatchObject({
      providerCode: "openai",
      providerResponse: {
        deleted: true,
        id: "consent-a",
      },
    });
  });

  it("normalizes OpenAI-compatible transcription text into a transcript artifact", async () => {
    const calls: unknown[] = [];
    const file = new Blob(["audio"], { type: "audio/mpeg" });
    const expectedTranscriptPayload = {
      duration: 1.2,
      language: "en",
      segments: [{ end: 1.2, start: 0, text: "hello world" }],
      text: "hello world",
      words: [{ end: 0.4, start: 0, word: "hello" }],
    };
    const expectedTranscriptJson = JSON.stringify(expectedTranscriptPayload);
    const client: CloudRouterVoiceProviderClient = {
      audio: {
        transcriptions: {
          async create(body) {
            calls.push(body);
            return expectedTranscriptPayload;
          },
        },
      },
    };
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

    const result = await adapter.startTranscription({
      file,
      model: "whisper-1",
      responseFormat: "verbose_json",
    });

    expect(calls).toEqual([
      {
        file,
        model: "whisper-1",
        response_format: "verbose_json",
      },
    ]);
    expect(result).toMatchObject({
      generatedArtifacts: [
        {
          artifactIndex: 0,
          contentLength: new TextEncoder().encode(expectedTranscriptJson).length,
          durationSeconds: 1.2,
          fileName: "transcription-0000.json",
          kind: "transcript",
          mediaKind: "voice",
          metadata: {
            language: "en",
            segments: [{ end: 1.2, start: 0, text: "hello world" }],
            words: [{ end: 0.4, start: 0, word: "hello" }],
          },
          mimeType: "application/json",
          providerCode: "openai",
          source: "data_url",
          sourceUri: `data:application/json;charset=utf-8,${encodeURIComponent(expectedTranscriptJson)}`,
        },
      ],
      providerCode: "openai",
      status: "completed",
    });
  });

  it("normalizes OpenAI-compatible translation text into a translation artifact", async () => {
    const client: CloudRouterVoiceProviderClient = {
      audio: {
        translations: {
          async create() {
            return {
              duration: 2,
              segments: [{ end: 2, start: 0, text: "bonjour le monde" }],
              text: "bonjour le monde",
            };
          },
        },
      },
    };
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

    const result = await adapter.startTranslation({
      file: new Blob(["audio"], { type: "audio/mpeg" }),
      model: "whisper-1",
      responseFormat: "text",
    });

    expect(result).toMatchObject({
      generatedArtifacts: [
        {
          artifactIndex: 0,
          contentLength: 16,
          durationSeconds: 2,
          fileName: "translation-0000.txt",
          kind: "translation",
          mediaKind: "voice",
          metadata: {
            segments: [{ end: 2, start: 0, text: "bonjour le monde" }],
          },
          mimeType: "text/plain",
          providerCode: "openai",
          source: "data_url",
          sourceUri: "data:text/plain;charset=utf-8,bonjour%20le%20monde",
        },
      ],
      providerCode: "openai",
      status: "completed",
    });
  });

  it("normalizes plain text transcription responses into transcript artifacts", async () => {
    const client: CloudRouterVoiceProviderClient = {
      audio: {
        transcriptions: {
          async create() {
            return "plain transcript";
          },
        },
      },
    };
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

    const result = await adapter.startTranscription({
      file: new Blob(["audio"], { type: "audio/mpeg" }),
      model: "whisper-1",
      responseFormat: "text",
    });

    expect(result.generatedArtifacts).toMatchObject([
      {
        artifactIndex: 0,
        contentLength: 16,
        fileName: "transcription-0000.txt",
        kind: "transcript",
        mediaKind: "voice",
        mimeType: "text/plain",
        providerCode: "openai",
        source: "data_url",
        sourceUri: "data:text/plain;charset=utf-8,plain%20transcript",
      },
    ]);
  });

  it("creates realtime transcription sessions through the typed cloud-router SDK", async () => {
    const bodies: unknown[] = [];
    const client = {
      realtime: {
        transcriptionSessions: {
          async create(body: unknown) {
            bodies.push(body);
            return {
              client_secret: { expires_at: 1_800_000_000, value: "ephemeral-secret" },
              id: "rt-transcription-session-1",
              input_audio_format: "pcm16",
              object: "realtime.transcription_session",
            };
          },
        },
      },
    } as CloudRouterVoiceProviderClient;
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

    const result = await adapter.startRealtimeTranscriptionSession({
      inputAudioFormat: "pcm16",
      inputAudioTranscription: { model: "whisper-1" },
      metadata: { taskId: "voice-task-rt-1" },
      model: "gpt-4o-realtime-preview",
      turnDetection: { type: "server_vad" },
    });

    expect(bodies).toEqual([
      {
        input_audio_format: "pcm16",
        input_audio_transcription: { model: "whisper-1" },
        metadata: { taskId: "voice-task-rt-1" },
        model: "gpt-4o-realtime-preview",
        turn_detection: { type: "server_vad" },
      },
    ]);
    expect(result).toMatchObject({
      providerCode: "openai",
      providerResponse: {
        id: "rt-transcription-session-1",
        object: "realtime.transcription_session",
      },
      status: "completed",
    });
  });

  it("creates realtime translation sessions through the typed cloud-router SDK", async () => {
    const bodies: unknown[] = [];
    const client = {
      realtime: {
        translations: {
          async create(body: unknown) {
            bodies.push(body);
            return {
              client_secret: { expires_at: 1_800_000_000, value: "translation-secret" },
              id: "rt-translation-session-1",
              object: "realtime.translation_session",
              source_language: "en",
              target_language: "fr",
            };
          },
        },
      },
    } as CloudRouterVoiceProviderClient;
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

    const result = await adapter.startRealtimeTranslationSession({
      metadata: { taskId: "voice-task-rt-2" },
      model: "gpt-4o-realtime-preview",
      sourceLanguage: "en",
      targetLanguage: "fr",
    });

    expect(bodies).toEqual([
      {
        metadata: { taskId: "voice-task-rt-2" },
        model: "gpt-4o-realtime-preview",
        source_language: "en",
        target_language: "fr",
      },
    ]);
    expect(result).toMatchObject({
      providerCode: "openai",
      providerResponse: {
        id: "rt-translation-session-1",
        object: "realtime.translation_session",
      },
      status: "completed",
    });
  });

  it("creates generic realtime sessions, client secrets, and calls through typed cloud-router SDK surfaces", async () => {
    const calls: unknown[] = [];
    const client = {
      realtime: {
        calls: {
          accept: {
            async create(callId: string, body: unknown) {
              calls.push(["call.accept", callId, body]);
              return { id: callId, object: "realtime.call", status: "accepted" };
            },
          },
          async create(body: unknown) {
            calls.push(["call.create", body]);
            return { sdp: "answer-sdp" };
          },
          hangup: {
            async create(callId: string, body: unknown) {
              calls.push(["call.hangup", callId, body]);
              return { id: callId, object: "realtime.call", status: "ended" };
            },
          },
          refer: {
            async create(callId: string, body: unknown) {
              calls.push(["call.refer", callId, body]);
              return { id: callId, object: "realtime.call", status: "referred" };
            },
          },
          reject: {
            async create(callId: string, body: unknown) {
              calls.push(["call.reject", callId, body]);
              return { id: callId, object: "realtime.call", status: "rejected" };
            },
          },
        },
        clientSecrets: {
          async create(body: unknown) {
            calls.push(["clientSecret.create", body]);
            return {
              client_secret: { expires_at: 1_800_000_000, value: "realtime-secret" },
              object: "realtime.client_secret",
            };
          },
        },
        sessions: {
          async create(body: unknown) {
            calls.push(["session.create", body]);
            return {
              id: "rt-session-1",
              model: "gpt-4o-realtime-preview",
              object: "realtime.session",
            };
          },
        },
      },
    } as CloudRouterVoiceProviderClient;
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

    const session = await adapter.startRealtimeSession({
      instructions: "Keep responses concise.",
      metadata: { taskId: "voice-task-rt-session" },
      modalities: ["audio", "text"],
      model: "gpt-4o-realtime-preview",
      provider: {
        providerOptions: { temperature: 0.6 },
      },
      voice: "alloy",
    });
    const clientSecret = await adapter.createRealtimeClientSecret({
      instructions: "Issue a browser client secret.",
      metadata: { taskId: "voice-task-rt-secret" },
      modalities: ["audio"],
      model: "gpt-4o-realtime-preview",
      voice: "verse",
    });
    const call = await adapter.startRealtimeCall({
      metadata: { taskId: "voice-task-call" },
      sdp: "offer-sdp",
      session: { model: "gpt-4o-realtime-preview", voice: "alloy" },
    });
    const accepted = await adapter.acceptRealtimeCall({ callId: "call-1", metadata: { reason: "ready" } });
    const referred = await adapter.referRealtimeCall({
      callId: "call-1",
      metadata: { handoff: "support" },
      target: "sip:support@example.test",
    });
    const rejected = await adapter.rejectRealtimeCall({ callId: "call-2", metadata: { reason: "busy" } });
    const hungUp = await adapter.hangupRealtimeCall({ callId: "call-1", metadata: { reason: "complete" } });

    expect(calls).toEqual([
      [
        "session.create",
        {
          instructions: "Keep responses concise.",
          metadata: { taskId: "voice-task-rt-session" },
          modalities: ["audio", "text"],
          model: "gpt-4o-realtime-preview",
          temperature: 0.6,
          voice: "alloy",
        },
      ],
      [
        "clientSecret.create",
        {
          instructions: "Issue a browser client secret.",
          metadata: { taskId: "voice-task-rt-secret" },
          modalities: ["audio"],
          model: "gpt-4o-realtime-preview",
          voice: "verse",
        },
      ],
      [
        "call.create",
        {
          metadata: { taskId: "voice-task-call" },
          sdp: "offer-sdp",
          session: { model: "gpt-4o-realtime-preview", voice: "alloy" },
        },
      ],
      ["call.accept", "call-1", { metadata: { reason: "ready" } }],
      ["call.refer", "call-1", { metadata: { handoff: "support" }, target: "sip:support@example.test" }],
      ["call.reject", "call-2", { metadata: { reason: "busy" } }],
      ["call.hangup", "call-1", { metadata: { reason: "complete" } }],
    ]);
    expect(session).toMatchObject({ providerCode: "openai", status: "completed" });
    expect(clientSecret).toMatchObject({ providerCode: "openai", status: "completed" });
    expect(call).toMatchObject({ providerCode: "openai", status: "completed" });
    expect(accepted.providerResponse).toMatchObject({ status: "accepted" });
    expect(referred.providerResponse).toMatchObject({ status: "referred" });
    expect(rejected.providerResponse).toMatchObject({ status: "rejected" });
    expect(hungUp.providerResponse).toMatchObject({ status: "ended" });
  });

  it("starts Suno music tasks through the typed cloud-router SDK", async () => {
    const bodies: unknown[] = [];
    const client: CloudRouterVoiceProviderClient = {
      audioSuno: {
        v1: {
          music: {
            generations: {
              async create(body) {
                bodies.push(body);
                return { status: "queued", task_id: "suno-task-1" };
              },
            },
          },
        },
      },
    };
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "suno" });

    const result = await adapter.startMusic({
      callbackUrl: "https://voice.example/webhook",
      durationSeconds: 30,
      model: "suno-v5",
      prompt: "short piano theme",
      title: "Theme",
    });

    expect(result).toMatchObject({
      providerCode: "suno",
      providerTaskId: "suno-task-1",
      status: "task_started",
    });
    expect(bodies).toEqual([
      {
        callback_url: "https://voice.example/webhook",
        duration: 30,
        model: "suno-v5",
        prompt: "short piano theme",
        title: "Theme",
      },
    ]);
  });

  it("normalizes completed Suno task tracks into ordered music, image, and video artifacts", async () => {
    const client: CloudRouterVoiceProviderClient = {
      audioSuno: {
        v1: {
          music: {
            generations: {
              async create() {
                return { status: "queued", task_id: "suno-task-1" };
              },
              async retrieve() {
                return {
                  status: "complete",
                  task_id: "suno-task-1",
                  tracks: [
                    {
                      audio_url: "https://cdn.example.test/song-a.mp3",
                      duration: 31,
                      id: "track-a",
                      image_url: "https://cdn.example.test/song-a.png",
                      title: "Track A",
                      video_url: "https://cdn.example.test/song-a.mp4",
                    },
                    {
                      audio_url: "https://cdn.example.test/song-b.wav",
                      duration: 28,
                      id: "track-b",
                      title: "Track B",
                    },
                  ],
                };
              },
            },
          },
        },
      },
    };
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "suno" });

    const snapshot = await adapter.queryTask({ providerCode: "suno", providerTaskId: "suno-task-1" });

    expect(snapshot.generatedArtifacts).toMatchObject([
      {
        artifactIndex: 0,
        durationSeconds: 31,
        fileName: "track-a-0000.mp3",
        kind: "music",
        mediaKind: "audio",
        providerAssetId: "track-a",
        source: "external_url",
        sourceUri: "https://cdn.example.test/song-a.mp3",
        title: "Track A",
      },
      {
        artifactIndex: 1,
        fileName: "track-a-cover-0001.png",
        kind: "image",
        mediaKind: "image",
        providerAssetId: "track-a",
        sourceUri: "https://cdn.example.test/song-a.png",
      },
      {
        artifactIndex: 2,
        fileName: "track-a-video-0002.mp4",
        kind: "video",
        mediaKind: "video",
        providerAssetId: "track-a",
        sourceUri: "https://cdn.example.test/song-a.mp4",
      },
      {
        artifactIndex: 3,
        durationSeconds: 28,
        fileName: "track-b-0003.wav",
        kind: "music",
        mediaKind: "audio",
        providerAssetId: "track-b",
        sourceUri: "https://cdn.example.test/song-b.wav",
        title: "Track B",
      },
    ]);
  });

  it("starts Volcengine provider tasks when the provider route requests Volcengine", async () => {
    const bodies: unknown[] = [];
    const client: CloudRouterVoiceProviderClient = {
      videosVolcengine: {
        api: {
          v3: {
            contents: {
              generations: {
                tasks: {
                  async create(body) {
                    bodies.push(body);
                    return { id: "volc-task-1", task_id: "volc-task-1" };
                  },
                },
              },
            },
          },
        },
      },
    };
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "volcengine" });

    const result = await adapter.startMusic({
      model: "doubao-music",
      prompt: "ambient intro",
      provider: { providerCode: "volcengine" },
    });

    expect(result.status).toBe("task_started");
    expect(result.providerTaskId).toBe("volc-task-1");
    expect(bodies).toEqual([
      {
        content: [{ text: "ambient intro", type: "text" }],
        model: "doubao-music",
      },
    ]);
  });

  it("starts Kling, Nano Banana, and Midjourney provider tasks through typed cloud-router SDK surfaces", async () => {
    const calls: unknown[] = [];
    const client = {
      imagesMidjourney: {
        v1: {
          images: {
            generations: {
              async create(body: unknown) {
                calls.push(["midjourney", body]);
                return { status: "queued", task_id: "midjourney-task-1" };
              },
            },
          },
        },
      },
      imagesNanoBanana: {
        v1: {
          images: {
            generations: {
              async create(body: unknown) {
                calls.push(["nano-banana", body]);
                return { status: "queued", task_id: "nano-task-1" };
              },
            },
          },
        },
      },
      videosKling: {
        v1: {
          videos: {
            generations: {
              async create(body: unknown) {
                calls.push(["kling", body]);
                return { status: "queued", task_id: "kling-task-1" };
              },
            },
          },
        },
      },
    } as unknown as CloudRouterVoiceProviderClient;
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "suno" });

    const klingResult = await adapter.startMusic({
      callbackUrl: "https://voice.example/kling-webhook",
      durationSeconds: 5,
      model: "kling-v1",
      negativeTags: "blur",
      prompt: "camera move around a product",
      provider: {
        providerCode: "kling",
        providerOptions: {
          aspect_ratio: "16:9",
          cfg_scale: 0.5,
          image: "https://cdn.example.test/start.png",
          mode: "std",
        },
      },
    });
    const nanoResult = await adapter.startMusic({
      callbackUrl: "https://voice.example/nano-webhook",
      model: "nano-banana",
      prompt: "studio product image",
      provider: {
        providerCode: "nano-banana",
        providerOptions: {
          aspect_ratio: "1:1",
          images: ["https://cdn.example.test/reference.png"],
          seed: "seed-1",
          size: "1024x1024",
        },
      },
    });
    const midjourneyResult = await adapter.startMusic({
      model: "midjourney-v7",
      prompt: "editorial product image",
      provider: {
        providerCode: "midjourney",
        providerOptions: {
          aspect_ratio: "4:5",
          seed: "seed-2",
          style: "raw",
        },
      },
    });

    expect(klingResult).toMatchObject({
      providerCode: "kling",
      providerTaskId: "kling-task-1",
      status: "task_started",
    });
    expect(nanoResult).toMatchObject({
      providerCode: "nano-banana",
      providerTaskId: "nano-task-1",
      status: "task_started",
    });
    expect(midjourneyResult).toMatchObject({
      providerCode: "midjourney",
      providerTaskId: "midjourney-task-1",
      status: "task_started",
    });
    expect(calls).toEqual([
      [
        "kling",
        {
          aspect_ratio: "16:9",
          callback_url: "https://voice.example/kling-webhook",
          cfg_scale: 0.5,
          duration: 5,
          image: "https://cdn.example.test/start.png",
          mode: "std",
          model: "kling-v1",
          negative_prompt: "blur",
          prompt: "camera move around a product",
        },
      ],
      [
        "nano-banana",
        {
          aspect_ratio: "1:1",
          callback_url: "https://voice.example/nano-webhook",
          images: ["https://cdn.example.test/reference.png"],
          model: "nano-banana",
          prompt: "studio product image",
          seed: "seed-1",
          size: "1024x1024",
        },
      ],
      [
        "midjourney",
        {
          aspect_ratio: "4:5",
          model: "midjourney-v7",
          prompt: "editorial product image",
          seed: "seed-2",
          style: "raw",
        },
      ],
    ]);
  });

  it("routes Vidu provider tasks to the selected typed cloud-router SDK creation surface", async () => {
    const calls: unknown[] = [];
    const client = {
      imagesVidu: {
        ent: {
          v2: {
            reference2image: {
              async create(body: unknown) {
                calls.push(["reference2image", body]);
                return { state: "created", task_id: "vidu-image-task-1" };
              },
            },
          },
        },
      },
      videosVidu: {
        ent: {
          v2: {
            img2video: {
              async create(body: unknown) {
                calls.push(["img2video", body]);
                return { state: "created", task_id: "vidu-img-video-task-1" };
              },
            },
            reference2video: {
              async create(body: unknown) {
                calls.push(["reference2video", body]);
                return { state: "created", task_id: "vidu-reference-video-task-1" };
              },
            },
            startEnd2video: {
              async create(body: unknown) {
                calls.push(["startEnd2video", body]);
                return { state: "created", task_id: "vidu-start-end-task-1" };
              },
            },
            text2video: {
              async create(body: unknown) {
                calls.push(["text2video", body]);
                return { state: "created", task_id: "vidu-text-task-1" };
              },
            },
          },
        },
      },
    } as unknown as CloudRouterVoiceProviderClient;
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "vidu" });

    const textResult = await adapter.startMusic({
      durationSeconds: 4,
      model: "vidu-q1",
      prompt: "text to video",
      provider: {
        providerCode: "vidu",
        providerOptions: {
          aspect_ratio: "16:9",
          payload: "voice-task-1",
          resolution: "1080p",
        },
      },
    });
    const imageResult = await adapter.startMusic({
      model: "vidu-image",
      prompt: "reference to image",
      provider: {
        providerCode: "vidu-image",
        providerOptions: {
          images: ["https://cdn.example.test/reference-a.png"],
          style: "studio",
        },
      },
    });
    const imgVideoResult = await adapter.startMusic({
      durationSeconds: 5,
      model: "vidu-video",
      prompt: "image to video",
      provider: {
        providerCode: "vidu-video",
        providerOptions: {
          images: ["https://cdn.example.test/source-a.png"],
          movement_amplitude: "medium",
        },
        providerRouteId: "vidu.img2video",
      },
    });
    const referenceVideoResult = await adapter.startMusic({
      model: "vidu-reference",
      prompt: "reference to video",
      provider: {
        providerCode: "vidu-video",
        providerOptions: {
          images: ["https://cdn.example.test/reference-b.png"],
        },
        providerRouteId: "vidu.reference2video",
      },
    });
    const startEndResult = await adapter.startMusic({
      model: "vidu-start-end",
      prompt: "start end to video",
      provider: {
        providerCode: "vidu-video",
        providerOptions: {
          images: ["https://cdn.example.test/start.png", "https://cdn.example.test/end.png"],
        },
        providerRouteId: "vidu.startEnd2video",
      },
    });

    expect(textResult.providerTaskId).toBe("vidu-text-task-1");
    expect(imageResult.providerTaskId).toBe("vidu-image-task-1");
    expect(imgVideoResult.providerTaskId).toBe("vidu-img-video-task-1");
    expect(referenceVideoResult.providerTaskId).toBe("vidu-reference-video-task-1");
    expect(startEndResult.providerTaskId).toBe("vidu-start-end-task-1");
    expect(calls).toEqual([
      [
        "text2video",
        {
          aspect_ratio: "16:9",
          duration: 4,
          model: "vidu-q1",
          payload: "voice-task-1",
          prompt: "text to video",
          resolution: "1080p",
        },
      ],
      [
        "reference2image",
        {
          images: ["https://cdn.example.test/reference-a.png"],
          model: "vidu-image",
          prompt: "reference to image",
          style: "studio",
        },
      ],
      [
        "img2video",
        {
          duration: 5,
          images: ["https://cdn.example.test/source-a.png"],
          model: "vidu-video",
          movement_amplitude: "medium",
          prompt: "image to video",
        },
      ],
      [
        "reference2video",
        {
          images: ["https://cdn.example.test/reference-b.png"],
          model: "vidu-reference",
          prompt: "reference to video",
        },
      ],
      [
        "startEnd2video",
        {
          images: ["https://cdn.example.test/start.png", "https://cdn.example.test/end.png"],
          model: "vidu-start-end",
          prompt: "start end to video",
        },
      ],
    ]);
  });

  it("normalizes completed Volcengine video arrays into ordered generated artifacts", async () => {
    const client: CloudRouterVoiceProviderClient = {
      videosVolcengine: {
        api: {
          v3: {
            contents: {
              generations: {
                tasks: {
                  async create() {
                    return { id: "volc-task-1", task_id: "volc-task-1" };
                  },
                  async retrieve() {
                    return {
                      state: "succeeded",
                      task_id: "volc-task-1",
                      videos: [
                        {
                          duration: 6,
                          id: "video-a",
                          mime_type: "video/mp4",
                          url: "https://cdn.example.test/video-a.mp4",
                        },
                        {
                          duration: 8,
                          id: "video-b",
                          mime_type: "video/mp4",
                          url: "https://cdn.example.test/video-b.mp4",
                        },
                      ],
                    };
                  },
                },
              },
            },
          },
        },
      },
    };
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "volcengine" });

    const snapshot = await adapter.queryTask({ providerCode: "volcengine", providerTaskId: "volc-task-1" });

    expect(snapshot.generatedArtifacts).toMatchObject([
      {
        artifactIndex: 0,
        durationSeconds: 6,
        fileName: "video-a-0000.mp4",
        kind: "video",
        mediaKind: "video",
        providerAssetId: "video-a",
        source: "external_url",
        sourceUri: "https://cdn.example.test/video-a.mp4",
      },
      {
        artifactIndex: 1,
        durationSeconds: 8,
        fileName: "video-b-0001.mp4",
        kind: "video",
        mediaKind: "video",
        providerAssetId: "video-b",
        source: "external_url",
        sourceUri: "https://cdn.example.test/video-b.mp4",
      },
    ]);
  });

  it("queries Kling video tasks through the typed cloud-router SDK", async () => {
    const retrievedTaskIds: string[] = [];
    const client = {
      videosKling: {
        v1: {
          videos: {
            generations: {
              async retrieve(taskId: string) {
                retrievedTaskIds.push(taskId);
                return {
                  state: "succeeded",
                  task_id: taskId,
                  videos: [
                    {
                      duration: 5,
                      id: "kling-video-a",
                      mime_type: "video/mp4",
                      url: "https://cdn.example.test/kling-video-a.mp4",
                    },
                  ],
                };
              },
            },
          },
        },
      },
    } as CloudRouterVoiceProviderClient;
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "kling" });

    const snapshot = await adapter.queryTask({ providerCode: "kling", providerTaskId: "kling-task-1" });

    expect(retrievedTaskIds).toEqual(["kling-task-1"]);
    expect(snapshot).toMatchObject({
      generatedArtifacts: [
        {
          artifactIndex: 0,
          durationSeconds: 5,
          fileName: "kling-video-a-0000.mp4",
          kind: "video",
          mediaKind: "video",
          providerAssetId: "kling-video-a",
          source: "external_url",
          sourceUri: "https://cdn.example.test/kling-video-a.mp4",
        },
      ],
      providerCode: "kling",
      providerTaskId: "kling-task-1",
      status: "succeeded",
    });
  });

  it("queries Nano Banana image tasks through the typed cloud-router SDK", async () => {
    const retrievedTaskIds: string[] = [];
    const client = {
      imagesNanoBanana: {
        v1: {
          images: {
            generations: {
              async retrieve(taskId: string) {
                retrievedTaskIds.push(taskId);
                return {
                  status: "complete",
                  task_id: taskId,
                  images: [
                    {
                      id: "nano-image-a",
                      mime_type: "image/png",
                      url: "https://cdn.example.test/nano-image-a.png",
                    },
                  ],
                };
              },
            },
          },
        },
      },
    } as CloudRouterVoiceProviderClient;
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "nano-banana" });

    const snapshot = await adapter.queryTask({ providerCode: "nano-banana", providerTaskId: "nano-task-1" });

    expect(retrievedTaskIds).toEqual(["nano-task-1"]);
    expect(snapshot.generatedArtifacts).toMatchObject([
      {
        artifactIndex: 0,
        fileName: "nano-image-a-0000.png",
        kind: "image",
        mediaKind: "image",
        providerAssetId: "nano-image-a",
        source: "external_url",
        sourceUri: "https://cdn.example.test/nano-image-a.png",
      },
    ]);
  });

  it("queries Midjourney image tasks through the typed cloud-router SDK", async () => {
    const retrievedTaskIds: string[] = [];
    const client = {
      imagesMidjourney: {
        v1: {
          images: {
            generations: {
              async retrieve(taskId: string) {
                retrievedTaskIds.push(taskId);
                return {
                  status: "completed",
                  task_id: taskId,
                  images: [
                    {
                      id: "midjourney-image-a",
                      mime_type: "image/jpeg",
                      url: "https://cdn.example.test/midjourney-image-a.jpg",
                    },
                  ],
                };
              },
            },
          },
        },
      },
    } as CloudRouterVoiceProviderClient;
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "midjourney" });

    const snapshot = await adapter.queryTask({ providerCode: "midjourney", providerTaskId: "midjourney-task-1" });

    expect(retrievedTaskIds).toEqual(["midjourney-task-1"]);
    expect(snapshot.generatedArtifacts).toMatchObject([
      {
        artifactIndex: 0,
        fileName: "midjourney-image-a-0000.jpg",
        kind: "image",
        mediaKind: "image",
        providerAssetId: "midjourney-image-a",
        source: "external_url",
        sourceUri: "https://cdn.example.test/midjourney-image-a.jpg",
      },
    ]);
  });

  it("queries Vidu task creations through the typed cloud-router SDK", async () => {
    const listedTaskIds: string[] = [];
    const client = {
      videosVidu: {
        ent: {
          v2: {
            tasks: {
              creations: {
                async list(taskId: string) {
                  listedTaskIds.push(taskId);
                  return {
                    creations: [
                      {
                        cover_url: "https://cdn.example.test/vidu-cover-a.png",
                        duration: 8,
                        id: "vidu-creation-a",
                        video_url: "https://cdn.example.test/vidu-video-a.mp4",
                      },
                    ],
                    state: "success",
                    task_id: taskId,
                  };
                },
              },
            },
          },
        },
      },
    } as CloudRouterVoiceProviderClient;
    const adapter = createCloudRouterVoiceProviderAdapter({ client, defaultProviderCode: "vidu" });

    const snapshot = await adapter.queryTask({ providerCode: "vidu", providerTaskId: "vidu-task-1" });

    expect(listedTaskIds).toEqual(["vidu-task-1"]);
    expect(snapshot.generatedArtifacts).toMatchObject([
      {
        artifactIndex: 0,
        durationSeconds: 8,
        fileName: "vidu-creation-a-video-0000.mp4",
        kind: "video",
        mediaKind: "video",
        providerAssetId: "vidu-creation-a",
        sourceUri: "https://cdn.example.test/vidu-video-a.mp4",
      },
      {
        artifactIndex: 1,
        fileName: "vidu-creation-a-cover-0001.png",
        kind: "image",
        mediaKind: "image",
        providerAssetId: "vidu-creation-a",
        sourceUri: "https://cdn.example.test/vidu-cover-a.png",
      },
    ]);
  });

  it("uses configured provider route invoker for ElevenLabs sound effects", async () => {
    const invocations: unknown[] = [];
    const adapter = createCloudRouterVoiceProviderAdapter({
      client: {},
      defaultProviderCode: "elevenlabs",
      async invokeProviderRoute(invocation) {
        invocations.push(invocation);
        return {
          body: new Blob(["sfx"], { type: "audio/wav" }),
          contentType: "audio/wav",
          providerCode: invocation.providerCode,
        };
      },
    });

    const result = await adapter.startSoundEffect({
      durationSeconds: 4,
      loop: false,
      model: "eleven_text_to_sound_v2",
      prompt: "cinematic whoosh",
      promptInfluence: 0.4,
      responseFormat: "wav",
    });

    expect(result.status).toBe("completed");
    expect(invocations).toEqual([
      {
        body: {
          duration_seconds: 4,
          loop: false,
          model_id: "eleven_text_to_sound_v2",
          prompt_influence: 0.4,
          text: "cinematic whoosh",
        },
        method: "POST",
        path: "/provider/elevenlabs/v1/sound-generation?output_format=wav",
        providerCode: "elevenlabs",
      },
    ]);
  });
});
