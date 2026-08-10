import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { Pencil, Settings2 } from 'lucide-react';

import { AudioPreviewPlayer } from '../components/AudioPreviewPlayer';
import { IconButton, PageHeader } from '../components/ui/PageHeader';
import { showConfirm, showToast } from '../components/ui/overlay';
import {
  deleteMyVoice,
  retrieveMyVoice,
  updateMyVoice,
} from '../services/myVoiceService';
import { formatVoiceDuration, type MyVoiceProfile } from '../types/myVoice';

export const MyVoiceDetailPage: React.FC = () => {
  const { t } = useTranslation('my_voices');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [voice, setVoice] = useState<MyVoiceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    setLoading(true);
    retrieveMyVoice(id)
      .then((profile) => {
        setVoice(profile);
        setNameDraft(profile?.name ?? '');
      })
      .catch(() => {
        showToast(t('loadError'), 'error');
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleRename = useCallback(async () => {
    const name = nameDraft.trim();
    if (!name) {
      showToast(t('nameRequired'), 'error');
      return;
    }
    if (!voice) {
      return;
    }
    setSavingRename(true);
    try {
      const updated = await updateMyVoice(voice.id, { name });
      setVoice(updated);
      setEditing(false);
      showToast(t('updated'));
    } catch {
      showToast(t('renameError'), 'error');
    } finally {
      setSavingRename(false);
    }
  }, [nameDraft, voice, t]);

  const handleDelete = useCallback(async () => {
    if (!voice) {
      return;
    }
    const confirmed = await showConfirm({
      title: t('deleteConfirmTitle'),
      message: t('deleteConfirmMessage', { name: voice.name }),
    });
    if (!confirmed) {
      return;
    }
    try {
      await deleteMyVoice(voice.id);
      showToast(t('deleted'));
      navigate('/me/voices', { replace: true });
    } catch {
      showToast(t('deleteError'), 'error');
    }
  }, [voice, navigate, t]);

  const typeLabel =
    voice?.kind === 'preset'
      ? t('typePreset')
      : voice?.kind === 'uploaded'
        ? t('typeUploaded')
        : t('typeCloned');

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-bg-color">
        <PageHeader title={t('detailTitle')} onBack={() => navigate(-1)} />
        <div className="flex-1 px-6 py-8 animate-pulse">
          <div className="h-6 w-1/3 rounded bg-black/5 dark:bg-white/10 mb-2" />
          <div className="h-64 rounded-3xl bg-black/5 dark:bg-white/10" />
        </div>
      </div>
    );
  }

  if (!voice) {
    return (
      <div className="flex flex-col h-full bg-bg-color">
        <PageHeader title={t('detailTitle')} onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[14px] text-text-sub">{t('loadError')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-color">
      <PageHeader
        title={t('detailTitle')}
        onBack={() => navigate(-1)}
        right={
          <IconButton
            ariaLabel={t('rename')}
            icon={<Settings2 className="w-5 h-5 text-text-main" />}
            onClick={() => setEditing(true)}
          />
        }
      />

      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-8">
        <div className="w-full bg-white dark:bg-[#1A1A1A] p-6 border-b border-border-color">
          {editing ? (
            <div className="flex flex-col gap-3 mb-6">
              <input
                type="text"
                value={nameDraft}
                maxLength={128}
                onChange={(event) => setNameDraft(event.target.value)}
                placeholder={t('detailsNamePlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-color dark:bg-white/10 text-text-main text-[17px] font-semibold outline-none focus:ring-2 focus:ring-primary-blue/40"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 py-2.5 rounded-full bg-bg-color dark:bg-white/10 text-text-main text-[14px] font-medium active:opacity-80"
                  onClick={() => {
                    setEditing(false);
                    setNameDraft(voice.name);
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  disabled={savingRename}
                  className="flex-1 py-2.5 rounded-full bg-primary-blue text-white text-[14px] font-medium active:opacity-80 disabled:opacity-50"
                  onClick={() => void handleRename()}
                >
                  {savingRename ? t('saving') : t('confirm')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-[20px] font-bold text-text-main truncate">{voice.name}</h2>
                {voice.description ? (
                  <p className="text-[14px] text-text-sub mt-1">{voice.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label={t('rename')}
                className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 ml-3 active:scale-95 transition-transform"
                onClick={() => setEditing(true)}
              >
                <Pencil className="w-4 h-4 text-text-sub" />
              </button>
            </div>
          )}

          <AudioPreviewPlayer
            profile={voice}
            quote={t('previewQuote')}
            onPlaybackError={() => showToast(t('playbackError'), 'error')}
          />
        </div>

        <div className="w-full mt-2 bg-white dark:bg-[#1A1A1A] py-2">
          <div className="flex items-center px-4 py-4 border-b border-border-color last:border-0">
            <span className="text-[16px] text-text-main flex-1">{t('typeLabel')}</span>
            <span className="text-[15px] text-text-sub">{typeLabel}</span>
          </div>
          <div className="flex items-center px-4 py-4 border-b border-border-color last:border-0">
            <span className="text-[16px] text-text-main flex-1">{t('durationLabel')}</span>
            <span className="text-[15px] text-text-sub">
              {formatVoiceDuration(voice.durationSeconds)}
            </span>
          </div>
          <div className="flex items-center px-4 py-4 border-b border-border-color last:border-0">
            <span className="text-[16px] text-text-main flex-1">{t('createdAtLabel')}</span>
            <span className="text-[15px] text-text-sub">
              {voice.createdAt ? voice.createdAt.slice(0, 10) : '-'}
            </span>
          </div>
          <div className="flex items-center px-4 py-4 border-b border-border-color last:border-0">
            <span className="text-[16px] text-text-main flex-1">{t('usageLabel')}</span>
            <span className="text-[15px] text-text-sub">{t('usageValue')}</span>
          </div>
        </div>

        <div className="w-full mt-6 px-4 pb-8">
          <button
            type="button"
            className="w-full py-3.5 bg-white dark:bg-[#1A1A1A] border border-border-color text-red-500 rounded-full font-medium active:bg-chat-active-bg transition-colors"
            onClick={() => void handleDelete()}
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
};
