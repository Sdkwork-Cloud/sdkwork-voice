import React from "react";
import { LucideIcon } from "lucide-react";

interface VoiceParamSliderProps {
  icon: LucideIcon;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  format: (val: number) => string;
}

export const VoiceParamSlider: React.FC<VoiceParamSliderProps> = ({
  icon: Icon,
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}) => {
  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] text-text-main font-medium">
          <Icon className="w-4 h-4 text-primary-blue" />
          {label}
        </div>
        <span className="text-[13px] text-primary-blue font-medium bg-primary-blue/10 px-2 py-0.5 rounded-full">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary-blue h-1.5 bg-gray-200 dark:bg-[#3a3b3c] rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};
