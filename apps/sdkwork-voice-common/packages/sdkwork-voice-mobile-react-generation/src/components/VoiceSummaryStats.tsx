import React from "react";
import { Mic } from "lucide-react";
import { useTranslation } from "react-i18next";

interface VoiceSummaryStatsProps {
  totalCount: number;
}

export const VoiceSummaryStats: React.FC<VoiceSummaryStatsProps> = ({ totalCount }) => {
  const { t } = useTranslation();
return (
    <div className="bg-primary-blue px-6 pt-4 pb-12 flex justify-between items-center text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl">
        <Mic className="w-32 h-32" />
      </div>
      <div className="relative z-10">
        <div className="text-[32px] font-medium tracking-tight leading-none mb-1">
          {totalCount}
        </div>
        <div className="text-[13px] opacity-80">{t('voice_summary.generated_count')}</div>
      </div>
      <div className="flex gap-4 relative z-10">
        <div className="flex flex-col items-center">
          <div className="text-[20px] font-medium leading-none mb-1">
            10h
          </div>
          <div className="text-[12px] opacity-80">{t('voice_summary.process_time')}</div>
        </div>
      </div>
    </div>
  );
};
