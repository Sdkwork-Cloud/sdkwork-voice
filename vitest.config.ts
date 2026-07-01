import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

const workspaceRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceNodeModules = path.join(workspaceRoot, "node_modules");

export default defineConfig({
  root: workspaceRoot,
  plugins: [react()],
  resolve: {
    alias: [
      { find: "react", replacement: path.join(workspaceNodeModules, "react") },
      { find: "react-dom", replacement: path.join(workspaceNodeModules, "react-dom") },
      {
        find: "@sdkwork/voice-contracts",
        replacement: path.join(
          workspaceRoot,
          "apps/sdkwork-voice-common/packages/sdkwork-voice-contracts/src/index.ts",
        ),
      },
      {
        find: "@sdkwork/voice-provider-adapter",
        replacement: path.join(
          workspaceRoot,
          "apps/sdkwork-voice-common/packages/sdkwork-voice-provider-adapter/src/index.ts",
        ),
      },
      {
        find: "@sdkwork/voice-generation-worker",
        replacement: path.join(
          workspaceRoot,
          "apps/sdkwork-voice-common/packages/sdkwork-voice-generation-worker/src/index.ts",
        ),
      },
      {
        find: "@sdkwork/voice-drive-sync-worker",
        replacement: path.join(
          workspaceRoot,
          "apps/sdkwork-voice-common/packages/sdkwork-voice-drive-sync-worker/src/index.ts",
        ),
      },
      {
        find: "@sdkwork/voice-local-api-proxy",
        replacement: path.join(
          workspaceRoot,
          "apps/sdkwork-voice-pc/packages/sdkwork-voice-local-api-proxy/src/index.ts",
        ),
      },
      {
        find: "@sdkwork/voice-app-sdk",
        replacement: path.join(
          workspaceRoot,
          "sdks/sdkwork-voice-app-sdk/sdkwork-voice-app-sdk-typescript/generated/server-openapi/src/index.ts",
        ),
      },
      {
        find: "@sdkwork/voice-backend-sdk",
        replacement: path.join(
          workspaceRoot,
          "sdks/sdkwork-voice-backend-sdk/sdkwork-voice-backend-sdk-typescript/generated/server-openapi/src/index.ts",
        ),
      },
    ],
    dedupe: ["react", "react-dom"],
  },
  test: {
    exclude: [...configDefaults.exclude],
    environment: "jsdom",
    include: [
      "apps/**/*.test.ts",
      "apps/**/*.test.tsx",
      "tests/**/*.test.ts",
      "sdks/**/*.test.ts",
    ],
    setupFiles: [path.join(workspaceRoot, "vitest.setup.ts")],
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
});
