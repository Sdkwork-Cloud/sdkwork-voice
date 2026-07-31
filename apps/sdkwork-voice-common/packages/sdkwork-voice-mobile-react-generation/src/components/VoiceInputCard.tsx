import React from "react";

interface VoiceInputCardProps {
  text: string;
  setText: (text: string) => void;
  placeholder: string;
}

export const VoiceInputCard: React.FC<VoiceInputCardProps> = ({
  text,
  setText,
  placeholder,
}) => {
  return (
    <div className="bg-white dark:bg-[#2c2d2e] rounded-2xl p-4 shadow-sm border border-border-color/30 mb-4 flex flex-col">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full h-36 bg-transparent text-[15px] resize-none outline-none text-text-main placeholder:text-text-sub/50 mb-2 leading-relaxed"
        maxLength={1000}
      />
      <div className="flex items-center justify-between border-t border-border-color/50 pt-3">
        <div className="flex gap-2" />
        <div className="text-[12px] text-text-sub font-mono">
          {text.length}<span className="opacity-50">/1000</span>
        </div>
      </div>
    </div>
  );
};
