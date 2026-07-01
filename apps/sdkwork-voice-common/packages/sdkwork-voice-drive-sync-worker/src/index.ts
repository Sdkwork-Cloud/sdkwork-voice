export interface VoiceDriveSyncWorkerBackend {
  voice: {
    artifactDriveSync: {
      list(params?: {
        page?: number;
        pageSize?: number;
        syncStatus?: string;
      }): Promise<{ items?: unknown[] }>;
      retry(syncId: string, body?: Record<string, unknown>): Promise<unknown>;
    };
  };
}

export interface VoiceDriveSyncWorkerOptions {
  backendClient: VoiceDriveSyncWorkerBackend;
  pollIntervalMs?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export interface VoiceDriveSyncWorker {
  runOnce(): Promise<number>;
  runLoop(): Promise<void>;
}

type DriveSyncItem = {
  id?: string | number;
  syncStatus?: string;
  sourceUri?: string;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createVoiceDriveSyncWorker(
  options: VoiceDriveSyncWorkerOptions,
): VoiceDriveSyncWorker {
  const pollIntervalMs = options.pollIntervalMs ?? 3_000;
  const pageSize = options.pageSize ?? 20;

  async function processSyncRow(sync: DriveSyncItem): Promise<void> {
    const syncId = String(sync.id ?? "");
    if (!syncId) {
      return;
    }
    await options.backendClient.voice.artifactDriveSync.retry(syncId, {});
  }

  async function runOnce(): Promise<number> {
    const page = await options.backendClient.voice.artifactDriveSync.list({
      page: 1,
      pageSize,
      syncStatus: "pending_upload",
    });
    const items = ((page.items ?? []) as DriveSyncItem[]).filter(
      (sync) =>
        sync.syncStatus === "pending_upload" ||
        sync.syncStatus === "failed",
    );
    for (const sync of items) {
      if (options.signal?.aborted) {
        break;
      }
      await processSyncRow(sync);
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
