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
      { find: "@sdkwork/audio-pc-react", replacement: path.join(workspaceRoot, "packages/pc-react/content/sdkwork-audio-pc-react/src/index.ts") },
      { find: "@sdkwork/voice-contracts", replacement: path.join(workspaceRoot, "packages/common/voice/sdkwork-voice-contracts/src/index.ts") },
      { find: "@sdkwork/voice-local-api-proxy", replacement: path.join(workspaceRoot, "packages/pc-react/voice/sdkwork-voice-local-api-proxy/src/index.ts") }
    ],
    dedupe: ["react", "react-dom"]
  },
  test: {
    exclude: [...configDefaults.exclude],
    environment: "jsdom",
    include: ["packages/**/*.test.ts", "packages/**/*.test.tsx", "tests/**/*.test.ts", "sdks/**/*.test.ts"],
    setupFiles: [path.join(workspaceRoot, "vitest.setup.ts")]
  },
  server: {
    fs: {
      allow: [workspaceRoot]
    }
  }
});
