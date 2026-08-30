/**
 * My voice library i18n resources.
 *
 * Authored locale fragments live under `en-US/voice/myVoices/*` and
 * `zh-CN/voice/myVoices/*`; this thin registry aggregates them. Keys are
 * registered under the `my_voices` namespace. Hosts register these resources
 * into their i18next instance; pages also carry inline fallbacks so they
 * render correctly before registration.
 */

import overviewEn from './en-US/voice/myVoices/overview.json';
import recordEn from './en-US/voice/myVoices/record.json';
import detailsEn from './en-US/voice/myVoices/details.json';
import labelsEn from './en-US/voice/myVoices/labels.json';
import errorsEn from './en-US/voice/myVoices/errors.json';
import overviewZh from './zh-CN/voice/myVoices/overview.json';
import recordZh from './zh-CN/voice/myVoices/record.json';
import detailsZh from './zh-CN/voice/myVoices/details.json';
import labelsZh from './zh-CN/voice/myVoices/labels.json';
import errorsZh from './zh-CN/voice/myVoices/errors.json';

export const MY_VOICES_I18N_NAMESPACE = 'my_voices';

export interface MyVoicesI18nResources {
  'zh-CN': Record<string, string>;
  'en-US': Record<string, string>;
}

export const myVoicesI18nResources: MyVoicesI18nResources = {
  'zh-CN': { ...overviewZh, ...recordZh, ...detailsZh, ...labelsZh, ...errorsZh },
  'en-US': { ...overviewEn, ...recordEn, ...detailsEn, ...labelsEn, ...errorsEn },
};

export function registerMyVoicesI18n(
  i18n: { addResourceBundle: (language: string, namespace: string, resources: unknown) => void },
): void {
  for (const [language, resources] of Object.entries(myVoicesI18nResources)) {
    i18n.addResourceBundle(language, MY_VOICES_I18N_NAMESPACE, resources);
  }
}