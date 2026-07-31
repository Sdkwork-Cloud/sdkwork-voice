import React from "react";
import { Play, Pause, FileAudio, FileText, Hash } from "lucide-react";
import { IconButton } from "@sdkwork/ui-mobile-react";
import { VoiceSummaryRecord } from "../services/VoiceSummaryService";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

interface VoiceSummaryItemProps {
  summary: VoiceSummaryRecord;
  playingId: string | null;
  onPlayToggle: (e: React.MouseEvent, id: string) => void;
}

export const VoiceSummaryItem: React.FC<VoiceSummaryItemProps> = ({
  summary,
  playingId,
  onPlayToggle,
}) => {
  const { t } = useTranslation();
return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-[#2c2d2e] p-4 rounded-xl cursor-default shadow-sm border border-border-color/30"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center relative overflow-hidden">
            <FileAudio className="w-5 h-5 text-indigo-500 relative z-10" />
            {playingId === summary.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 opacity-50 animate-pulse" />
            )}
          </div>
          <div>
            <div className="text-[16px] font-medium text-text-main leading-tight mb-1">
              {summary.title}
            </div>
            <div className="text-[13px] text-text-sub flex items-center gap-2">
              <span>{summary.date}</span>
              <span className="w-1 h-1 bg-border-color rounded-full" />
              <span>{summary.duration}</span>
            </div>
          </div>
        </div>
        <IconButton
          icon={
            playingId === summary.id ? (
              <Pause className="w-5 h-5 text-text-sub" />
            ) : (
              <Play className="w-5 h-5 text-text-sub" />
            )
          }
          className="w-8 h-8 -mr-2 bg-gray-50 dark:bg-[#3a3b3c]"
          onClick={(e) => onPlayToggle(e, summary.id)}
        />
      </div>

      <div className="text-[14px] text-text-main bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg flex flex-col gap-2 border border-blue-100 dark:border-blue-800/30">
        <div className="flex items-center gap-1 text-primary-blue font-medium mb-1 border-b border-blue-100 dark:border-blue-800/30 pb-2">
          <FileText className="w-4 h-4" /> {t('voice_summary.ai_summary')}
        </div>
        <p className="text-[13px] leading-relaxed text-text-main">
          {summary.summary}
        </p>

        <div className="flex flex-wrap gap-2 mt-1">
          {summary.keywords.map((kw) => (
            <span
              key={kw}
              className="text-[11px] bg-white dark:bg-[#202122] text-text-sub px-2 py-0.5 rounded border border-border-color/50 flex items-center gap-0.5"
            >
              <Hash className="w-3 h-3 text-primary-blue/70" /> {kw}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
