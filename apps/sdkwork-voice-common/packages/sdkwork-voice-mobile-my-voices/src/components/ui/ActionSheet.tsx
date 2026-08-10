import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ActionSheetOption {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  options,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9997] bg-black/40"
          onClick={onClose}
        >
          <motion.div
            className="absolute bottom-0 inset-x-0 bg-white dark:bg-[#1C1C1E] rounded-t-2xl px-3 pt-2 pb-6 pb-safe"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(event) => event.stopPropagation()}
          >
            {title ? (
              <p className="text-center text-[13px] text-text-sub py-2.5 border-b border-border-color mb-1">
                {title}
              </p>
            ) : null}
            <div className="flex flex-col">
              {options.map((option) => (
                <button
                  key={option.label}
                  className={`py-3.5 text-[16px] font-medium border-b border-border-color last:border-b-0 active:bg-chat-active-bg transition-colors ${
                    option.danger ? 'text-red-500' : 'text-text-main'
                  }`}
                  onClick={() => {
                    onClose();
                    option.onClick();
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              className="w-full mt-2 py-3.5 text-[16px] text-text-sub rounded-xl bg-bg-color dark:bg-white/10 active:opacity-80 transition-opacity"
              onClick={onClose}
            >
              取消
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
