import { describe, expect, it } from "vitest";
import * as audioModule from "../src";

describe("sdkwork-audio-pc-react domain contract", () => {
  it("creates workspace manifest, route intents, and deterministic audio workspace", () => {
    const {
      audioPackageMeta,
      createAudioRouteIntent,
      createAudioWorkspaceManifest,
      createEmptySdkworkAudioWorkspace,
    } = audioModule as Record<string, any>;

    expect(audioPackageMeta).toMatchObject({
      domain: "voice",
      package: "@sdkwork/audio-pc-react",
      status: "ready",
      workspace: "sdkwork-voice",
    });

    expect(createAudioWorkspaceManifest({ title: "Audio Workspace" })).toMatchObject({
      capability: "audio",
      routePath: "/audio",
      title: "Audio Workspace",
    });

    expect(createAudioRouteIntent({ audioId: "audio-launch-tag", voiceId: "voice-brand-female" })).toEqual({
      audioId: "audio-launch-tag",
      focusWindow: true,
      route: "/audio?voiceId=voice-brand-female&audioId=audio-launch-tag",
      source: "audio-workspace",
      type: "audio-route-intent",
      voiceId: "voice-brand-female",
    });

    const workspace = createEmptySdkworkAudioWorkspace();

    expect(workspace).toMatchObject({
      digest: {
        totalAudio: 4,
        voiceCount: 3,
      },
      isAuthenticated: false,
      voices: expect.arrayContaining([
        expect.objectContaining({ id: "voice-brand-female" }),
      ]),
    });
    expect(workspace.items[0]).toMatchObject({
      resource: {
        kind: "audio",
        source: "generated",
      },
    });
  });
});
