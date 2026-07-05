import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, Speaker, Headphones, User, Music, Search, Globe, Compass, Play, Plus, X, UploadCloud, CheckCircle, ChevronRight, AlertCircle, FileAudio, ShieldCheck } from 'lucide-react';
import { useTranslation, I18nextProvider, Trans } from 'react-i18next';
import i18n from './i18n';
import { cn } from 'sdkwork-voice-pc-commons';
import { voiceMarketService, VoiceConfig, isVoiceMarketPilotEnabled, voiceMarketPilotBannerMessage, voiceMarketUnavailableMessage } from './services/voiceMarketService';

export interface Voice {
  id: string;
  name: string;
  desc: string;
  icon?: React.ReactNode;
  color?: string;
  author?: string;
  users?: string;
}

interface VoiceMarketViewProps {
  onSelectVoice?: (voice: Voice) => void;
  onCreateVoice?: () => void;
}

export const VoiceMarketViewComponent: React.FC<VoiceMarketViewProps> = ({ onSelectVoice, onCreateVoice }) => {
  const { t } = useTranslation('voice');
  const [activeCategory, setActiveCategory] = useState<string>('market');
  const [marketVoices, setMarketVoices] = useState<VoiceConfig[]>([]);
  const [myVoices, setMyVoices] = useState<VoiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const pilotEnabled = isVoiceMarketPilotEnabled();
  
  // Clone Voice State
  const [cloneStep, setCloneStep] = useState<'info' | 'method' | 'record' | 'upload' | 'training' | 'success'>('info');
  const [cloneName, setCloneName] = useState('');
  const [cloneDesc, setCloneDesc] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const timerRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      previewAudioRef.current?.pause();
    };
  }, []);

  const handleStartClone = () => {
    if (!pilotEnabled) {
      return;
    }
    setIsCloneModalOpen(true);
    setCloneStep('info');
    setCloneName('');
    setCloneDesc('');
    setConsentChecked(false);
    setAudioReady(false);
    setRecordTime(0);
  };

  const handleCloseClone = () => {
    if (cloneStep === 'training') return;
    setIsCloneModalOpen(false);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordTime(0);
    setAudioReady(false);
    timerRef.current = window.setInterval(() => {
      setRecordTime(prev => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }
    setAudioReady(true);
  };

  const handleRerecord = () => {
    setAudioReady(false);
    setRecordTime(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePreviewVoice = (event: React.MouseEvent, config: VoiceConfig) => {
    event.stopPropagation();
    if (!config.audioPreview) {
      return;
    }
    previewAudioRef.current?.pause();
    const audio = new Audio(config.audioPreview);
    previewAudioRef.current = audio;
    void audio.play().catch(() => undefined);
  };

  const submitTraining = () => {
    setCloneStep('training');
    setTimeout(() => {
      setCloneStep('success');
      setTimeout(() => {
        setIsCloneModalOpen(false);
        // Mock add to my voices
        setMyVoices(prev => [
          ...prev, 
          {
            id: `voice-my-${Date.now()}`,
            name: cloneName || t('default.customVoice'),
            description: cloneDesc || t('default.newCloneDesc'),
            categoryId: 'custom',
            iconName: 'User',
            color: 'bg-indigo-500',
            author: t('default.me'),
            users: '1'
          }
        ]);
        if (onCreateVoice) onCreateVoice();
      }, 2000);
    }, 3000);
  };

  const categories = [
    { id: 'all', name: t('market.allVoices') },
    { id: 'reading', name: t('market.reading') },
    { id: 'news', name: t('market.news') },
    { id: 'anime', name: t('market.anime') },
    { id: 'business', name: t('market.business') },
    { id: 'custom', name: t('market.custom') },
  ];
  const [selectedMarketCategory, setSelectedMarketCategory] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [market, my] = await Promise.all([
          voiceMarketService.getMarketVoices(),
          voiceMarketService.getMyVoices()
        ]);
        setMarketVoices(market);
        setMyVoices(my);
      } catch (error) {
        setMarketVoices([]);
        setMyVoices([]);
        setLoadError(error instanceof Error ? error.message : voiceMarketUnavailableMessage());
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [pilotEnabled]);

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Mic': return <Mic size={24} />;
      case 'Radio': return <Radio size={24} />;
      case 'Speaker': return <Speaker size={24} />;
      case 'Headphones': return <Headphones size={24} />;
      case 'User': return <User size={24} />;
      default: return <Music size={24} />;
    }
  };

  const mapToVoice = (config: VoiceConfig): Voice => ({
    id: config.id || '',
    name: config.name,
    desc: config.description,
    icon: getIcon(config.iconName),
    color: config.color || 'bg-purple-500',
    author: config.author || t('default.me'),
    users: config.users || '0',
  });

  const filteredMarketVoices = marketVoices.filter(v => {
    const matchesSearch = !searchQuery.trim() || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || (v.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedMarketCategory === 'all' || v.categoryId === selectedMarketCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-1 min-h-0 h-full">
      {/* Left Category List */}
      <div className="flex w-[280px] shrink-0 flex-col bg-[#202020] border-r border-white/5 min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          <div className="px-4 py-2 text-xs text-gray-500 font-medium tracking-wide">{t('sidebar.discover')}</div>
          <div 
            onClick={() => setActiveCategory('market')}
            className={cn(
              "flex items-center px-4 py-3 cursor-pointer transition-all hover:bg-white/5",
              activeCategory === 'market' && "bg-purple-600/10 border-l-2 border-purple-500 text-purple-400"
            )}
          >
            <div className={cn("w-[28px] h-[28px] flex items-center justify-center shrink-0 mr-3", activeCategory === 'market' ? 'text-purple-500' : 'text-gray-400')}>
              <Compass size={18} />
            </div>
            <span className={cn("text-[14px]", activeCategory === 'market' ? 'font-semibold text-purple-400' : 'text-gray-300 font-medium')}>{t('sidebar.discoverVoices')}</span>
          </div>

          <div className="px-4 py-2 mt-6 text-xs text-gray-500 font-medium tracking-wide">{t('sidebar.myVoices')}</div>
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">{t('sidebar.loading')}</div>
          ) : myVoices.map(config => {
            const voice = mapToVoice(config);
            return (
              <div 
                key={voice.id}
                onClick={() => onSelectVoice?.(voice)}
                className="flex items-center px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 group"
              >
                <div className={cn("w-[28px] h-[28px] rounded-lg flex items-center justify-center text-white shrink-0 mr-3 shadow-md shadow-black/20 group-hover:scale-105 transition-transform", voice.color)}>
                  {React.isValidElement(voice.icon) ? React.cloneElement(voice.icon as React.ReactElement<any>, { size: 14 }) : voice.icon}
                </div>
                <span className="text-[14px] text-gray-300 font-medium truncate group-hover:text-white transition-colors">{voice.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0 p-6 lg:p-8 overflow-y-auto custom-scrollbar">
        <div className="w-full h-full flex flex-col">
          {pilotEnabled ? (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {voiceMarketPilotBannerMessage()}
            </div>
          ) : null}
          {loadError ? (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {loadError}
            </div>
          ) : null}
          <div className="flex flex-col gap-6 mb-8 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-100 mb-2">{t('market.title')}</h2>
                <p className="text-gray-500 text-sm">{t('market.desc')}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                  <input 
                    type="text" 
                    placeholder={t('market.searchPlaceholder')} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-72 bg-[#141414] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 outline-none focus:border-purple-500 focus:bg-[#181818] transition-all shadow-inner"
                  />
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                </div>
                <button 
                  onClick={handleStartClone}
                  disabled={!pilotEnabled}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors text-sm font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                >
                  <Plus size={18} />
                  {t('market.cloneMyVoice')}
                </button>
              </div>
            </div>
            
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedMarketCategory(cat.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border",
                    selectedMarketCategory === cat.id 
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/30" 
                      : "bg-[#252528] text-gray-400 border-white/5 hover:bg-white/5 hover:text-gray-200"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
            {loading ? (
              <div className="text-gray-500 text-sm col-span-full py-20 text-center">{t('market.loading')}</div>
            ) : loadError ? (
              <div className="text-gray-400 text-sm col-span-full py-20 text-center">{loadError}</div>
            ) : filteredMarketVoices.length === 0 ? (
              <div className="text-gray-500 text-sm col-span-full py-20 text-center">{t('market.noMatch')}</div>
            ) : filteredMarketVoices.map(config => {
              const voice = mapToVoice(config);
              return (
                <div 
                  key={voice.id} 
                  onClick={() => onSelectVoice?.(voice)}
                  className="bg-[#242426] rounded-2xl border border-white/5 p-6 hover:border-purple-500/40 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer flex flex-col group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-purple-500/10 transition-colors"></div>
                  
                  <div className="flex items-start justify-between mb-5 relative z-10">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ring-1 ring-white/10 group-hover:scale-105 transition-transform", voice.color)}>
                      {React.isValidElement(voice.icon) ? React.cloneElement(voice.icon as React.ReactElement<any>, { size: 28 }) : voice.icon}
                    </div>
                    <button
                      type="button"
                      disabled={!config.audioPreview}
                      onClick={(event) => handlePreviewVoice(event, config)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e1e] hover:bg-purple-500 hover:text-white text-gray-300 text-xs font-semibold transition-all border border-white/5 shadow-sm",
                        config.audioPreview ? "opacity-0 group-hover:opacity-100" : "opacity-30 cursor-not-allowed",
                      )}
                    >
                      <Play size={14} /> {t('market.preview')}
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-gray-100 mb-2 group-hover:text-purple-400 transition-colors tracking-wide relative z-10">{voice.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-3 mb-6 flex-1 leading-relaxed relative z-10">{voice.desc}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/5 mt-auto relative z-10">
                    <span className="flex items-center gap-1.5 font-medium"><User size={14}/> {voice.author}</span>
                    <span className="bg-[#181818] border border-white/5 px-2.5 py-1 rounded-md text-gray-400 tracking-wider font-mono">{voice.users} USERS</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

            {/* Clone Voice Modal */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-[#242426] to-[#1a1a1c] border border-white/10 rounded-2xl w-[720px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#1e1e1e]/50 relative">
              <h3 className="text-gray-100 font-bold text-lg flex items-center gap-2">
                <Mic size={20} className="text-purple-400" />
                {t('clone.title')}
              </h3>
              <button 
                onClick={handleCloseClone} 
                className="text-gray-500 hover:text-gray-200 transition-colors z-10 p-1 rounded-full hover:bg-white/10"
                disabled={cloneStep === 'training'}
              >
                <X size={20} />
              </button>

              {/* Progress Bar (Visual) */}
              {(cloneStep !== 'training' && cloneStep !== 'success') && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500 ease-in-out" style={{ width: cloneStep === 'info' ? '33%' : (cloneStep === 'method' ? '66%' : '100%') }} />
              )}
            </div>
            
            <div className="px-10 py-8 flex flex-col relative h-[600px]">
              {/* Step 1: Info & Consent */}
              {cloneStep === 'info' && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-8">
                    <h4 className="text-2xl font-bold text-gray-100 mb-2">{t('clone.stepInfoTitle')}</h4>
                    <p className="text-gray-400 text-sm">{t('clone.stepInfoDesc')}</p>
                  </div>
                  
                  <div className="flex flex-col gap-6 flex-1">
                    <div className="flex flex-col gap-2.5">
                      <label className="text-sm font-semibold text-gray-300">{t('clone.voiceName')}<span className="text-red-400 ml-1">*</span></label>
                      <input 
                        type="text" 
                        placeholder={t('clone.voiceNamePlaceholder')} 
                        value={cloneName}
                        onChange={e => setCloneName(e.target.value)}
                        className="w-full bg-[#18181A] border border-white/10 rounded-xl px-4 py-3.5 text-base text-gray-200 outline-none focus:border-purple-500/80 transition-colors focus:ring-4 focus:ring-purple-500/10 placeholder:text-gray-600"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2.5 flex-1">
                      <label className="text-sm font-semibold text-gray-300">{t('clone.voiceDesc')} <span className="text-gray-600 font-normal ml-1">({t('clone.optional')})</span></label>
                      <textarea 
                        placeholder={t('clone.voiceDescPlaceholder')} 
                        value={cloneDesc}
                        onChange={e => setCloneDesc(e.target.value)}
                        className="w-full h-28 resize-none bg-[#18181A] border border-white/10 rounded-xl px-4 py-3.5 text-base text-gray-200 outline-none focus:border-purple-500/80 transition-colors focus:ring-4 focus:ring-purple-500/10 placeholder:text-gray-600"
                      />
                    </div>

                    <div className="mt-auto bg-purple-500/5 hover:bg-purple-500/10 transition-colors border border-purple-500/20 rounded-xl p-5 flex gap-4 items-start cursor-pointer group" onClick={() => setConsentChecked(!consentChecked)}>
                      <ShieldCheck className={cn("shrink-0 mt-0.5 transition-colors", consentChecked ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400/50")} size={22} />
                      <div className="flex flex-col gap-2 flex-1">
                        <h5 className="text-sm font-bold text-gray-200">{t('clone.legalTitle')}</h5>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {t('clone.legalDesc')}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <input 
                            type="checkbox" 
                            checked={consentChecked}
                            onChange={(e) => setConsentChecked(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900 bg-gray-700 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className={cn("text-sm font-semibold select-none transition-colors", consentChecked ? "text-purple-400" : "text-gray-500 group-hover:text-gray-400")}>{t('clone.agree')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Method Select */}
              {cloneStep === 'method' && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-8">
                    <h4 className="text-2xl font-bold text-gray-100 mb-2">{t('clone.stepMethodTitle')}</h4>
                    <p className="text-gray-400 text-sm">{t('clone.stepMethodDesc')}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 flex-1 items-center">
                    <div 
                      onClick={() => setCloneStep('record')}
                      className="h-full max-h-[320px] bg-[#1c1c1e] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[#1f1f22] hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/10 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:scale-110 transition-all text-purple-400 group-hover:text-white shadow-inner z-10">
                        <Mic size={36} />
                      </div>
                      <h5 className="text-xl font-bold text-gray-200 mb-3 z-10">{t('clone.recordOnline')}</h5>
                      <p className="text-sm text-center text-gray-500 leading-relaxed z-10"><Trans ns="voice" i18nKey="clone.recordDesc" /></p>
                    </div>

                    <div 
                      onClick={() => setCloneStep('upload')}
                      className="h-full max-h-[320px] bg-[#1c1c1e] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[#1f1f22] hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:scale-110 transition-all text-blue-400 group-hover:text-white shadow-inner z-10">
                        <FileAudio size={36} />
                      </div>
                      <h5 className="text-xl font-bold text-gray-200 mb-3 z-10">{t('clone.uploadAudio')}</h5>
                      <p className="text-sm text-center text-gray-500 leading-relaxed z-10"><Trans ns="voice" i18nKey="clone.uploadDesc" /></p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3a: Record */}
              {cloneStep === 'record' && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-2xl font-bold text-gray-100 mb-1">{t('clone.stepRecordTitle')}</h4>
                      <p className="text-sm text-gray-400 flex items-center gap-1.5"><AlertCircle size={14}/> {t('clone.recordHint')}</p>
                    </div>
                    <div className={cn("px-4 py-1.5 rounded-full font-mono font-bold text-lg tracking-wider border", isRecording ? "text-red-400 border-red-500/30 bg-red-500/10 animate-pulse" : "text-gray-400 border-white/10 bg-white/5")}>
                      {formatTime(recordTime)}
                    </div>
                  </div>

                  <div className="bg-[#151516] rounded-2xl border border-white/5 p-8 mb-8 flex-1 shadow-inner relative overflow-hidden group">
                     {/* Text content */}
                     <div className="relative z-10 h-full flex flex-col justify-center">
                       <div className="text-xl text-gray-200 leading-[2.2] tracking-wide font-medium">
                         <span className="text-purple-500 font-serif text-3xl leading-none -ml-2 mr-1">"</span>
                         {t('readingText')}
                         <span className="text-purple-500 font-serif text-3xl leading-none ml-1">"</span>
                       </div>
                     </div>
                  </div>

                  <div className="flex items-center justify-center gap-8 mt-auto h-[80px]">
                    {audioReady ? (
                      <>
                        <button 
                          onClick={handleRerecord}
                          className="px-6 py-3 rounded-full border border-gray-600 text-gray-300 font-bold hover:bg-white/5 transition-colors shadow-sm"
                        >
                          {t('clone.rerecord')}
                        </button>
                        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 px-8 py-3 rounded-full font-bold shadow-sm">
                          <CheckCircle size={20} /> {t('clone.recordDone')}
                        </div>
                      </>
                    ) : (
                      <div className="relative group/recordBtn flex flex-col items-center">
                        {isRecording && (
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[40px] -z-10 pointer-events-none flex items-center justify-between opacity-50" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                             {Array.from({ length: 48 }).map((_, i) => (
                               <div 
                                 key={i} 
                                 className="w-1.5 bg-red-400 rounded-full mix-blend-screen"
                                 style={{ 
                                   height: `${Math.max(20, Math.random() * 100)}%`,
                                   animation: `pulse-height ${0.2 + Math.random() * 0.4}s ease-in-out infinite alternate`,
                                   animationDelay: `${i * 0.02}s`
                                 }}
                               />
                             ))}
                           </div>
                        )}
                        {!isRecording ? (
                          <button 
                            onClick={handleStartRecording}
                            className="w-20 h-20 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-purple-500/40 transition-all hover:scale-105 active:scale-95 focus:outline-none z-10"
                          >
                            <Mic size={32} />
                          </button>
                        ) : (
                          <button 
                            onClick={handleStopRecording}
                            className="w-20 h-20 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center text-red-500 shadow-2xl shadow-white/20 transition-all hover:scale-105 active:scale-95 focus:outline-none relative z-10"
                          >
                            <div className="absolute inset-0 border-[6px] border-red-500/30 rounded-full animate-ping" />
                            <div className="w-6 h-6 bg-red-500 rounded-sm" />
                          </button>
                        )}
                        <span className="text-sm font-medium text-gray-400 absolute top-full mt-3 whitespace-nowrap">
                          {isRecording ? t('clone.clickToStop') : t('clone.clickToRecord')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3b: Upload */}
              {cloneStep === 'upload' && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mb-6">
                    <h4 className="text-2xl font-bold text-gray-100 mb-1">{t('clone.stepUploadTitle')}</h4>
                    <p className="text-sm text-gray-400">{t('clone.uploadHint')}</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-white/20 hover:border-purple-500/80 rounded-2xl flex-1 flex flex-col items-center justify-center bg-[#151516] transition-colors group cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {!audioReady ? (
                      <>
                        <div className="w-24 h-24 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-xl group-hover:shadow-purple-500/20 z-10">
                          <UploadCloud size={40} className="group-hover:-translate-y-1.5 transition-transform duration-300" />
                        </div>
                        <h5 className="text-xl font-bold text-gray-200 mb-2 z-10">{t('clone.dropHere')}</h5>
                        <p className="text-sm text-gray-500 text-center leading-relaxed z-10">
                          <Trans ns="voice" i18nKey="clone.supportedFormats" />
                        </p>
                        
                        {/* Mock hidden file input */}
                        <input type="file" className="hidden" accept="audio/*" onChange={() => setAudioReady(true)} id="audio-upload" />
                        <label htmlFor="audio-upload" className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors cursor-pointer border border-white/5 shadow-sm inline-block z-10">
                          {t('clone.browseFiles')}
                        </label>
                      </>
                    ) : (
                      <div className="flex flex-col items-center z-10 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/10">
                          <FileAudio size={36} />
                        </div>
                        <h5 className="text-xl font-bold text-gray-100 mb-2">{t('clone.audioReady')}</h5>
                        <p className="text-sm text-gray-400 mb-8">my_voice_sample_high_quality.wav</p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setAudioReady(false); }}
                          className="text-sm text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4"
                        >
                          {t('clone.reupload')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Training */}
              {cloneStep === 'training' && (
                <div className="flex flex-col h-full items-center justify-center animate-in fade-in duration-500">
                  <div className="relative w-40 h-40 flex items-center justify-center mb-10">
                    <div className="absolute inset-0 border-[6px] border-purple-500/10 rounded-full"></div>
                    <div className="absolute inset-0 border-[6px] border-purple-500 border-t-transparent border-l-transparent rounded-full animate-spin [animation-duration:2s]"></div>
                    <div className="absolute inset-3 border-[6px] border-blue-500/10 rounded-full"></div>
                    <div className="absolute inset-3 border-[6px] border-blue-500 border-b-transparent border-r-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    <div className="absolute inset-6 border-[6px] border-teal-500/10 rounded-full"></div>
                    <div className="absolute inset-6 border-[6px] border-teal-500 border-l-transparent border-b-transparent rounded-full animate-spin [animation-duration:3s]"></div>
                    <Mic size={48} className="text-purple-400 animate-pulse relative z-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                  </div>
                  <h4 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4 tracking-wide">{t('clone.training')}</h4>
                  <p className="text-gray-400 text-base max-w-md text-center leading-relaxed font-medium">
                    {t('clone.trainingDesc')}
                  </p>
                </div>
              )}

              {/* Step 5: Success */}
              {cloneStep === 'success' && (
                <div className="flex flex-col h-full items-center justify-center animate-in zoom-in-95 duration-500">
                  <div className="w-32 h-32 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(34,197,94,0.3)] relative">
                    <div className="absolute inset-0 rounded-full border border-green-500/30 animate-ping [animation-duration:2s]"></div>
                    <CheckCircle size={56} className="animate-in zoom-in spin-in-12 duration-700" />
                  </div>
                  <h4 className="text-3xl font-extrabold text-white mb-3">{t('clone.success')}</h4>
                  <p className="text-gray-400 text-lg">{t('clone.successDesc', { name: cloneName || t('default.customVoice') })}</p>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            {(cloneStep !== 'training' && cloneStep !== 'success') && (
              <div className="px-8 py-5 bg-[#1a1a1c]/80 border-t border-white/5 flex items-center justify-between shrink-0 backdrop-blur-md">
                {cloneStep !== 'info' ? (
                  <button 
                    onClick={() => {
                      if (cloneStep === 'method') setCloneStep('info');
                      else setCloneStep('method');
                    }}
                    className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    {t('clone.back')}
                  </button>
                ) : (
                  <div/>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={handleCloseClone}
                    className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    {t('clone.cancel')}
                  </button>

                  <button 
                    onClick={() => {
                      if (cloneStep === 'info') setCloneStep('method');
                      else if (cloneStep === 'record' || cloneStep === 'upload') submitTraining();
                    }}
                    disabled={
                      (cloneStep === 'info' && (!cloneName.trim() || !consentChecked)) ||
                      (cloneStep === 'record' && !audioReady) ||
                      (cloneStep === 'upload' && !audioReady)
                    }
                    className="px-8 py-2.5 text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 active:scale-95 flex items-center gap-2"
                  >
                    {(cloneStep === 'info') ? t('clone.next') : t('clone.startClone')}
                    {(cloneStep === 'info') && <ChevronRight size={18} className="ml-1 -mr-1" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const VoiceMarketView: React.FC<VoiceMarketViewProps> = (props) => (
  <I18nextProvider i18n={i18n}>
    <VoiceMarketViewComponent {...props} />
  </I18nextProvider>
);
