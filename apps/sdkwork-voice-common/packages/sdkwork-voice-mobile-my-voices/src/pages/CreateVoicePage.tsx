import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { cn } from '../utils/cn';
import { PageHeader } from '../components/ui/PageHeader';
import { showToast } from '../components/ui/overlay';
import { CreateVoiceRecordStep } from '../components/voice/CreateVoiceRecordStep';
import { CreateVoiceUploadStep } from '../components/voice/CreateVoiceUploadStep';
import { CreateVoicePreviewStep } from '../components/voice/CreateVoicePreviewStep';
import { CreateVoiceProcessingStep } from '../components/voice/CreateVoiceProcessingStep';
import { CreateVoiceDetailsStep } from '../components/voice/CreateVoiceDetailsStep';
import { createMyVoice, uploadMyVoiceSample } from '../services/myVoiceService';
import { formatVoiceDuration, type MyVoiceMediaSample } from '../types/myVoice';

type Step = 'input' | 'preview' | 'processing' | 'details' | 'done';

export const CreateVoicePage: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { t } = useTranslation('my_voices');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  const [step, setStep] = useState<Step>('input');
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingSample, setPendingSample] = useState<MyVoiceMediaSample | null>(null);
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const goBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const stopMedia = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopMedia();
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [stopMedia, blobUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        setBlob(audioBlob);
        setBlobUrl(URL.createObjectURL(audioBlob));
        setStep('preview');
      };
      recorder.start();
      setRecording(true);
      setTimer(0);
      timerRef.current = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch {
      showToast(t('recordError'), 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const handleFileSelected = (file: File) => {
    setUploading(true);
    window.setTimeout(() => {
      setUploading(false);
      setBlob(file);
      setBlobUrl(URL.createObjectURL(file));
      setStep('preview');
    }, 400);
  };

  const retake = () => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    setBlob(null);
    setBlobUrl(null);
    setStep('input');
  };

  const confirmPreview = () => {
    setStep('processing');
    void (async () => {
      try {
        if (!blob) {
          throw new Error('no audio blob');
        }
        const sample = await uploadMyVoiceSample(blob, {
          fileName: blob instanceof File ? blob.name : 'recording.webm',
          mimeType: blob.type || undefined,
          durationSeconds: timer > 0 ? timer : undefined,
        });
        setPendingSample(sample);
        setStep('details');
      } catch {
        showToast(t('uploadError'), 'error');
        setStep('input');
      }
    })();
  };

  const saveVoice = async (name: string, description: string) => {
    setSaving(true);
    try {
      await createMyVoice({
        name,
        description: description || undefined,
        kind: 'cloned',
        sampleMedia: pendingSample ?? { source: 'none' },
        durationSeconds: timer > 0 ? timer : undefined,
      });
      setStep('done');
      showToast(t('created'));
      window.setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          navigate('/me/voices', { replace: true });
        }
      }, 600);
    } catch {
      showToast(t('createError'), 'error');
      setSaving(false);
    }
  };

  const formatTime = (seconds: number) => formatVoiceDuration(seconds);

  return (
    <div className="flex flex-col h-full bg-bg-color relative">
      <PageHeader title={t('createTitle')} onBack={goBack} />

      {step === 'input' && (
        <div className="px-4 py-3 shrink-0 flex items-center justify-center gap-6">
          <button
            type="button"
            className={cn(
              'text-[16px] font-medium transition-colors',
              activeTab === 'record' ? 'text-primary-blue text-[17px]' : 'text-text-sub',
            )}
            onClick={() => setActiveTab('record')}
          >
            {t('recordTab')}
          </button>
          <button
            type="button"
            className={cn(
              'text-[16px] font-medium transition-colors',
              activeTab === 'upload' ? 'text-primary-blue text-[17px]' : 'text-text-sub',
            )}
            onClick={() => setActiveTab('upload')}
          >
            {t('uploadTab')}
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col p-6 pb-safe overflow-hidden relative">
        {step === 'input' && activeTab === 'record' && (
          <CreateVoiceRecordStep
            recordingState={recording ? 'recording' : 'idle'}
            timer={timer}
            formatTime={formatTime}
            onStart={() => void startRecording()}
            onStop={stopRecording}
            onRetake={retake}
            hint={t('recordHint')}
            startLabel={t('recordStart')}
            stopLabel={t('recordStop')}
            retakeLabel={t('recordRetake')}
          />
        )}
        {step === 'input' && activeTab === 'upload' && (
          <CreateVoiceUploadStep
            hint={t('uploadHint')}
            selectLabel={t('uploadSelect')}
            uploadingLabel={t('uploading')}
            uploading={uploading}
            onFileSelected={handleFileSelected}
          />
        )}
        {step === 'preview' && (
          <CreateVoicePreviewStep
            blobUrl={blobUrl}
            quote={t('previewTitle')}
            confirmLabel={t('previewConfirm')}
            retakeLabel={t('previewRetake')}
            onConfirm={confirmPreview}
            onRetake={retake}
          />
        )}
        {step === 'processing' && (
          <CreateVoiceProcessingStep hint={t('processingHint')} />
        )}
        {step === 'details' && (
          <CreateVoiceDetailsStep
            nameLabel={t('detailsName')}
            namePlaceholder={t('detailsNamePlaceholder')}
            descLabel={t('detailsDesc')}
            descPlaceholder={t('detailsDescPlaceholder')}
            saveLabel={t('detailsSave')}
            savingLabel={t('saving')}
            nameRequiredMessage={t('nameRequired')}
            saving={saving}
            onSave={(name, description) => void saveVoice(name, description)}
          />
        )}
        {step === 'done' && <CreateVoiceProcessingStep hint={t('created')} />}
      </div>
    </div>
  );
};
