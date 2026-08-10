/**
 * My voice library i18n resources.
 *
 * Keys are registered under the `my_voices` namespace. Hosts register these
 * resources into their i18next instance; pages also carry inline fallbacks so
 * they render correctly before registration.
 */

import enUS from './en-US.json';
import zhCN from './zh-CN.json';

export const MY_VOICES_I18N_NAMESPACE = 'my_voices';

export interface MyVoicesI18nResources {
  'zh-CN': Record<string, string>;
  'en-US': Record<string, string>;
}

export const myVoicesI18nResources: MyVoicesI18nResources = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export function registerMyVoicesI18n(
  i18n: { addResourceBundle: (language: string, namespace: string, resources: unknown) => void },
): void {
  for (const [language, resources] of Object.entries(myVoicesI18nResources)) {
    i18n.addResourceBundle(language, MY_VOICES_I18N_NAMESPACE, resources);
  }
}
