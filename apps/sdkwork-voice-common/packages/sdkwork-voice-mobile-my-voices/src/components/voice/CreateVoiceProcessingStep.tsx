import React from 'react';
import { motion } from 'motion/react';

export interface CreateVoiceProcessingStepProps {
  hint: string;
}

export const CreateVoiceProcessingStep: React.FC<CreateVoiceProcessingStepProps> = ({
  hint,
}) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6">
      <div className="relative w-20 h-20">
        <motion.div
          className="absolute inset-0 rounded-full border-[3px] border-primary-blue/20 border-t-primary-blue"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
      </div>
      <p className="text-[15px] text-text-sub text-center px-8 leading-relaxed">{hint}</p>
    </div>
  );
};
