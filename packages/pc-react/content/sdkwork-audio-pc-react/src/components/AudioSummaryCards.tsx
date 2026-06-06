import type { SdkworkAudioDigest } from "../audio";

export function SdkworkAudioSummaryCards({ digest }: { digest: SdkworkAudioDigest }) {
  const cards = [
    { id: "total", label: "Total audio", value: digest.totalAudio },
    { id: "ready", label: "Ready audio", value: digest.readyAudio },
    { id: "jobs", label: "Active jobs", value: digest.activeJobs },
    { id: "voices", label: "Voices", value: digest.voiceCount },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article className="rounded-[1.25rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] p-4" key={card.id}>
          <div className="text-sm text-[var(--sdk-color-text-secondary)]">{card.label}</div>
          <div className="mt-2 text-2xl font-semibold text-[var(--sdk-color-text-primary)]">{card.value}</div>
        </article>
      ))}
    </div>
  );
}
