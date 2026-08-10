import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { motion } from 'motion/react';

export interface CreateVoicePreviewStepProps {
  blobUrl: string | null;
  quote: string;
  confirmLabel: string;
  retakeLabel: string;
  onConfirm: () => void;
  onRetake: () => void;
}

export const CreateVoicePreviewStep: React.FC<CreateVoicePreviewStepProps> = ({
  blobUrl,
  quote,
  confirmLabel,
  retakeLabel,
  onConfirm,
  onRetake,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current?.removeAttribute('src');
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    if (!blobUrl) {
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => setIsPlaying(false);
    }
    audioRef.current.src = blobUrl;
    void audioRef.current.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false),
    );
  }, [isPlaying, blobUrl]);

  return (
    <div className="flex flex-col flex-1 gap-6">
      <div className="w-full bg-chat-other-bg rounded-3xl p-8 shadow-sm border border-border-color flex flex-col items-center justify-center relative">
        <h3 className="text-[16px] font-medium text-text-sub mb-6">{quote}</h3>
        <div className="mt-2 flex justify-center w-full">
          <button
            type="button"
            onClick={() => void togglePlay()}
            disabled={!blobUrl}
            className="flex flex-col items-center gap-3 active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center shadow-md relative">
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 border-[2px] border-primary-blue rounded-full"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
              {isPlaying ? (
                <Square className="w-6 h-6 text-white fill-current relative z-10" />
              ) : (
                <Play className="w-6 h-6 text-white fill-current ml-1 relative z-10" />
              )}
            </div>
          </button>
        </div>
      </div>
      <div className="flex gap-3 px-1 pb-safe">
        <button
          type="button"
          className="flex-1 py-3.5 rounded-full bg-bg-color dark:bg-white/10 text-text-main text-[15px] font-medium active:opacity-80 transition-opacity"
          onClick={onRetake}
        >
          {retakeLabel}
        </button>
        <button
          type="button"
          className="flex-1 py-3.5 rounded-full bg-primary-blue text-white text-[15px] font-medium active:opacity-80 transition-opacity"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
};
