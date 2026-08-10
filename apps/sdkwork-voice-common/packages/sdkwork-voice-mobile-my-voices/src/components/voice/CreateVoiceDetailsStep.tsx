import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface CreateVoiceDetailsStepProps {
  nameLabel: string;
  namePlaceholder: string;
  descLabel: string;
  descPlaceholder: string;
  saveLabel: string;
  savingLabel: string;
  nameRequiredMessage: string;
  saving: boolean;
  onSave: (name: string, description: string) => void;
}

export const CreateVoiceDetailsStep: React.FC<CreateVoiceDetailsStepProps> = ({
  nameLabel,
  namePlaceholder,
  descLabel,
  descPlaceholder,
  saveLabel,
  savingLabel,
  nameRequiredMessage,
  saving,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(nameRequiredMessage);
      return;
    }
    setError(null);
    onSave(trimmed, description.trim());
  };

  return (
    <div className="flex flex-col flex-1 gap-5">
      <div className="flex flex-col items-center gap-3 pt-2">
        <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] text-text-sub px-1">{nameLabel}</label>
        <input
          type="text"
          value={name}
          maxLength={128}
          onChange={(event) => setName(event.target.value)}
          placeholder={namePlaceholder}
          className="w-full px-4 py-3 rounded-xl bg-bg-color dark:bg-white/10 text-text-main text-[15px] placeholder:text-text-sub/60 outline-none focus:ring-2 focus:ring-primary-blue/40 transition-shadow"
        />
        {error ? <p className="text-[12px] text-red-500 px-1">{error}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] text-text-sub px-1">{descLabel}</label>
        <textarea
          value={description}
          maxLength={512}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={descPlaceholder}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-bg-color dark:bg-white/10 text-text-main text-[15px] placeholder:text-text-sub/60 outline-none focus:ring-2 focus:ring-primary-blue/40 transition-shadow resize-none"
        />
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="mt-auto py-3.5 rounded-full bg-primary-blue text-white text-[16px] font-medium active:opacity-80 transition-opacity disabled:opacity-50"
      >
        {saving ? savingLabel : saveLabel}
      </button>
    </div>
  );
};
