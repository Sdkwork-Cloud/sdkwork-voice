import { describe, expect, it, vi } from "vitest";
import * as audioModule from "../src";

describe("sdkwork-audio-pc-react controller", () => {
  it("filters audio by voice, status, and search state", async () => {
    const createSdkworkAudioController = (audioModule as Record<string, any>).createSdkworkAudioController;

    const controller = createSdkworkAudioController({
      service: {
        getEmptyWorkspace: vi.fn().mockReturnValue({
          digest: { activeJobs: 0, readyAudio: 0, totalAudio: 0, voiceCount: 0 },
          isAuthenticated: false,
          items: [],
          voices: [],
        }),
        getWorkspace: vi.fn().mockResolvedValue({
          digest: { activeJobs: 1, readyAudio: 1, totalAudio: 2, voiceCount: 2 },
          isAuthenticated: true,
          items: [
            { durationLabel: "00:45", format: "wav", id: "audio-launch-tag", status: "ready", title: "Launch Tag", updatedAt: "2026-04-03T01:00:00.000Z", voiceId: "voice-brand-female" },
            { durationLabel: "01:10", format: "wav", id: "audio-product-narration", status: "queued", title: "Product Narration", updatedAt: "2026-04-02T01:00:00.000Z", voiceId: "voice-narration" },
          ],
          voices: [
            { id: "voice-brand-female", itemCount: 1, title: "Brand Female" },
            { id: "voice-narration", itemCount: 1, title: "Narration" },
          ],
        }),
      },
    });

    await controller.bootstrap();
    controller.setVoice("voice-narration");
    expect(controller.getState().visibleItems).toHaveLength(1);
    controller.setStatus("queued");
    expect(controller.getState().visibleItems).toHaveLength(1);
    controller.setSearchQuery("launch");
    expect(controller.getState().visibleItems).toHaveLength(0);
  });
});
