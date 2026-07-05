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
  onSyncError?: (error: unknown, sync: DriveSyncItem) => void;
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

const RETRYABLE_SYNC_STATUSES = ["pending_upload", "failed"] as const;

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

  async function listRetryableRows(page: number): Promise<DriveSyncItem[]> {
    const merged = new Map<string, DriveSyncItem>();

    for (const syncStatus of RETRYABLE_SYNC_STATUSES) {
      const pageResult = await options.backendClient.voice.artifactDriveSync.list({
        page,
        pageSize,
        syncStatus,
      });
      for (const sync of (pageResult.items ?? []) as DriveSyncItem[]) {
        const syncId = String(sync.id ?? "");
        if (!syncId) {
          continue;
        }
        merged.set(syncId, sync);
      }
    }

    return Array.from(merged.values()).filter((sync) =>
      RETRYABLE_SYNC_STATUSES.includes(
        (sync.syncStatus ?? "") as (typeof RETRYABLE_SYNC_STATUSES)[number],
      ),
    );
  }

  async function runOnce(): Promise<number> {
    let page = 1;
    let processed = 0;

    while (!options.signal?.aborted) {
      const items = await listRetryableRows(page);
      if (items.length === 0) {
        break;
      }

      for (const sync of items) {
        if (options.signal?.aborted) {
          return processed;
        }
        try {
          await processSyncRow(sync);
          processed += 1;
        } catch (error) {
          options.onSyncError?.(error, sync);
        }
      }

      if (items.length < pageSize) {
        break;
      }
      page += 1;
    }

    return processed;
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
