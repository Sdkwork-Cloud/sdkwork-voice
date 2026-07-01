import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  SDKWORK_IM_PC_LANGUAGE_CHANGED_EVENT,
  resolvePersistedLanguage,
} from '@sdkwork/im-pc-commons';
import zhCN from './locales/zh-CN/voice.json';
import enUS from './locales/en-US/voice.json';

const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

function normalizeLanguage(value: unknown): SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage) ? value as SupportedLanguage : 'zh-CN';
}

function resolveInitialLanguage(): SupportedLanguage {
  return resolvePersistedLanguage(SUPPORTED_LANGUAGES, 'zh-CN');
}

const i18n = createInstance();
i18n.use(initReactI18next).init({
  resources: { 'zh-CN': { voice: zhCN }, 'en-US': { voice: enUS } },
  lng: resolveInitialLanguage(),
  fallbackLng: 'zh-CN',
  ns: ['voice'],
  defaultNS: 'voice',
  interpolation: { escapeValue: false },
});

if (typeof window !== 'undefined') {
  window.addEventListener(SDKWORK_IM_PC_LANGUAGE_CHANGED_EVENT, (event) => {
    const next = normalizeLanguage((event as CustomEvent<{ lang?: string }>).detail?.lang);
    if (i18n.language !== next) void i18n.changeLanguage(next);
  });
}

export default i18n;
