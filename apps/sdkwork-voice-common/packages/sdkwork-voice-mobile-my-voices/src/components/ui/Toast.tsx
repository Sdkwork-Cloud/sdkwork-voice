import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  tone: ToastTone;
}

let toastRoot: Root | null = null;

function ensureContainer(): HTMLElement | null {
  let container = document.getElementById('sdkwork-voice-my-voices-toast');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sdkwork-voice-my-voices-toast';
    document.body.appendChild(container);
  }
  return container;
}

function renderToast(state: ToastState | null): void {
  const container = ensureContainer();
  if (!container) {
    return;
  }
  if (!toastRoot) {
    toastRoot = createRoot(container);
  }
  toastRoot.render(<ToastView state={state} />);
}

function ToastView({ state }: { state: ToastState | null }): React.ReactElement | null {
  if (!state) {
    return null;
  }
  const Icon =
    state.tone === 'success' ? CheckCircle2 : state.tone === 'error' ? XCircle : Info;
  const iconClass =
    state.tone === 'success'
      ? 'text-green-500'
      : state.tone === 'error'
        ? 'text-red-500'
        : 'text-primary-blue';
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none px-10">
      <div className="flex items-center gap-2 bg-black/75 dark:bg-black/80 text-white rounded-full px-4 py-2.5 shadow-lg backdrop-blur-sm">
        <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
        <span className="text-[13px] leading-snug">{state.message}</span>
      </div>
    </div>
  );
}

export function showToast(message: string, tone: ToastTone = 'success', duration = 1800): void {
  renderToast({ message, tone });
  window.setTimeout(() => renderToast(null), duration);
}
