import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { motion } from 'motion/react';

import { resolveMyVoicePlaybackUrl } from '../services/myVoiceService';
import type { MyVoiceProfile } from '../types/myVoice';

export interface AudioPreviewPlayerProps {
  profile: MyVoiceProfile;
  quote?: string;
  onPlaybackError?: (error: unknown) => void;
}

export const AudioPreviewPlayer: React.FC<AudioPreviewPlayerProps> = ({
  profile,
  quote,
  onPlaybackError,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsResolving(true);
    resolveMyVoicePlaybackUrl(profile)
      .then((url) => {
        if (!cancelled) setPlaybackUrl(url);
      })
      .catch((error: unknown) => {
        if (!cancelled) onPlaybackError?.(error);
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, onPlaybackError]);

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
    if (!playbackUrl) {
      onPlaybackError?.(new Error('playback url unavailable'));
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        onPlaybackError?.(new Error('audio playback failed'));
      };
    }
    audioRef.current.src = playbackUrl;
    void audioRef.current.play().then(
      () => setIsPlaying(true),
      (error: unknown) => {
        setIsPlaying(false);
        onPlaybackError?.(error);
      },
    );
  }, [isPlaying, playbackUrl, onPlaybackError]);

  return (
    <div className="w-full bg-chat-other-bg rounded-3xl p-8 shadow-sm border border-border-color flex flex-col items-center justify-center relative">
      <h3 className="text-[16px] font-medium text-text-sub mb-6 flex items-center gap-2">
        {quote ?? ''}
      </h3>
      {quote ? (
        <p className="text-[22px] leading-relaxed text-text-main/90 font-serif tracking-wide text-center mt-2 px-4">
          {quote}
        </p>
      ) : null}
      <div className="mt-8 flex justify-center w-full">
        <button
          type="button"
          onClick={() => void togglePlay()}
          disabled={isResolving || !playbackUrl}
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
  );
};
