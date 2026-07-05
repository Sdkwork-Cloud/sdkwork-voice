import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { tryGetVoicePcSdkPorts } from 'sdkwork-voice-pc-core';
import zhCN from './locales/zh-CN/voice.json';
import enUS from './locales/en-US/voice.json';

const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function normalizeLanguage(value: unknown): SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
    ? (value as SupportedLanguage)
    : 'zh-CN';
}

function resolveInitialLanguage(): SupportedLanguage {
  const ports = tryGetVoicePcSdkPorts();
  if (ports?.resolveHostLanguage) {
    return normalizeLanguage(ports.resolveHostLanguage());
  }
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('sdkwork-voice-pc-language');
    if (stored) {
      return normalizeLanguage(stored);
    }
  }
  return 'zh-CN';
}

const i18n = createInstance();
void i18n.use(initReactI18next).init({
  resources: { 'zh-CN': { voice: zhCN }, 'en-US': { voice: enUS } },
  lng: resolveInitialLanguage(),
  fallbackLng: 'zh-CN',
  ns: ['voice'],
  defaultNS: 'voice',
  interpolation: { escapeValue: false },
});

const ports = tryGetVoicePcSdkPorts();
if (ports?.subscribeHostLanguage) {
  ports.subscribeHostLanguage((language) => {
    const next = normalizeLanguage(language);
    if (i18n.language !== next) {
      void i18n.changeLanguage(next);
    }
  });
}

export default i18n;
