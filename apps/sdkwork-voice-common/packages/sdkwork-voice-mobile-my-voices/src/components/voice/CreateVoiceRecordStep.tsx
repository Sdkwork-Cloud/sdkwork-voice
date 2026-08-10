import React from 'react';
import { Mic, Square, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

export interface CreateVoiceRecordStepProps {
  recordingState: 'idle' | 'recording' | 'recorded';
  timer: number;
  formatTime: (seconds: number) => string;
  onStart: () => void;
  onStop: () => void;
  onRetake: () => void;
  hint: string;
  startLabel: string;
  stopLabel: string;
  retakeLabel: string;
}

export const CreateVoiceRecordStep: React.FC<CreateVoiceRecordStepProps> = ({
  recordingState,
  timer,
  formatTime,
  onStart,
  onStop,
  onRetake,
  hint,
  startLabel,
  stopLabel,
  retakeLabel,
}) => {
  if (recordingState === 'recorded') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-5">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <RotateCcw className="w-8 h-8 text-green-500" />
        </div>
        <button
          type="button"
          className="px-6 py-3 rounded-full bg-bg-color dark:bg-white/10 text-text-main text-[15px] font-medium active:opacity-80"
          onClick={onRetake}
        >
          {retakeLabel}
        </button>
      </div>
    );
  }

  const isRecording = recordingState === 'recording';

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8">
      <p className="text-[13px] text-text-sub text-center px-8 leading-relaxed">{hint}</p>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-500"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
          )}
          <button
            type="button"
            onClick={isRecording ? onStop : onStart}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform ${
              isRecording ? 'bg-red-500' : 'bg-primary-blue'
            }`}
          >
            {isRecording ? (
              <Square className="w-7 h-7 text-white fill-current" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
        </div>
        <span className={`text-[15px] font-medium ${isRecording ? 'text-red-500' : 'text-text-main'}`}>
          {isRecording ? `${formatTime(timer)} · ${stopLabel}` : startLabel}
        </span>
      </div>
    </div>
  );
};
