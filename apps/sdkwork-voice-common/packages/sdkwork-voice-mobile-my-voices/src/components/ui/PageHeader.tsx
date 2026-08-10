import React from 'react';
import { ChevronLeft } from 'lucide-react';

export const IconButton: React.FC<{
  icon: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}> = ({ icon, onClick, ariaLabel }) => {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="w-10 h-10 flex items-center justify-center rounded-full active:bg-chat-active-bg transition-colors"
      onClick={onClick}
    >
      {icon}
    </button>
  );
};

export const PageHeader: React.FC<{
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}> = ({ title, onBack, right }) => {
  return (
    <header className="h-[56px] flex items-center justify-between px-1 glass-header sticky top-0 z-10 shrink-0 pt-safe">
      <div className="flex items-center z-10 flex-1">
        <IconButton
          ariaLabel="back"
          icon={<ChevronLeft className="w-6 h-6 text-text-main" strokeWidth={2.5} />}
          onClick={onBack}
        />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
        <h1 className="text-[17px] font-medium text-text-main">{title}</h1>
      </div>
      <div className="flex items-center justify-end z-10 flex-1 pr-2">{right}</div>
    </header>
  );
};
