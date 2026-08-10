import React from 'react';
import { Mic, Play, Square } from 'lucide-react';
import { motion } from 'motion/react';

import { formatVoiceDuration, type MyVoiceProfile } from '../types/myVoice';

export const VoiceProfileCard: React.FC<{
  profile: MyVoiceProfile;
  isPlaying: boolean;
  onClick: () => void;
  onPlayClick: (event: React.MouseEvent) => void;
  onLongPressProps?: Record<string, unknown>;
}> = ({ profile, isPlaying, onClick, onPlayClick, onLongPressProps }) => {
  const meta = profile.description
    ? profile.description
    : `${formatVoiceDuration(profile.durationSeconds)} · ${profile.kind}`;
  return (
    <div
      className="bg-white dark:bg-[#1A1A1A] px-4 py-3.5 flex items-center justify-between border-b border-border-color last:border-b-0 active:bg-chat-active-bg transition-colors cursor-pointer select-none touch-callout-none"
      onClick={onClick}
      {...(onLongPressProps ?? {})}
    >
      <div className="flex items-center gap-3 pointer-events-none min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center relative shrink-0">
          <Mic className="w-5 h-5 text-primary-blue" />
          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary-blue"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[16px] font-medium text-text-main truncate">
            {profile.name}
          </span>
          <span className="text-[12px] text-text-sub truncate">{meta}</span>
        </div>
      </div>
      <div
        className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center active:scale-95 transition-transform shrink-0 ml-3"
        onClick={onPlayClick}
      >
        {isPlaying ? (
          <Square className="w-3.5 h-3.5 text-text-main fill-current" />
        ) : (
          <Play className="w-4 h-4 text-text-main ml-0.5" />
        )}
      </div>
    </div>
  );
};
