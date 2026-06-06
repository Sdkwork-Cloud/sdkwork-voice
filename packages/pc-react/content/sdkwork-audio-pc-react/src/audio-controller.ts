import {
  useMemo,
  useSyncExternalStore,
} from "react";
import type { SdkworkAudioAsset, SdkworkAudioJobStatus, SdkworkAudioWorkspaceData } from "./audio";
import { createSdkworkAudioService, type SdkworkAudioService } from "./audio-service";

export interface SdkworkAudioControllerState {
  activeStatus: SdkworkAudioJobStatus | "all";
  activeVoice: string | "all";
  isBootstrapped: boolean;
  isLoading: boolean;
  lastError?: string;
  searchQuery: string;
  visibleItems: SdkworkAudioAsset[];
  workspace: SdkworkAudioWorkspaceData;
}

export interface CreateSdkworkAudioControllerOptions {
  service?: Partial<SdkworkAudioService>;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function deriveVisibleItems(
  workspace: SdkworkAudioWorkspaceData,
  activeVoice: string | "all",
  activeStatus: SdkworkAudioJobStatus | "all",
  searchQuery: string,
) {
  const query = normalizeText(searchQuery);

  return workspace.items.filter((item) => {
    if (activeVoice !== "all" && item.voiceId !== activeVoice) {
      return false;
    }
    if (activeStatus !== "all" && item.status !== activeStatus) {
      return false;
    }
    if (!query) {
      return true;
    }

    return [item.id, item.title, item.format].some((value) => normalizeText(value).includes(query));
  });
}

function normalizeState(state: SdkworkAudioControllerState): SdkworkAudioControllerState {
  return {
    ...state,
    visibleItems: deriveVisibleItems(
      state.workspace,
      state.activeVoice,
      state.activeStatus,
      state.searchQuery,
    ),
  };
}

export function createSdkworkAudioController(options: CreateSdkworkAudioControllerOptions = {}) {
  const service: SdkworkAudioService = options.service
    ? {
        ...createSdkworkAudioService(),
        ...options.service,
      }
    : createSdkworkAudioService();

  const listeners = new Set<() => void>();
  let state = normalizeState({
    activeStatus: "all",
    activeVoice: "all",
    isBootstrapped: false,
    isLoading: false,
    searchQuery: "",
    visibleItems: [],
    workspace: service.getEmptyWorkspace(),
  });

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function setState(next: Partial<SdkworkAudioControllerState>) {
    state = normalizeState({
      ...state,
      ...next,
    });
    emit();
  }

  return {
    async bootstrap() {
      setState({ isLoading: true, lastError: undefined });
      try {
        const workspace = await service.getWorkspace();
        setState({ isBootstrapped: true, isLoading: false, workspace });
        return state;
      } catch (error) {
        setState({
          isLoading: false,
          lastError: error instanceof Error ? error.message : "Failed to load audio workspace.",
        });
        throw error;
      }
    },

    getState() {
      return state;
    },

    async refresh() {
      const workspace = await service.getWorkspace();
      setState({ isBootstrapped: true, isLoading: false, workspace });
      return state;
    },

    setSearchQuery(query: string) {
      setState({ searchQuery: query });
    },

    setStatus(status: SdkworkAudioJobStatus | "all") {
      setState({ activeStatus: status });
    },

    setVoice(voiceId: string | "all") {
      setState({ activeVoice: voiceId });
    },

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useSdkworkAudioController(
  controller?: ReturnType<typeof createSdkworkAudioController>,
  service?: Partial<SdkworkAudioService>,
) {
  return useMemo(() => controller ?? createSdkworkAudioController(service ? { service } : undefined), [controller, service]);
}

export function useSdkworkAudioControllerState(
  controller: ReturnType<typeof createSdkworkAudioController>,
): SdkworkAudioControllerState {
  return useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
}
