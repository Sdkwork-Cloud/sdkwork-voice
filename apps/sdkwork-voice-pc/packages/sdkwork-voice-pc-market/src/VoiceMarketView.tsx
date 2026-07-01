import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, Speaker, Headphones, User, Music, Search, Globe, Compass, Play, Plus, X, UploadCloud, CheckCircle, ChevronRight, AlertCircle, FileAudio, ShieldCheck } from 'lucide-react';
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

export const VoiceMarketView: React.FC<VoiceMarketViewProps> = ({ onSelectVoice, onCreateVoice }) => {
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

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
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
            name: cloneName || '自定义声音',
            description: cloneDesc || '新克隆的声音模型',
            categoryId: 'custom',
            iconName: 'User',
            color: 'bg-indigo-500',
            author: '我',
            users: '1'
          }
        ]);
        if (onCreateVoice) onCreateVoice();
      }, 2000);
    }, 3000);
  };

  const categories = [
    { id: 'all', name: '全部声音' },
    { id: 'reading', name: '有声阅读' },
    { id: 'news', name: '新闻播报' },
    { id: 'anime', name: '二次元动漫' },
    { id: 'business', name: '商业客服' },
    { id: 'custom', name: '声音克隆' }
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
    author: config.author || '我',
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
          <div className="px-4 py-2 text-xs text-gray-500 font-medium tracking-wide">发现</div>
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
            <span className={cn("text-[14px]", activeCategory === 'market' ? 'font-semibold text-purple-400' : 'text-gray-300 font-medium')}>发现好声音</span>
          </div>

          <div className="px-4 py-2 mt-6 text-xs text-gray-500 font-medium tracking-wide">我的声音库</div>
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">加载中...</div>
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
                <h2 className="text-2xl font-bold text-gray-100 mb-2">发音人声音市场</h2>
                <p className="text-gray-500 text-sm">海量高品质声音模型，让你的文本焕发声机。</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                  <input 
                    type="text" 
                    placeholder="搜索声音类型、名称..." 
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
                  克隆我的声音
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
              <div className="text-gray-500 text-sm col-span-full py-20 text-center">正在加载声音数据...</div>
            ) : loadError ? (
              <div className="text-gray-400 text-sm col-span-full py-20 text-center">{loadError}</div>
            ) : filteredMarketVoices.length === 0 ? (
              <div className="text-gray-500 text-sm col-span-full py-20 text-center">未找到符合条件的声音</div>
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
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e1e] hover:bg-purple-500 hover:text-white text-gray-300 text-xs font-semibold transition-all opacity-0 group-hover:opacity-100 border border-white/5 shadow-sm">
                      <Play size={14} /> 试听
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
                克隆声音
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
                    <h4 className="text-2xl font-bold text-gray-100 mb-2">配置声音模型</h4>
                    <p className="text-gray-400 text-sm">为你的专属语音模型设置基础信息。这些信息有助于后续在声音库中快速找到它。</p>
                  </div>
                  
                  <div className="flex flex-col gap-6 flex-1">
                    <div className="flex flex-col gap-2.5">
                      <label className="text-sm font-semibold text-gray-300">声音名称<span className="text-red-400 ml-1">*</span></label>
                      <input 
                        type="text" 
                        placeholder="例如：我的专属AI助手" 
                        value={cloneName}
                        onChange={e => setCloneName(e.target.value)}
                        className="w-full bg-[#18181A] border border-white/10 rounded-xl px-4 py-3.5 text-base text-gray-200 outline-none focus:border-purple-500/80 transition-colors focus:ring-4 focus:ring-purple-500/10 placeholder:text-gray-600"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2.5 flex-1">
                      <label className="text-sm font-semibold text-gray-300">声音描述 <span className="text-gray-600 font-normal ml-1">(可选)</span></label>
                      <textarea 
                        placeholder="描述一下这个声音的特质，例如：温柔、稳重、专业..." 
                        value={cloneDesc}
                        onChange={e => setCloneDesc(e.target.value)}
                        className="w-full h-28 resize-none bg-[#18181A] border border-white/10 rounded-xl px-4 py-3.5 text-base text-gray-200 outline-none focus:border-purple-500/80 transition-colors focus:ring-4 focus:ring-purple-500/10 placeholder:text-gray-600"
                      />
                    </div>

                    <div className="mt-auto bg-purple-500/5 hover:bg-purple-500/10 transition-colors border border-purple-500/20 rounded-xl p-5 flex gap-4 items-start cursor-pointer group" onClick={() => setConsentChecked(!consentChecked)}>
                      <ShieldCheck className={cn("shrink-0 mt-0.5 transition-colors", consentChecked ? "text-purple-400" : "text-gray-500 group-hover:text-purple-400/50")} size={22} />
                      <div className="flex flex-col gap-2 flex-1">
                        <h5 className="text-sm font-bold text-gray-200">法律与授权承诺</h5>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          本人确认将使用本人的真实声音进行克隆，或已获得声音所有者的明确合法授权。平台严禁将此功能用于造假、欺诈等非法用途。上传非本人授权声音将导致账号封禁。
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <input 
                            type="checkbox" 
                            checked={consentChecked}
                            onChange={(e) => setConsentChecked(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900 bg-gray-700 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className={cn("text-sm font-semibold select-none transition-colors", consentChecked ? "text-purple-400" : "text-gray-500 group-hover:text-gray-400")}>我已阅读并完全同意上述条款</span>
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
                    <h4 className="text-2xl font-bold text-gray-100 mb-2">选择音频输入方式</h4>
                    <p className="text-gray-400 text-sm">提供高质量的音频样本是生成逼真声音克隆的关键。</p>
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
                      <h5 className="text-xl font-bold text-gray-200 mb-3 z-10">在线实时录音</h5>
                      <p className="text-sm text-center text-gray-500 leading-relaxed z-10">提供定制标准朗读文本<br/>推荐在安静、无回音的环境中进行</p>
                    </div>

                    <div 
                      onClick={() => setCloneStep('upload')}
                      className="h-full max-h-[320px] bg-[#1c1c1e] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[#1f1f22] hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:scale-110 transition-all text-blue-400 group-hover:text-white shadow-inner z-10">
                        <FileAudio size={36} />
                      </div>
                      <h5 className="text-xl font-bold text-gray-200 mb-3 z-10">上传音频文件</h5>
                      <p className="text-sm text-center text-gray-500 leading-relaxed z-10">已录制好的高质量干音文件<br/>支持 MP3, WAV 格式 (1-5分钟)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3a: Record */}
              {cloneStep === 'record' && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-2xl font-bold text-gray-100 mb-1">开始在线录制</h4>
                      <p className="text-sm text-gray-400 flex items-center gap-1.5"><AlertCircle size={14}/> 请以自然、平稳的语调朗读以下文本：</p>
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
                         春天来了，万物复苏。在这个美丽的季节里，大自然展现出它最迷人的生机。我们可以听到鸟儿在枝头欢快地歌唱，看到花朵在微风中摇曳生姿。技术的进步让我们能够保存这些美好的瞬间，甚至将我们的声音化作数字的记忆，永远流传。请用心感受这段文字带给你的温暖，用你最真实的声音读出它的韵味。
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
                          不满意，重新录制
                        </button>
                        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 px-8 py-3 rounded-full font-bold shadow-sm">
                          <CheckCircle size={20} /> 录制完成，质量达标
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
                          {isRecording ? "点击结束录制" : "点击开始录制"}
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
                    <h4 className="text-2xl font-bold text-gray-100 mb-1">上传音频文件</h4>
                    <p className="text-sm text-gray-400">为了获得最佳克隆效果，请上传无背景音、高质量的人声干音音频。</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-white/20 hover:border-purple-500/80 rounded-2xl flex-1 flex flex-col items-center justify-center bg-[#151516] transition-colors group cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {!audioReady ? (
                      <>
                        <div className="w-24 h-24 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-xl group-hover:shadow-purple-500/20 z-10">
                          <UploadCloud size={40} className="group-hover:-translate-y-1.5 transition-transform duration-300" />
                        </div>
                        <h5 className="text-xl font-bold text-gray-200 mb-2 z-10">点击或拖拽文件到这里上传</h5>
                        <p className="text-sm text-gray-500 text-center leading-relaxed z-10">
                          支持的格式: MP3, WAV, M4A, FLAC<br/>
                          建议时长: 1~5分钟 | 最大文件: 50MB
                        </p>
                        
                        {/* Mock hidden file input */}
                        <input type="file" className="hidden" accept="audio/*" onChange={() => setAudioReady(true)} id="audio-upload" />
                        <label htmlFor="audio-upload" className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors cursor-pointer border border-white/5 shadow-sm inline-block z-10">
                          浏览文件
                        </label>
                      </>
                    ) : (
                      <div className="flex flex-col items-center z-10 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/10">
                          <FileAudio size={36} />
                        </div>
                        <h5 className="text-xl font-bold text-gray-100 mb-2">音频已就绪</h5>
                        <p className="text-sm text-gray-400 mb-8">my_voice_sample_high_quality.wav</p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setAudioReady(false); }}
                          className="text-sm text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4"
                        >
                          重新上传
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
                  <h4 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4 tracking-wide">正在训练专属模型...</h4>
                  <p className="text-gray-400 text-base max-w-md text-center leading-relaxed font-medium">
                    深度学习算法正在分析您的声音特征，构建高精度声纹参数。请耐心等待，这通常需要大约 1-2 分钟。
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
                  <h4 className="text-3xl font-extrabold text-white mb-3">克隆成功！</h4>
                  <p className="text-gray-400 text-lg">你的专属声音 <span className="text-white font-bold px-2 py-1 bg-white/10 rounded-md mx-1">{cloneName || '自定义声音'}</span> 已就绪</p>
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
                    返回上一步
                  </button>
                ) : (
                  <div/>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={handleCloseClone}
                    className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    取消
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
                    {(cloneStep === 'info') ? '下一步' : '开始克隆'}
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
