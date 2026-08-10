import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';

export interface CreateVoiceUploadStepProps {
  hint: string;
  selectLabel: string;
  uploadingLabel?: string;
  uploading: boolean;
  onFileSelected: (file: File) => void;
}

export const CreateVoiceUploadStep: React.FC<CreateVoiceUploadStepProps> = ({
  hint,
  selectLabel,
  uploadingLabel,
  uploading,
  onFileSelected,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pickFile = () => {
    if (uploading) {
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        onFileSelected(file);
      }
    };
    inputRef.current = input;
    input.click();
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8">
      <p className="text-[13px] text-text-sub text-center px-8 leading-relaxed">{hint}</p>
      <button
        type="button"
        onClick={pickFile}
        disabled={uploading}
        className="flex flex-col items-center gap-4 active:scale-95 transition-transform disabled:opacity-50"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary-blue/10 border border-dashed border-primary-blue/40 flex items-center justify-center">
          <UploadCloud className="w-9 h-9 text-primary-blue" />
        </div>
        <span className="text-[15px] font-medium text-primary-blue">
          {uploading ? (uploadingLabel ?? '上传中…') : selectLabel}
        </span>
      </button>
    </div>
  );
};
