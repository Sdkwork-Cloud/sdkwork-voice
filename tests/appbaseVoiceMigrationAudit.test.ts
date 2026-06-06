import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  auditAppbaseVoiceMigration,
  formatAuditFindings,
} from "../scripts/audit-appbase-voice-migration.mjs";

describe("sdkwork-appbase voice migration audit", () => {
  it("detects old voice/audio ownership in appbase files", async () => {
    const root = await mkdtemp(join(tmpdir(), "sdkwork-appbase-audit-"));
    try {
      await mkdir(join(root, "packages/pc-react/content/sdkwork-audio-pc-react"), { recursive: true });
      await mkdir(join(root, "packages/pc-react/content/sdkwork-generation-pc-react/src"), { recursive: true });
      await mkdir(join(root, "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/gateway"), { recursive: true });
      await mkdir(join(root, "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/services"), { recursive: true });
      await mkdir(join(root, "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/types"), { recursive: true });
      await mkdir(join(root, "packages/pc-react/intelligence/sdkwork-models-pc-react/src"), { recursive: true });
      await mkdir(join(root, "packages/common/foundation/sdkwork-runtime-bootstrap/src"), { recursive: true });
      await mkdir(join(root, "packages/pc-react/communication/sdkwork-rtc-pc-react/src"), { recursive: true });
      await writeFile(
        join(root, "tsconfig.base.json"),
        JSON.stringify({ compilerOptions: { paths: { "@sdkwork/audio-pc-react": ["packages/pc-react/content/sdkwork-audio-pc-react/src/index.ts"] } } }),
        "utf8",
      );
      await writeFile(
        join(root, "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/gateway/localApiProxyOperations.ts"),
        'const pathPattern = "/v1/audio/speech"; const id = "openai.v1.audio.speech.create";',
        "utf8",
      );
      await writeFile(
        join(root, "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/types/localApiProxyTypes.ts"),
        'export type LocalApiCapability = "chat" | "audio-speech"; export type LocalApiProxyModelRole = "default" | "speech";',
        "utf8",
      );
      await writeFile(
        join(root, "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/services/localApiProxyProviderRoutingCatalogService.ts"),
        'export const providerChannelCatalog = [{ modelFamily: "Llama / Gemma / Whisper" }];',
        "utf8",
      );
      await writeFile(
        join(root, "packages/pc-react/content/sdkwork-generation-pc-react/src/generation-asset-config.ts"),
        'export type SdkworkGenerationAssetModality = "image" | "audio"; export interface SpeechMode { voice?: string }',
        "utf8",
      );
      await writeFile(
        join(root, "packages/pc-react/intelligence/sdkwork-models-pc-react/src/models.ts"),
        'export type SdkworkModelModality = "text" | "audio" | "music"; export type SdkworkModelCapability = "vision" | "audio-input" | "audio-output";',
        "utf8",
      );
      await writeFile(
        join(root, "packages/common/foundation/sdkwork-runtime-bootstrap/src/media.ts"),
        'export type MediaKind = "image" | "video" | "audio" | "voice";',
        "utf8",
      );
      await writeFile(
        join(root, "packages/pc-react/communication/sdkwork-rtc-pc-react/src/rtc.ts"),
        'export const description = "Realtime calling workspace for voice, video, and call-window routing.";',
        "utf8",
      );

      const result = await auditAppbaseVoiceMigration({ appbaseRoot: root });

      expect(result.ok).toBe(false);
      expect(result.findings.map((finding) => finding.path)).toEqual(
        expect.arrayContaining([
          "packages/pc-react/content/sdkwork-audio-pc-react",
          "tsconfig.base.json",
          "packages/pc-react/content/sdkwork-generation-pc-react/src/generation-asset-config.ts",
          "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/gateway/localApiProxyOperations.ts",
          "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/services/localApiProxyProviderRoutingCatalogService.ts",
          "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/types/localApiProxyTypes.ts",
          "packages/pc-react/intelligence/sdkwork-models-pc-react/src/models.ts",
          "packages/common/foundation/sdkwork-runtime-bootstrap/src/media.ts",
          "packages/pc-react/communication/sdkwork-rtc-pc-react/src/rtc.ts",
        ]),
      );
      expect(formatAuditFindings(result)).toContain("audit failed");
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("passes when appbase keeps generic media or RTC audio text without voice-owned packages", async () => {
    const root = await mkdtemp(join(tmpdir(), "sdkwork-appbase-audit-clean-"));
    try {
      await mkdir(join(root, "packages/common/foundation/sdkwork-runtime-bootstrap/src"), { recursive: true });
      await mkdir(join(root, "packages/pc-react/communication/sdkwork-rtc-pc-react/src"), { recursive: true });
      await writeFile(
        join(root, "packages/common/foundation/sdkwork-runtime-bootstrap/src/media.ts"),
        'export type MediaKind = "image" | "video" | "audio";',
        "utf8",
      );
      await writeFile(
        join(root, "packages/pc-react/communication/sdkwork-rtc-pc-react/src/rtc.ts"),
        'export const description = "Realtime calling workspace for audio, video, and call-window routing.";',
        "utf8",
      );

      const result = await auditAppbaseVoiceMigration({ appbaseRoot: root });

      expect(result.ok).toBe(true);
      expect(result.findings).toEqual([]);
      expect(formatAuditFindings(result)).toContain("audit passed");
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
