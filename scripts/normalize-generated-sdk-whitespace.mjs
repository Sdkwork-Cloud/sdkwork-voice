import { createHash } from "node:crypto";
import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_EXTENSIONS = new Set([".cjs", ".css", ".d.ts", ".js", ".json", ".mjs", ".ts", ".yaml", ".yml"]);

export async function normalizeGeneratedSdkWhitespace(options = {}) {
  const root = resolve(options.root ?? process.argv[2] ?? ".");
  const extensions = options.extensions ?? DEFAULT_EXTENSIONS;
  const changedFiles = [];

  for await (const filePath of walkFiles(root)) {
    if (!hasSupportedExtension(filePath, extensions)) {
      continue;
    }
    const original = await readFile(filePath, "utf8");
    const normalized = original
      .split(/\r?\n/u)
      .map((line) => line.replace(/[ \t]+$/u, ""))
      .join("\n");

    if (normalized !== original) {
      await writeFile(filePath, normalized, "utf8");
      changedFiles.push(filePath);
    }
  }

  await updateGeneratorManifestHashes(root);

  return changedFiles;
}

async function* walkFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules") {
      continue;
    }
    const entryPath = join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(entryPath);
    } else if (entry.isFile()) {
      yield entryPath;
    }
  }
}

function hasSupportedExtension(filePath, extensions) {
  return Array.from(extensions).some((extension) => filePath.endsWith(extension));
}

async function updateGeneratorManifestHashes(root) {
  const manifestPath = join(root, ".sdkwork", "sdkwork-generator-manifest.json");
  if (!(await pathExists(manifestPath))) {
    return;
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!Array.isArray(manifest.generatedFiles)) {
    return;
  }

  for (const fileEntry of manifest.generatedFiles) {
    if (!fileEntry || typeof fileEntry.path !== "string") {
      continue;
    }
    const filePath = join(root, ...fileEntry.path.split("/"));
    if (!(await pathExists(filePath))) {
      continue;
    }
    const fileContent = await readFile(filePath);
    fileEntry.sha256 = createHash("sha256").update(fileContent).digest("hex");
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
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
  const changedFiles = await normalizeGeneratedSdkWhitespace();
  if (changedFiles.length > 0) {
    console.log(`Normalized trailing whitespace in ${changedFiles.length} generated SDK files.`);
  }
}
