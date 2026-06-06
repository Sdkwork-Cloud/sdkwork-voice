import { describe, expect, it, vi } from "vitest";
import * as audioModule from "../src";

describe("sdkwork-audio-pc-react service", () => {
  it("keeps deterministic fallback audio when list operation fails", async () => {
    const createSdkworkAudioService = (audioModule as Record<string, any>).createSdkworkAudioService;
    const service = createSdkworkAudioService({
      getSessionTokens: () => ({ authToken: "token" }),
      items: [
        { durationLabel: "00:20", format: "wav", id: "fallback-audio", status: "ready", title: "Fallback Audio", updatedAt: "2026-04-01T01:00:00.000Z", voiceId: "voice-brand-female" },
      ],
      listAudio: vi.fn()
        .mockResolvedValueOnce([
          { durationLabel: "00:40", format: "wav", id: "remote-audio", status: "processing", title: "Remote Audio", updatedAt: "2026-04-03T01:00:00.000Z", voiceId: "voice-brand-female" },
        ])
        .mockRejectedValueOnce(new Error("offline")),
      voices: [
        { id: "voice-brand-female", itemCount: 1, title: "Brand Female" },
      ],
    });

    const first = await service.getWorkspace();
    expect(first.isAuthenticated).toBe(true);
    expect(first.items[0]?.id).toBe("remote-audio");

    const second = await service.getWorkspace();
    expect(second.items[0]?.id).toBe("fallback-audio");
  });
});
