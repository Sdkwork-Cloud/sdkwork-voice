import React from "react";
import { Mic, ChevronRight, Sliders, Timer, Waves, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@sdkwork/ui-mobile-react";
import { VoiceParamSlider } from "./VoiceParamSlider";

interface VoiceSpeakerCardProps {
  t: (key: string) => string;
  selectedVoice: { name: string; type: string };
  onOpenVoiceSelector: () => void;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  speed: number;
  setSpeed: (v: number) => void;
  pitch: number;
  setPitch: (v: number) => void;
  volume: number;
  setVolume: (v: number) => void;
}

export const VoiceSpeakerCard: React.FC<VoiceSpeakerCardProps> = ({
  t,
  selectedVoice,
  onOpenVoiceSelector,
  showAdvanced,
  setShowAdvanced,
  speed,
  setSpeed,
  pitch,
  setPitch,
  volume,
  setVolume,
}) => {
  return (
    <div className="bg-white dark:bg-[#2c2d2e] rounded-2xl overflow-hidden shadow-sm border border-border-color/30 mb-4 flex flex-col">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer active:bg-active-bg transition-colors"
        onClick={onOpenVoiceSelector}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue">
            <Mic className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-medium text-text-main leading-tight mb-0.5">{t("voice_synth.speaker")}</span>
            <span className="text-[13px] text-text-sub">{selectedVoice.name} · {selectedVoice.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-primary-blue font-medium bg-primary-blue/5 px-3 py-1 rounded-full">{t("voice_synth.change")}</span>
          <ChevronRight className="w-4 h-4 text-text-sub" />
        </div>
      </div>

      <div className="h-[1px] bg-border-color/30 mx-4" />

      <div className="flex flex-col">
        <div 
          className="p-4 flex items-center justify-between cursor-pointer active:bg-active-bg transition-colors"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <div className="flex items-center gap-2 text-[14px] font-medium text-text-main">
            <Sliders className="w-4 h-4 text-text-sub" /> 
            {t("voice_synth.advanced_params")}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-text-sub">
            {showAdvanced ? t("voice_synth.collapse") : t("voice_synth.expand")}
            <ChevronRight className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-90")} />
          </div>
        </div>
        
        <AnimatePresence>
          {showAdvanced && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-5 flex flex-col gap-1">
                <VoiceParamSlider 
                  icon={Timer} label={t("voice_synth.speed")} 
                  min={0.5} max={2.0} step={0.1} value={speed} onChange={setSpeed} 
                  format={(v: number) => v.toFixed(1) + "x"} 
                />
                <VoiceParamSlider 
                  icon={Waves} label={t("voice_synth.pitch")} 
                  min={-50} max={50} step={1} value={pitch} onChange={setPitch} 
                  format={(v: number) => (v > 0 ? "+" : "") + v} 
                />
                <VoiceParamSlider 
                  icon={Volume2} label={t("voice_synth.volume")} 
                  min={0} max={100} step={1} value={volume} onChange={setVolume} 
                  format={(v: number) => v + "%"} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
