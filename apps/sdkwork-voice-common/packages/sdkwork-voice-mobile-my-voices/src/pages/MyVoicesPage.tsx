import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';

import { ActionSheet } from '../components/ui/ActionSheet';
import { PageHeader } from '../components/ui/PageHeader';
import { showConfirm, showToast } from '../components/ui/overlay';
import { VoiceProfileCard } from '../components/VoiceProfileCard';
import {
  deleteMyVoice,
  listMyVoices,
} from '../services/myVoiceService';
import type { MyVoiceListPage, MyVoiceProfile } from '../types/myVoice';

const PAGE_SIZE = 20;

export const MyVoicesPage: React.FC = () => {
  const { t } = useTranslation('my_voices');
  const navigate = useNavigate();

  const [voices, setVoices] = useState<MyVoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [actionSheetItem, setActionSheetItem] = useState<MyVoiceProfile | null>(null);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const page = await listMyVoices({ page: 1, pageSize: PAGE_SIZE });
      setVoices(page.items);
      setHasMore(page.hasMore);
      setNextPage(2);
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const page: MyVoiceListPage = await listMyVoices({ page: nextPage, pageSize: PAGE_SIZE });
      setVoices((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      setNextPage((prev) => prev + 1);
    } catch {
      showToast(t('loadError'), 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextPage, t]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: '120px' },
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [loadMore]);

  const handlePlay = (id: string) => {
    setPlayingId((current) => (current === id ? null : id));
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLongPress = (voice: MyVoiceProfile) => {
    const handlePressStart = () => {
      setIsLongPressed(false);
      clearLongPress();
      longPressTimerRef.current = window.setTimeout(() => {
        setIsLongPressed(true);
        setActionSheetItem(voice);
      }, 500);
    };
    const handlePressEnd = () => {
      clearLongPress();
    };
    return {
      onPointerDown: handlePressStart,
      onPointerUp: handlePressEnd,
      onPointerLeave: () => {
        handlePressEnd();
        setIsLongPressed(false);
      },
      onContextMenu: (event: React.MouseEvent) => {
        event.preventDefault();
        handlePressStart();
        setIsLongPressed(true);
        setActionSheetItem(voice);
        handlePressEnd();
      },
    };
  };

  const handleDelete = async (voice: MyVoiceProfile) => {
    const confirmed = await showConfirm({
      title: t('deleteConfirmTitle'),
      message: t('deleteConfirmMessage', { name: voice.name }),
    });
    if (!confirmed) {
      return;
    }
    try {
      await deleteMyVoice(voice.id);
      setVoices((prev) => prev.filter((item) => item.id !== voice.id));
      showToast(t('deleted'));
    } catch {
      showToast(t('deleteError'), 'error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-color relative">
      <PageHeader
        title={t('title')}
        onBack={() => navigate(-1)}
        right={
          <button
            type="button"
            aria-label={t('create')}
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-chat-active-bg transition-colors"
            onClick={() => navigate('/me/voices/create')}
          >
            <Plus className="w-5 h-5 text-text-main" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-8 mt-2 w-full">
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#1A1A1A] px-4 py-3.5 border-b border-border-color flex items-center gap-3 animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-4 w-1/2 rounded bg-black/5 dark:bg-white/10" />
                  <div className="h-3 w-2/3 rounded bg-black/5 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <p className="text-[14px] text-text-sub">{t('loadError')}</p>
            <button
              type="button"
              className="px-5 py-2 rounded-full bg-primary-blue text-white text-[14px] font-medium active:opacity-80"
              onClick={() => void loadFirstPage()}
            >
              {t('loadErrorRetry')}
            </button>
          </div>
        ) : voices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-blue/10 flex items-center justify-center mb-1">
              <Plus className="w-7 h-7 text-primary-blue" />
            </div>
            <p className="text-[16px] font-medium text-text-main">{t('empty')}</p>
            <p className="text-[13px] text-text-sub leading-relaxed">{t('emptyHint')}</p>
            <button
              type="button"
              className="mt-3 px-6 py-2.5 rounded-full bg-primary-blue text-white text-[15px] font-medium active:opacity-80"
              onClick={() => navigate('/me/voices/create')}
            >
              {t('create')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col border-y border-border-color">
              {voices.map((voice) => (
                <VoiceProfileCard
                  key={voice.id}
                  profile={voice}
                  isPlaying={playingId === voice.id}
                  onClick={() => {
                    if (isLongPressed) {
                      setIsLongPressed(false);
                      return;
                    }
                    navigate(`/me/voices/${voice.id}`);
                  }}
                  onPlayClick={(event) => {
                    event.stopPropagation();
                    handlePlay(voice.id);
                  }}
                  onLongPressProps={startLongPress(voice)}
                />
              ))}
            </div>
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {loadingMore ? (
                <span className="text-[13px] text-text-sub">{t('loading')}</span>
              ) : hasMore ? (
                <button
                  type="button"
                  className="text-[13px] text-primary-blue font-medium"
                  onClick={() => void loadMore()}
                >
                  {t('loadMore')}
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>

      {actionSheetItem && (
        <ActionSheet
          isOpen
          title={`${actionSheetItem.name} · ${t('subtitle')}`}
          options={[
            {
              label: t('rename'),
              onClick: () => navigate(`/me/voices/create?id=${actionSheetItem.id}`),
            },
            {
              label: t('delete'),
              danger: true,
              onClick: () => void handleDelete(actionSheetItem),
            },
          ]}
          onClose={() => setActionSheetItem(null)}
        />
      )}
    </div>
  );
};
