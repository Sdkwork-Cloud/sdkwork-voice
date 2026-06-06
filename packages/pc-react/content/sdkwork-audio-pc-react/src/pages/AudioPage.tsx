import { useEffect } from "react";
import type { ReactNode } from "react";
import type { SdkworkAudioJobStatus } from "../audio";
import { SdkworkAudioGallery } from "../components/AudioGallery";
import { SdkworkAudioSummaryCards } from "../components/AudioSummaryCards";
import { useSdkworkAudioController, useSdkworkAudioControllerState } from "../audio-controller";
import type { SdkworkAudioService } from "../audio-service";

export interface SdkworkAudioPageProps {
  controller?: ReturnType<typeof import("../audio-controller").createSdkworkAudioController>;
  service?: Partial<SdkworkAudioService>;
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel-muted)] px-4 py-5 text-sm text-[var(--sdk-color-text-secondary)]">
      {label}
    </div>
  );
}

function StatusNotice({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="rounded-[1.2rem] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

export function SdkworkAudioPage({ controller: controllerProp, service }: SdkworkAudioPageProps) {
  const controller = useSdkworkAudioController(controllerProp, service);
  const state = useSdkworkAudioControllerState(controller);

  useEffect(() => {
    if (!state.isBootstrapped && !state.isLoading) {
      void controller.bootstrap();
    }
  }, [controller, state.isBootstrapped, state.isLoading]);

  return (
    <div className="h-full overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-[96rem] space-y-5">
        <section className="rounded-[2rem] bg-[linear-gradient(135deg,#09090b,#18181b_45%,#27272a)] px-6 py-7 text-white shadow-[var(--sdk-shadow-lg)]">
          <h1 className="text-4xl font-semibold tracking-tight">Audio Workspace</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72">
            Track audio presets, processing jobs, and reusable voice outputs from a composable audio surface.
          </p>
        </section>

        {state.isLoading && !state.isBootstrapped ? <LoadingBlock label="Loading audio workspace..." /> : null}
        {state.lastError ? <StatusNotice title="Audio workspace error">{state.lastError}</StatusNotice> : null}

        <SdkworkAudioSummaryCards digest={state.workspace.digest} />

        <section className="rounded-[1.5rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              className="w-full rounded-[0.95rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm text-[var(--sdk-color-text-primary)] outline-none"
              onChange={(event) => controller.setSearchQuery(event.target.value)}
              placeholder="Search audio"
              type="search"
              value={state.searchQuery}
            />
            <div className="flex flex-wrap gap-2">
              <button className={`rounded-full px-3 py-1.5 text-xs font-semibold ${state.activeVoice === "all" ? "bg-cyan-500 text-white" : "bg-[var(--sdk-color-surface-panel-muted)] text-[var(--sdk-color-text-secondary)]"}`} onClick={() => controller.setVoice("all")} type="button">All voices</button>
              {state.workspace.voices.map((voice) => (
                <button className={`rounded-full px-3 py-1.5 text-xs font-semibold ${state.activeVoice === voice.id ? "bg-cyan-500 text-white" : "bg-[var(--sdk-color-surface-panel-muted)] text-[var(--sdk-color-text-secondary)]"}`} key={voice.id} onClick={() => controller.setVoice(voice.id)} type="button">
                  {voice.title}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(["all", "ready", "processing", "queued"] as const).map((status) => (
              <button className={`rounded-[0.85rem] border px-3 py-1.5 text-xs font-semibold ${state.activeStatus === status ? "border-sky-500 bg-sky-500/10 text-sky-500" : "border-[var(--sdk-color-border-default)] text-[var(--sdk-color-text-secondary)]"}`} key={status} onClick={() => controller.setStatus(status as SdkworkAudioJobStatus | "all")} type="button">
                {status}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <SdkworkAudioGallery items={state.visibleItems} />
          </div>
        </section>
      </div>
    </div>
  );
}
