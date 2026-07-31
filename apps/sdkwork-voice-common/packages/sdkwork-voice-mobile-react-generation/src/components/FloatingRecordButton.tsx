import React from "react";
import { Mic, Square } from "lucide-react";
import { cn } from "@sdkwork/ui-mobile-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

interface FloatingRecordButtonProps {
  isRecording: boolean;
  onRecordToggle: () => void;
}

export const FloatingRecordButton: React.FC<FloatingRecordButtonProps> = ({
  isRecording,
  onRecordToggle,
}) => {
  const { t } = useTranslation();
return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={onRecordToggle}
        className={cn(
          "absolute bottom-6 right-6 w-14 h-14 text-white rounded-full flex items-center justify-center shadow-lg z-10 transition-colors",
          isRecording
            ? "bg-rose-500 shadow-rose-500/30 animate-pulse"
            : "bg-gradient-to-tr from-emerald-500 to-emerald-400 shadow-emerald-500/30",
        )}
      >
        {isRecording ? (
          <Square className="w-5 h-5 fill-current" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </motion.button>

      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 right-4 bg-gray-900/90 text-white px-4 py-2 rounded-full text-[13px] shadow-lg flex items-center gap-2 pointer-events-none"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {t('voice_summary.recording_started')}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
