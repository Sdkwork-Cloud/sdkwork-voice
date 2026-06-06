import { describe, expect, it } from "vitest";
import {
  createClawRouterVoiceProviderAdapter,
  type ClawRouterVoiceProviderClient,
} from "../src/index.ts";

describe("@sdkwork/voice-provider-adapter", () => {
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
