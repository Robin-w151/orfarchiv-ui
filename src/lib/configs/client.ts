import type { AiModel, AiModelConfigMap } from '$lib/models/ai';

// Context keys
export const CTX_STORE = Symbol('store');

// IndexedDB
export const BOOKMARKS_STORE_NAME = 'bookmarks';

// LocalStorage
export const SETTINGS_STORE_NAME = 'settings';
export const STYLES_STORE_NAME = 'styles';

// DateTime
export const DATETIME_FORMAT = 'dd.MM.yyyy, HH:mm';

// Notifications
export const NOTIFICATION_NEWS_UPDATES_AVAILABLE = Symbol('news-update-available');
export const NOTIFICATION_NETWORK_OFFLINE_WARNING = Symbol('network-offline-warning');
export const NOTIFICATION_NEW_VERSION_AVAILABLE = Symbol('new-version-available');
export const NOTIFICATION_OFFLINE_CACHE_DOWNLOADED = Symbol('offline-cache-downloaded');

// Notification Actions
export const NOTIFICATION_ACCEPT = 'NOTIFICATION_ACCEPT';
export const NOTIFICATION_CLOSE = 'NOTIFICATION_CLOSE';

// Notification Timeouts
export const NOTIFICATION_BOOKMARK_TIMEOUT = 5_000;
export const NOTIFICATION_COPY_LINK_TIMEOUT = 5_000;

// News
export const NEWS_CHECK_UPDATES_INITIAL_INTERVAL_IN_MS = 7_200_000;
export const NEWS_CHECK_UPDATES_INTERVAL_IN_MS = 1_800_000;

// Request
export const DEFAULT_REQUEST_RETRIES = 3;
export const STORY_CONTENT_FETCH_RETRIES = 5;

// StoryImageViewer
export const PAN_DISTANCE = 50;

// StoryAiSummary
export const STORY_SUMMARY_EXTENDED_WORD_LIMIT = 600;

// AI
export const AI_MODEL_DEFAULT = 'gemini-2.5-flash' satisfies AiModel;
export const AI_MODEL_CONFIG_MAP = Object.freeze(<const>{
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    modelCode: 'gemini-2.0-flash',
    ref: 'https://ai.google.dev/gemini-api/docs/models#gemini-2.0-flash',
    supportsThinking: false,
  },
  'gemini-2.0-flash-lite': {
    name: 'Gemini 2.0 Flash-Lite',
    modelCode: 'gemini-2.0-flash-lite',
    ref: 'https://ai.google.dev/gemini-api/docs/models#gemini-2.0-flash-lite',
    supportsThinking: false,
  },
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    modelCode: 'gemini-2.5-flash',
    ref: 'https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash',
    supportsThinking: true,
  },
  'gemini-2.5-flash-lite': {
    name: 'Gemini 2.5 Flash-Lite',
    modelCode: 'gemini-2.5-flash-lite-preview-06-17',
    ref: 'https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash-lite',
    supportsThinking: true,
  },
}) satisfies AiModelConfigMap;
