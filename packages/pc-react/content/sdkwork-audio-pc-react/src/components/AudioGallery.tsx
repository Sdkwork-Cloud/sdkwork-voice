import type { SdkworkAudioAsset } from "../audio";

export function SdkworkAudioGallery({ items }: { items: readonly SdkworkAudioAsset[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.2rem] border border-dashed border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel-muted)] px-4 py-8 text-center text-sm text-[var(--sdk-color-text-secondary)]">
        No audio items match the current filters.
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((item) => (
        <article className="rounded-[1.2rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] p-4" key={item.id}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[var(--sdk-color-text-primary)]">{item.title}</h3>
            <span className="rounded-full bg-[var(--sdk-color-surface-panel-muted)] px-2 py-0.5 text-xs font-semibold uppercase text-[var(--sdk-color-text-secondary)]">
              {item.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">{item.format} | {item.durationLabel}</p>
        </article>
      ))}
    </div>
  );
}
