import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AlertTriangle } from 'lucide-react';

interface ConfirmState {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  resolve: (confirmed: boolean) => void;
}

let confirmRoot: Root | null = null;

function ensureContainer(): HTMLElement | null {
  let container = document.getElementById('sdkwork-voice-my-voices-confirm');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sdkwork-voice-my-voices-confirm';
    document.body.appendChild(container);
  }
  return container;
}

function renderConfirm(state: ConfirmState | null): void {
  const container = ensureContainer();
  if (!container) {
    return;
  }
  if (!confirmRoot) {
    confirmRoot = createRoot(container);
  }
  confirmRoot.render(<ConfirmView state={state} />);
}

function ConfirmView({ state }: { state: ConfirmState | null }): React.ReactElement | null {
  if (!state) {
    return null;
  }
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center px-10 bg-black/40"
      onClick={() => {
        state.resolve(false);
        renderConfirm(null);
      }}
    >
      <div
        className="w-full max-w-[300px] bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-11 h-11 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-[16px] font-semibold text-text-main">{state.title}</h3>
          {state.message ? (
            <p className="text-[13px] text-text-sub mt-1.5 leading-relaxed">{state.message}</p>
          ) : null}
        </div>
        <div className="flex gap-3">
          <button
            className="flex-1 py-2.5 rounded-full bg-bg-color dark:bg-white/10 text-text-main text-[14px] font-medium active:opacity-80 transition-opacity"
            onClick={() => {
              state.resolve(false);
              renderConfirm(null);
            }}
          >
            {state.cancelLabel ?? '取消'}
          </button>
          <button
            className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-[14px] font-medium active:opacity-80 transition-opacity"
            onClick={() => {
              state.resolve(true);
              renderConfirm(null);
            }}
          >
            {state.confirmLabel ?? '删除'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function showConfirm(options: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    renderConfirm({
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel,
      cancelLabel: options.cancelLabel,
      danger: true,
      resolve,
    });
  });
}
