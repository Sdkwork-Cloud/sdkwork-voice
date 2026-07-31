import React from "react";
import { Play, Pause, Download } from "lucide-react";
import { motion } from "motion/react";
import { IconButton, showToast } from "@sdkwork/ui-mobile-react";

interface VoiceAudioPlayerCardProps {
  t: (key: string) => string;
  audioUrl: string;
  isPlaying: boolean;
  togglePlay: () => void;
}

export const VoiceAudioPlayerCard: React.FC<VoiceAudioPlayerCardProps> = ({
  t,
  audioUrl,
  isPlaying,
  togglePlay,
}) => {
  if (!audioUrl) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#2c2d2e] rounded-2xl p-4 shadow-sm border border-border-color/30 flex items-center gap-4 mb-4"
    >
      <IconButton
        icon={isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
        className="w-10 h-10 bg-primary-blue hover:bg-blue-600 rounded-full shrink-0 shadow-md shadow-primary-blue/20"
        onClick={togglePlay}
      />
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-medium text-text-main truncate">{t("voice_synth.result_filename")}</span>
          <span className="text-[11px] text-text-sub font-mono">00:03</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-[#3a3b3c] rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary-blue rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: isPlaying ? "100%" : "0%" }}
            transition={{ duration: isPlaying ? 3 : 0, ease: "linear" }}
          />
        </div>
      </div>
      <IconButton
        icon={<Download className="w-5 h-5 text-text-sub" />}
        className="w-10 h-10 bg-gray-50 dark:bg-[#3a3b3c]"
        onClick={() => showToast(t("voice_synth.saved"))}
      />
    </motion.div>
  );
};
