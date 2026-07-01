import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const workspaceRoot = resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(resolve(workspaceRoot, relativePath), "utf8");
}

test("voice Rust workspace uses standard crates layout and names", () => {
  const rootCargo = read("Cargo.toml");
  const packageJson = JSON.parse(read("package.json"));
  const pnpmWorkspace = read("pnpm-workspace.yaml");
  const materializer = read("sdks/materialize-voice-v3-openapi-boundaries.mjs");

  assert.equal(
    rootCargo.includes("packages/native-rust"),
    false,
    "root Cargo.toml must not retain legacy packages/native-rust members or dependency paths",
  );
  assert.equal(
    pnpmWorkspace.includes("packages/native-rust"),
    false,
    "pnpm workspace must not include legacy Rust package globs",
  );
  assert.equal(
    packageJson.scripts["test:rust"],
    "cargo test --workspace",
    "Rust verification must run from the standard Cargo workspace",
  );
  assert.equal(
    materializer.includes("packages/native-rust"),
    false,
    "OpenAPI materializer must scan standard crates/ route sources",
  );

  for (const expected of [
    "crates/sdkwork-voice-contract",
    "crates/sdkwork-voice-service",
    "crates/sdkwork-voice-embedded-bootstrap",
    "crates/sdkwork-voice-standalone-gateway",
    "crates/sdkwork-voice-gateway-assembly",
    "crates/sdkwork-voice-database-host",
    "crates/sdkwork-routes-voice-http-auth",
    "crates/sdkwork-voice-artifact-drive-service",
    "crates/sdkwork-voice-generation-repository-sqlx",
    "crates/sdkwork-voice-local-api-proxy-native-host",
    "crates/sdkwork-routes-voice-app-api",
    "crates/sdkwork-routes-voice-backend-api",
  ]) {
    assert.match(rootCargo, new RegExp(expected.replaceAll("/", "[/\\\\]")));
    assert.equal(existsSync(resolve(workspaceRoot, expected, "Cargo.toml")), true, `missing ${expected}`);
  }

  for (const forbidden of [
    "sdkwork_voice_drive",
    "sdkwork_voice_storage_sqlx",
    "sdkwork_voice_http",
    "sdkwork-voice-drive-rust",
    "sdkwork-voice-storage-sqlx-rust",
    "sdkwork-voice-http-rust",
  ]) {
    assert.equal(rootCargo.includes(forbidden), false, `root Cargo.toml retains ${forbidden}`);
  }
  assert.doesNotMatch(
    rootCargo,
    /sdkwork-voice-local-api-proxy-native(?!-host)[\s"',/}]/u,
    "root Cargo.toml retains sdkwork-voice-local-api-proxy-native",
  );
});
