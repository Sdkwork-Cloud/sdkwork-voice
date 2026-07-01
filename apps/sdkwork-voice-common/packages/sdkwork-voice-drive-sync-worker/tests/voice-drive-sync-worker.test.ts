import { describe, expect, it, vi } from "vitest";

import { createVoiceDriveSyncWorker } from "../src/index.js";

describe("createVoiceDriveSyncWorker", () => {
  it("retries pending artifact drive sync rows", async () => {
    const retry = vi.fn().mockResolvedValue({ accepted: true });

    const worker = createVoiceDriveSyncWorker({
      backendClient: {
        voice: {
          artifactDriveSync: {
            list: vi.fn().mockResolvedValue({
              items: [
                {
                  id: "9",
                  syncStatus: "pending_upload",
                  sourceUri: "https://provider.example/audio.mp3",
                },
              ],
            }),
            retry,
          },
        },
      },
    });

    const processed = await worker.runOnce();

    expect(processed).toBe(1);
    expect(retry).toHaveBeenCalledWith("9", {});
  });
});
