/**
 * @sdkwork/voice-mobile-my-voices public export boundary.
 *
 * Voice-owned H5 pages, services, and runtime ports for the "My Voice
 * Library" CRUD capability. Hosts inject SDK/media ports through
 * `configureMyVoiceSdkPorts` before rendering pages.
 */

export { MyVoicesPage } from './pages/MyVoicesPage';
export { CreateVoicePage } from './pages/CreateVoicePage';
export { MyVoiceDetailPage } from './pages/MyVoiceDetailPage';
export { AudioPreviewPlayer } from './components/AudioPreviewPlayer';
export { VoiceProfileCard } from './components/VoiceProfileCard';
export { ActionSheet } from './components/ui/ActionSheet';
export { showConfirm, showToast } from './components/ui/overlay';
export {
  MY_VOICES_I18N_NAMESPACE,
  myVoicesI18nResources,
  registerMyVoicesI18n,
} from './i18n';
export {
  createMyVoice,
  deleteMyVoice,
  listMyVoices,
  MyVoiceCapabilityUnavailableError,
  resolveMyVoicePlaybackUrl,
  retrieveMyVoice,
  updateMyVoice,
  uploadMyVoiceSample,
} from './services/myVoiceService';
export {
  formatVoiceDuration,
  type MyVoiceCreateInput,
  type MyVoiceKind,
  type MyVoiceListPage,
  type MyVoiceMediaSample,
  type MyVoiceProfile,
  type MyVoiceStatus,
  type MyVoiceUpdateInput,
} from './types/myVoice';
export {
  configureMyVoiceSdkPorts,
  getConfiguredVoiceAppSdkClient,
  getMyVoiceSdkPorts,
  resetMyVoiceSdkPorts,
  tryGetMyVoiceSdkPorts,
  type MyVoiceProfilesClient,
  type MyVoiceSdkPorts,
  type MyVoiceUploadOptions,
} from './runtime';
