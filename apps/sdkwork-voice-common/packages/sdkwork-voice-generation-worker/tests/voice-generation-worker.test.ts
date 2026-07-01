import { describe, expect, it, vi } from "vitest";

import { createVoiceGenerationWorker } from "../src/index.js";

describe("createVoiceGenerationWorker", () => {
  it("drains queued tasks and reconciles provider results", async () => {
    const reconcile = vi.fn().mockResolvedValue({ accepted: true });
    const startSpeech = vi.fn().mockResolvedValue({
      providerCode: "openai",
      status: "completed",
      generatedArtifacts: [{ artifactIndex: 0, kind: "audio", mimeType: "audio/mpeg" }],
    });

    const worker = createVoiceGenerationWorker({
      backendClient: {
        voice: {
          tasks: {
            list: vi.fn().mockResolvedValue({
              items: [
                {
                  id: "42",
                  operationType: "speech",
                  requestJson: JSON.stringify({ model: "tts-1", voice: "alloy", input: "hello" }),
                  status: "queued",
                },
              ],
            }),
            reconcile,
          },
        },
      } as never,
      providerAdapter: {
        startSpeech,
      } as never,
    });

    const processed = await worker.runOnce();

    expect(processed).toBe(1);
    expect(startSpeech).toHaveBeenCalledOnce();
    expect(reconcile).toHaveBeenCalledWith("42", {
      providerResult: expect.objectContaining({
        status: "succeeded",
        generatedArtifacts: expect.any(Array),
      }),
    });
  });
});
