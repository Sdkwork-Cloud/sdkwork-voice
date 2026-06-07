import { access, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDir, "..");
export const DEFAULT_APPBASE_ROOT = resolve(workspaceRoot, "../sdkwork-appbase");

export const disallowedPathRelatives = [
  "packages/pc-react/content/sdkwork-audio-pc-react",
];

export const disallowedFilePatterns = [
  {
    file: "tsconfig.base.json",
    patterns: [/@sdkwork\/audio-pc-react/u, /sdkwork-audio-pc-react/u],
    reason: "appbase tsconfig still resolves the voice-owned PC audio package",
  },
  {
    file: "scripts/package-catalog.mjs",
    patterns: [/sdkwork-audio-pc-react/u, /sdkwork-pc-portal-voice/u],
    reason: "appbase package catalog still registers voice-owned audio package",
  },
  {
    file: "packages/pc-react/content/README.md",
    patterns: [/sdkwork-audio-pc-react/u],
    reason: "appbase content package list still documents the voice-owned PC audio package",
  },
  {
    file: "packages/pc-react/content/sdkwork-generation-pc-react/src/generation-asset-config.ts",
    patterns: [
      /"audio"/u,
      /"music"/u,
      /"sfx"/u,
      /SpeechMode/u,
      /SfxMode/u,
      /audio_output_(?:second|minute)/u,
      /music_output_second/u,
      /sfx_result/u,
      /tts_input_character/u,
      /speech_character/u,
    ],
    reason: "appbase generation asset config still owns voice/audio generation modalities or pricing meters",
  },
  {
    file: "packages/pc-react/content/sdkwork-generation-pc-react/src/generation-history.ts",
    patterns: [
      /"audio"/u,
      /"music"/u,
      /"sfx"/u,
    ],
    reason: "appbase generation history still owns voice/audio history modalities",
  },
  {
    file: "packages/pc-react/intelligence/sdkwork-models-pc-react/src/models.ts",
    patterns: [
      /"audio"/u,
      /"music"/u,
      /audio-input/u,
      /audio-output/u,
    ],
    reason: "appbase model catalog still declares voice/audio model modalities or capabilities",
  },
  {
    file: "packages/common/foundation/sdkwork-runtime-bootstrap/src/media.ts",
    patterns: [/"voice"/u],
    reason: "appbase runtime bootstrap still declares voice-specific media kind",
  },
  {
    file: "packages/pc-react/communication/sdkwork-rtc-pc-react/src/rtc.ts",
    patterns: [/\bvoice\b/u],
    reason: "appbase RTC catalog text still describes voice-specific workspace ownership",
  },
  {
    file: "docs/superpowers/specs/2026-04-18-sdkwork-appbase-local-api-proxy-design.md",
    patterns: [/audio-speech/u, /audio-transcription/u, /audio-translation/u, /`speech`/u],
    reason: "appbase local-api-proxy design docs still assign voice/audio proxy capabilities to appbase",
  },
  {
    file: "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/catalog.ts",
    patterns: [/AI generation workspaces across .*audio/u],
    reason: "appbase mobile generation catalog still describes voice-owned audio generation",
  },
  {
    file: "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/services/localApiProxyProviderRoutingCatalogService.ts",
    patterns: [/\bvoice\b/u, /\bWhisper\b/u],
    reason: "appbase local-api-proxy provider catalog still describes voice-specific routing or model ownership",
  },
  {
    file: "packages/pc-react/foundation/sdkwork-appbase-pc-react/src/catalog.ts",
    patterns: [/@sdkwork\/audio-pc-react/u, /capability:\s*"audio"/u],
    reason: "appbase PC foundation catalog still advertises voice-owned audio capability",
  },
  {
    file: "packages/pc-react/foundation/sdkwork-appbase-pc-react/tests/catalog.test.ts",
    patterns: [/@sdkwork\/audio-pc-react/u, /"audio"/u],
    reason: "appbase PC foundation catalog tests still expect voice-owned audio package",
  },
  {
    file: "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/src/catalog.ts",
    patterns: [/@sdkwork\/audio-mobile-react/u, /capability:\s*"audio"/u],
    reason: "appbase mobile foundation catalog still advertises voice-owned audio capability",
  },
  {
    file: "packages/mobile-react/foundation/sdkwork-appbase-mobile-react/tests/catalog.test.ts",
    patterns: [/@sdkwork\/audio-mobile-react/u, /"audio"/u],
    reason: "appbase mobile foundation catalog tests still expect voice-owned audio package",
  },
  {
    file: "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/types/localApiProxyTypes.ts",
    patterns: [
      /audio-speech/u,
      /audio-transcription/u,
      /audio-translation/u,
      /\|\s*"speech"/u,
    ],
    reason: "appbase generic local-api-proxy still owns voice/audio capability types",
  },
  {
    file: "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/gateway/localApiProxyOperations.ts",
    patterns: [
      /openai\.v1\.audio/u,
      /audio-speech/u,
      /audio-transcription/u,
      /audio-translation/u,
      /\/v1\/audio\/(?:speech|transcriptions|translations)/u,
    ],
    reason: "appbase generic local-api-proxy still owns voice/audio operations",
  },
  {
    file: "packages/pc-react/intelligence/sdkwork-local-api-proxy/src/gateway/localApiProxyRouteGroups.ts",
    patterns: [
      /audio-speech/u,
      /audio-transcription/u,
      /audio-translation/u,
    ],
    reason: "appbase generic local-api-proxy route groups still expose voice/audio capabilities",
  },
];

export async function auditAppbaseVoiceMigration(options = {}) {
  const appbaseRoot = resolve(options.appbaseRoot ?? DEFAULT_APPBASE_ROOT);
  const findings = [];

  for (const relativePath of disallowedPathRelatives) {
    const absolutePath = join(appbaseRoot, ...relativePath.split("/"));
    if (await pathExists(absolutePath)) {
      findings.push({
        kind: "path",
        path: relativePath,
        reason: "voice-owned source package still exists in sdkwork-appbase",
      });
    }
  }

  for (const rule of disallowedFilePatterns) {
    const absolutePath = join(appbaseRoot, ...rule.file.split("/"));
    if (!(await pathExists(absolutePath))) {
      continue;
    }
    const fileStat = await stat(absolutePath);
    if (!fileStat.isFile()) {
      continue;
    }
    const content = await readFile(absolutePath, "utf8");
    const lines = content.split(/\r?\n/u);
    for (const pattern of rule.patterns) {
      for (let index = 0; index < lines.length; index += 1) {
        if (!pattern.test(lines[index])) {
          continue;
        }
        findings.push({
          kind: "content",
          path: rule.file,
          line: index + 1,
          pattern: pattern.source,
          reason: rule.reason,
        });
        pattern.lastIndex = 0;
        break;
      }
      pattern.lastIndex = 0;
    }
  }

  return {
    appbaseRoot,
    ok: findings.length === 0,
    findings,
  };
}

export function formatAuditFindings(result) {
  if (result.ok) {
    return `sdkwork-appbase voice/audio migration audit passed: ${result.appbaseRoot}`;
  }

  const lines = [
    `sdkwork-appbase voice/audio migration audit failed: ${result.appbaseRoot}`,
    ...result.findings.map((finding) => {
      const location = finding.line ? `${finding.path}:${finding.line}` : finding.path;
      return `- ${location} - ${finding.reason}`;
    }),
  ];
  return lines.join("\n");
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await auditAppbaseVoiceMigration({ appbaseRoot: process.argv[2] });
  console.log(formatAuditFindings(result));
  if (!result.ok) {
    process.exitCode = 1;
  }
}
