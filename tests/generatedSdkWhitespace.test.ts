import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { normalizeGeneratedSdkWhitespace } from "../scripts/normalize-generated-sdk-whitespace.mjs";

const GENERATED_SDK_SOURCE_FILES = [
  "sdks/sdkwork-voice-app-sdk/sdkwork-voice-app-sdk-typescript/generated/server-openapi/src/api/voice.ts",
  "sdks/sdkwork-voice-backend-sdk/sdkwork-voice-backend-sdk-typescript/generated/server-openapi/src/api/voice.ts",
];

describe("generated TypeScript SDK formatting", () => {
  it("normalizes trailing whitespace inside generated SDK output", async () => {
    const root = await mkdtemp(join(tmpdir(), "sdkwork-voice-sdk-whitespace-"));
    try {
      const sourceFile = join(root, "src.ts");
      await writeFile(sourceFile, "const value = 1;   \n\nconst next = 2;\t\n", "utf8");

      const changedFiles = await normalizeGeneratedSdkWhitespace({ root });

      await expect(readFile(sourceFile, "utf8")).resolves.toBe("const value = 1;\n\nconst next = 2;\n");
      expect(changedFiles).toEqual([sourceFile]);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("updates generator manifest hashes after normalizing generated files", async () => {
    const root = await mkdtemp(join(tmpdir(), "sdkwork-voice-sdk-manifest-"));
    try {
      const sourceFile = join(root, "src.ts");
      const manifestFile = join(root, ".sdkwork", "sdkwork-generator-manifest.json");
      await mkdir(join(root, ".sdkwork"), { recursive: true });
      await writeFile(sourceFile, "const value = 1;   \n", "utf8");
      await writeFile(
        manifestFile,
        JSON.stringify({
          generatedFiles: [
            {
              path: "src.ts",
              sha256: sha256("const value = 1;   \n"),
            },
          ],
        }, null, 2),
        "utf8",
      );

      await normalizeGeneratedSdkWhitespace({ root });

      const manifest = JSON.parse(await readFile(manifestFile, "utf8")) as {
        generatedFiles: Array<{ path: string; sha256: string }>;
      };
      expect(manifest.generatedFiles[0]).toEqual({
        path: "src.ts",
        sha256: sha256("const value = 1;\n"),
      });
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("repairs stale manifest hashes even when no file content changes", async () => {
    const root = await mkdtemp(join(tmpdir(), "sdkwork-voice-sdk-stale-manifest-"));
    try {
      const sourceFile = join(root, "src.ts");
      const manifestFile = join(root, ".sdkwork", "sdkwork-generator-manifest.json");
      await mkdir(join(root, ".sdkwork"), { recursive: true });
      await writeFile(sourceFile, "const value = 1;\n", "utf8");
      await writeFile(
        manifestFile,
        JSON.stringify({
          generatedFiles: [
            {
              path: "src.ts",
              sha256: "stale",
            },
          ],
        }, null, 2),
        "utf8",
      );

      const changedFiles = await normalizeGeneratedSdkWhitespace({ root });

      const manifest = JSON.parse(await readFile(manifestFile, "utf8")) as {
        generatedFiles: Array<{ path: string; sha256: string }>;
      };
      expect(changedFiles).toEqual([]);
      expect(manifest.generatedFiles[0].sha256).toBe(sha256("const value = 1;\n"));
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("does not keep trailing whitespace in generated SDK source files", async () => {
    const findings: string[] = [];

    for (const relativePath of GENERATED_SDK_SOURCE_FILES) {
      const content = await readFile(join(process.cwd(), relativePath), "utf8");
      const lines = content.split(/\r?\n/u);
      for (let index = 0; index < lines.length; index += 1) {
        if (/[ \t]+$/u.test(lines[index])) {
          findings.push(`${relativePath}:${index + 1}`);
        }
      }
    }

    expect(findings).toEqual([]);
  });
});

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
