import React, { useEffect, useState } from 'react';
import { Mic } from 'lucide-react';
import { useTranslation, I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import {
  PC_VOICE_SPEECH_CONTRACT_UNAVAILABLE,
  voiceSpeechService,
} from './services/voiceSpeechService';
import { resolveDefaultSpeechModel, resolveDefaultSpeechVoiceId } from './services/voiceSpeechRuntime';

const VoiceSpeechViewComponent: React.FC = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [model, setModel] = useState(resolveDefaultSpeechModel());
  const [voice, setVoice] = useState(resolveDefaultSpeechVoiceId());
  const [voiceOptions, setVoiceOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadVoices = async () => {
      setLoadingVoices(true);
      try {
        const options = await voiceSpeechService.listVoiceOptions();
        if (cancelled) {
          return;
        }
        setVoiceOptions(options.map((option) => ({ id: option.id, name: option.name })));
        if (options.length > 0) {
          setVoice((current) => (
            options.some((option) => option.id === current) ? current : options[0].id
          ));
        }
      } catch (loadError) {
        if (!cancelled) {
          setVoiceOptions([]);
          setError(
            loadError instanceof Error ? loadError.message : t('voiceLoadFailed'),
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingVoices(false);
        }
      }
    };
    void loadVoices();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleGenerate = async () => {
    setError(null);
    setSuccess(null);
    setAudioUrl(null);
    setSubmitting(true);
    try {
      const result = await voiceSpeechService.generateAndWait({ text, model, voice });
      setSuccess(t('successWithTask', { taskId: result.taskId }));
      if (result.audioUrl) {
        setAudioUrl(result.audioUrl);
      } else {
        setError(t('audioPending'));
      }
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : PC_VOICE_SPEECH_CONTRACT_UNAVAILABLE,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#1e1e1e] min-w-0 p-6">
      <div className="bg-[#2b2b2d] p-8 rounded-2xl border border-white/5 flex flex-col max-w-lg w-full">
        <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 border border-green-500/20 self-center">
          <Mic className="text-green-400" size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-200 mb-2 text-center">{t('title')}</h2>
        <p className="text-gray-400 text-center text-sm leading-relaxed mb-6">
          {t('desc')}
        </p>

        <label className="text-sm text-gray-300 mb-2" htmlFor="voice-speech-text">{t('textLabel')}</label>
        <textarea
          id="voice-speech-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          className="w-full mb-4 rounded-xl bg-[#141414] border border-white/10 px-4 py-3 text-sm text-gray-200 outline-none focus:border-green-500"
          placeholder={t('textPlaceholder')}
        />

        <label className="text-sm text-gray-300 mb-2" htmlFor="voice-speech-model">{t('modelLabel')}</label>
        <input
          id="voice-speech-model"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          className="w-full mb-4 rounded-xl bg-[#141414] border border-white/10 px-4 py-2.5 text-sm text-gray-200 outline-none focus:border-green-500"
        />

        <label className="text-sm text-gray-300 mb-2" htmlFor="voice-speech-voice">{t('voiceLabel')}</label>
        <select
          id="voice-speech-voice"
          value={voice}
          onChange={(event) => setVoice(event.target.value)}
          disabled={loadingVoices}
          className="w-full mb-4 rounded-xl bg-[#141414] border border-white/10 px-4 py-2.5 text-sm text-gray-200 outline-none focus:border-green-500"
        >
          {voiceOptions.length === 0 ? (
            <option value={voice}>{voice}</option>
          ) : (
            voiceOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))
          )}
        </select>

        {error ? (
          <p className="text-red-400 text-center text-sm mb-4">{error}</p>
        ) : null}
        {success ? (
          <p className="text-green-400 text-center text-sm mb-4">{success}</p>
        ) : null}

        {audioUrl ? (
          <div className="mb-4 rounded-xl bg-[#141414] border border-white/10 p-4">
            <p className="text-xs text-gray-400 mb-2">{t('previewLabel')}</p>
            <audio controls src={audioUrl} className="w-full">
              <track kind="captions" />
            </audio>
          </div>
        ) : null}

        <button
          type="button"
          disabled={submitting || !text.trim()}
          onClick={() => void handleGenerate()}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors"
        >
          {submitting ? t('submitting') : t('button')}
        </button>
      </div>
    </div>
  );
};

export const VoiceSpeechView: React.FC = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <VoiceSpeechViewComponent />
    </I18nextProvider>
  );
};

/** @deprecated Use VoiceSpeechView */
export const VoiceGenView = VoiceSpeechView;
