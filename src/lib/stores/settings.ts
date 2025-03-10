import { browser } from '$app/environment';
import { SETTINGS_STORE_NAME } from '$lib/configs/client';
import type { Settings } from '$lib/models/settings';
import { sources } from '$lib/models/settings';
import { persisted } from 'svelte-local-storage-store';
import type { Readable } from 'svelte/store';

export interface SettingsStore extends Readable<Settings> {
  setFetchReadMoreContent: (fetchReadMoreContent: boolean) => void;
  setCheckNewsUpdates: (checkNewsUpdates: boolean) => void;
  setForceReducedMotion: (forceReducedMotion: boolean) => void;
  setSource: (source: string, included: boolean) => void;
  setAudioVoice: (audioVoice: string | undefined) => void;
}

const initialState: Settings = {
  fetchReadMoreContent: false,
  checkNewsUpdates: false,
  forceReducedMotion: false,
  sources: sources.map((source) => source.key),
  audioVoice: undefined,
};

sanitizeLocalStorage();
const settings = createSettingsStore();

function sanitizeLocalStorage(): void {
  if (!browser) {
    return;
  }

  function persist(settings: Settings): void {
    localStorage.setItem(SETTINGS_STORE_NAME, JSON.stringify(settings));
  }

  const settingsValue = localStorage.getItem(SETTINGS_STORE_NAME);
  if (!settingsValue) {
    persist(initialState);
    return;
  }

  try {
    const settings: Partial<Settings> = JSON.parse(settingsValue);

    if (!('fetchReadMoreContent' in settings)) {
      settings.fetchReadMoreContent = initialState.fetchReadMoreContent;
    }

    if (!('checkNewsUpdates' in settings)) {
      settings.checkNewsUpdates = initialState.checkNewsUpdates;
    }

    if (!('forceReducedMotion' in settings)) {
      settings.forceReducedMotion = initialState.forceReducedMotion;
    }

    if (!('sources' in settings) || !Array.isArray(settings.sources)) {
      settings.sources = initialState.sources;
    }

    persist(settings as unknown as Settings);
  } catch (_error) {
    persist(initialState);
  }
}

function createSettingsStore(): SettingsStore {
  const { subscribe, update } = persisted<Settings>(SETTINGS_STORE_NAME, initialState);

  function setFetchReadMoreContent(fetchReadMoreContent: boolean): void {
    update((settings) => ({ ...settings, fetchReadMoreContent }));
  }

  function setCheckNewsUpdates(checkNewsUpdates: boolean): void {
    update((settings) => ({ ...settings, checkNewsUpdates }));
  }

  function setForceReducedMotion(forceReducedMotion: boolean): void {
    update((settings) => ({ ...settings, forceReducedMotion }));
  }

  function setSource(source: string, included: boolean): void {
    update((settings) => {
      let newSources = settings.sources ? [...settings.sources] : [];
      if (included) {
        if (!newSources.includes(source)) {
          newSources.push(source);
        }
      } else {
        newSources = newSources.filter((s) => s !== source);
      }
      return { ...settings, sources: newSources };
    });
  }

  function setAudioVoice(audioVoice: string | undefined): void {
    update((settings) => ({ ...settings, audioVoice }));
  }

  return {
    subscribe,
    setFetchReadMoreContent,
    setCheckNewsUpdates,
    setForceReducedMotion,
    setSource,
    setAudioVoice,
  };
}

export default settings;
