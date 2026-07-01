import {

  isVoiceMarketPilotEnabled,

  voiceMarketUnavailableMessage,

} from './voicePilot';

import {

  ensureVoiceMarketAccessMode,

  listMarketVoicesFromSdk,

  listMyVoicesFromSdk,

} from './voiceMarketSdk';



export interface VoiceConfig {

  id: string;

  name: string;

  description: string;

  categoryId: string;

  iconName?: string;

  color?: string;

  author?: string;

  users?: string;

  audioPreview?: string;

}



const PILOT_MARKET_VOICES: VoiceConfig[] = [

  {

    id: 'voice-1',

    name: '甜美女生-小悠',

    description: '适合有声书、电台、温馨风格阅读。',

    categoryId: 'reading',

    iconName: 'Mic',

    color: 'bg-pink-500',

    author: 'Sdkwork Voice',

    users: '12K',

  },

  {

    id: 'voice-2',

    name: '沉稳男声-老赵',

    description: '适合新闻播报、商业解说或历史纪实。',

    categoryId: 'news',

    iconName: 'Radio',

    color: 'bg-indigo-500',

    author: 'Official',

    users: '8.5K',

  },

  {

    id: 'voice-3',

    name: '活泼元气-夏夏',

    description: '极具感染力的声音，适合动漫、游戏解说。',

    categoryId: 'anime',

    iconName: 'Speaker',

    color: 'bg-orange-500',

    author: '社区精选',

    users: '5.2K',

  },

  {

    id: 'voice-4',

    name: '专业客服-小丽',

    description: '标准、亲切，适合智能客服或企业导览。',

    categoryId: 'business',

    iconName: 'Headphones',

    color: 'bg-blue-500',

    author: '企业级',

    users: '15K',

  },

];



const PILOT_MY_VOICES: VoiceConfig[] = [

  {

    id: 'voice-my-1',

    name: '自定义克隆声',

    description: '基于我上传的 5 分钟音频样本训练的声音。',

    categoryId: 'custom',

    iconName: 'User',

    color: 'bg-purple-500',

    author: '我',

    users: '1',

  },

];



class VoiceMarketService {

  private resolveAccessMode(): 'pilot' | 'sdk' {

    return ensureVoiceMarketAccessMode();

  }



  async getMarketVoices(searchQuery?: string): Promise<VoiceConfig[]> {

    const mode = this.resolveAccessMode();

    if (mode === 'pilot') {

      const query = searchQuery?.trim().toLowerCase();

      if (!query) {

        return PILOT_MARKET_VOICES;

      }

      return PILOT_MARKET_VOICES.filter((voice) =>

        voice.name.toLowerCase().includes(query)

        || voice.description.toLowerCase().includes(query),

      );

    }

    return listMarketVoicesFromSdk(searchQuery);

  }



  async getMyVoices(): Promise<VoiceConfig[]> {

    const mode = this.resolveAccessMode();

    if (mode === 'pilot') {

      return PILOT_MY_VOICES;

    }

    return listMyVoicesFromSdk();

  }

}



export const voiceMarketService = new VoiceMarketService();

export {

  isVoiceMarketPilotEnabled,

  voiceMarketPilotBannerMessage,

  voiceMarketUnavailableMessage,

} from './voicePilot';


