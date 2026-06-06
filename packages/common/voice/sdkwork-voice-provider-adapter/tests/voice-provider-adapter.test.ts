import { describe, expect, it } from "vitest";
import {
  createClawRouterVoiceProviderAdapter,
  normalizeVoiceProviderGeneratedArtifacts,
  type ClawRouterVoiceProviderClient,
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

  it("invokes claw-router generated SDK surfaces for OpenAI-compatible speech", async () => {
    const calls: unknown[] = [];
    const client: ClawRouterVoiceProviderClient = {
      audio: {
        speech: {
          async create(body) {
            calls.push(body);
            return new Blob(["audio"], { type: "audio/mpeg" });
          },
        },
      },
    };
    const adapter = createClawRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

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

  it("normalizes synchronous speech bytes into generated artifacts for Drive ingestion", async () => {
    const client: ClawRouterVoiceProviderClient = {
      audio: {
        speech: {
          async create() {
            return new Blob(["audio"], { type: "audio/mpeg" });
          },
        },
      },
    };
    const adapter = createClawRouterVoiceProviderAdapter({ client, defaultProviderCode: "openai" });

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

  it("starts Suno music tasks through the typed claw-router SDK", async () => {
    const bodies: unknown[] = [];
    const client: ClawRouterVoiceProviderClient = {
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
    const adapter = createClawRouterVoiceProviderAdapter({ client, defaultProviderCode: "suno" });

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
    const client: ClawRouterVoiceProviderClient = {
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
    const adapter = createClawRouterVoiceProviderAdapter({ client, defaultProviderCode: "suno" });

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
    const client: ClawRouterVoiceProviderClient = {
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
    const adapter = createClawRouterVoiceProviderAdapter({ client, defaultProviderCode: "volcengine" });

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

  it("normalizes completed Volcengine video arrays into ordered generated artifacts", async () => {
    const client: ClawRouterVoiceProviderClient = {
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
    const adapter = createClawRouterVoiceProviderAdapter({ client, defaultProviderCode: "volcengine" });

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

  it("uses configured provider route invoker for ElevenLabs sound effects", async () => {
    const invocations: unknown[] = [];
    const adapter = createClawRouterVoiceProviderAdapter({
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
