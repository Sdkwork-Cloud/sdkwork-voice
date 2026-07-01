import type {
  SdkworkVoiceOperationType,
  SdkworkVoiceProviderInvocationResult,
  SdkworkVoiceTask,
} from "@sdkwork/voice-contracts";
import type { VoiceProviderAdapter } from "@sdkwork/voice-provider-adapter";

export interface VoiceGenerationWorkerBackend {
  voice: {
    tasks: {
      list(params?: { page?: number; pageSize?: number; status?: string }): Promise<{ items?: unknown[] }>;
      reconcile(taskId: string, body: Record<string, unknown>): Promise<unknown>;
    };
  };
}

export interface VoiceGenerationWorkerOptions {
  backendClient: VoiceGenerationWorkerBackend;
  providerAdapter: VoiceProviderAdapter;
  pollIntervalMs?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export interface VoiceGenerationWorker {
  runOnce(): Promise<number>;
  runLoop(): Promise<void>;
}

type BackendTaskItem = {
  id?: string | number;
  operationType?: SdkworkVoiceOperationType;
  requestJson?: string;
  status?: string;
};

function parseRequestJson(task: BackendTaskItem): Record<string, unknown> {
  if (!task.requestJson) {
    return {};
  }
  try {
    const parsed = JSON.parse(task.requestJson) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function mapInvocationToProviderResult(
  invocation: SdkworkVoiceProviderInvocationResult,
): Record<string, unknown> {
  const status =
    invocation.status === "completed"
      ? "succeeded"
      : invocation.status === "task_started"
        ? "submitted"
        : "running";

  return {
    status,
    providerTaskId: invocation.providerTaskId,
    providerResponse: invocation.providerResponse,
    generatedArtifacts: invocation.generatedArtifacts,
    result: invocation.task,
  };
}

async function invokeProviderForTask(
  adapter: VoiceProviderAdapter,
  task: BackendTaskItem,
): Promise<SdkworkVoiceProviderInvocationResult> {
  const request = parseRequestJson(task);
  switch (task.operationType) {
    case "speech":
      return adapter.startSpeech(request as never);
    case "transcription":
      return adapter.startTranscription(request as never);
    case "translation":
      return adapter.startTranslation(request as never);
    case "sound_effect":
      return adapter.startSoundEffect(request as never);
    case "music":
      return adapter.startMusic(request as never);
    default:
      throw new Error(`unsupported voice operation type: ${String(task.operationType)}`);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createVoiceGenerationWorker(
  options: VoiceGenerationWorkerOptions,
): VoiceGenerationWorker {
  const pollIntervalMs = options.pollIntervalMs ?? 2_000;
  const pageSize = options.pageSize ?? 20;

  async function processTask(task: BackendTaskItem): Promise<void> {
    const taskId = String(task.id ?? "");
    if (!taskId) {
      return;
    }

    const invocation = await invokeProviderForTask(options.providerAdapter, task);
    await options.backendClient.voice.tasks.reconcile(taskId, {
      providerResult: mapInvocationToProviderResult(invocation),
    } as never);
  }

  async function runOnce(): Promise<number> {
    const page = await options.backendClient.voice.tasks.list({
      page: 1,
      pageSize,
      status: "queued",
    });
    const items = ((page.items ?? []) as BackendTaskItem[]).filter(
      (task) => !task.status || task.status === "queued",
    );
    for (const task of items) {
      if (options.signal?.aborted) {
        break;
      }
      await processTask(task);
    }
    return items.length;
  }

  async function runLoop(): Promise<void> {
    while (!options.signal?.aborted) {
      const processed = await runOnce();
      if (processed === 0) {
        await delay(pollIntervalMs);
      }
    }
  }

  return { runOnce, runLoop };
}

export type { SdkworkVoiceTask };
