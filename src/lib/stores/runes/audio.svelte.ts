import { browser } from '$app/environment';
import type { Story } from '$lib/models/story';
import { isMediaSessionAvailable } from '$lib/utils/support';
import EasySpeech from 'easy-speech';
import settings from '../settings';
import { logger } from '$lib/utils/logger';

function AudioStore() {
  let isAvailable = $state(false);
  let story = $state<Story | undefined>(undefined);
  let isPlaying = $state(false);
  let volume = $state(1);
  let utterance: { text: string; voice?: SpeechSynthesisVoice; rate: number; volume: number } | undefined;
  let voice: SpeechSynthesisVoice | undefined;
  let voices: Array<SpeechSynthesisVoice> = $state([]);

  const isActive = $derived<boolean>(!!story);

  if (browser) {
    (async () => {
      const { speechSynthesis, speechSynthesisUtterance } = await EasySpeech.detect();
      if (speechSynthesis && speechSynthesisUtterance) {
        try {
          await EasySpeech.init({ maxTimeout: 5000, interval: 250 });
          voices = EasySpeech.voices().filter((voice) => /de/i.test(voice.lang));
          voice = voices[0];
          EasySpeech.on({
            resume: () => {
              isPlaying = true;
            },
            pause: () => {
              isPlaying = false;
            },
            end: () => {
              isPlaying = false;
            },
          });

          settings.subscribe((settings) => {
            if (settings.audioVoice) {
              voice = voices.find((voice) => voice.voiceURI === settings.audioVoice);
            } else {
              voice = voices[0];
            }
          });

          isAvailable = true;
          logger.infoGroup('text-to-speech initialized', [['voice', voice]], true);
        } catch (error) {
          logger.errorGroup('text-to-speech not available', [[(error as Error).message]]);
        }
      }
    })();
  }

  if (isMediaSessionAvailable()) {
    navigator.mediaSession.setActionHandler('play', () => {
      logger.info('media-session action: play');
      play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      logger.info('media-session action: pause');
      pause();
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      logger.info('media-session action: stop');
      end();
    });
  }

  function read(newStory: Story, newText: string): void {
    if (!isAvailable) {
      return;
    }

    if (story?.id === newStory.id) {
      play();
      return;
    }

    story = newStory;
    isPlaying = true;

    if (isMediaSessionAvailable()) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: newStory.title,
        artist: 'Text to Speech',
      });
    }

    EasySpeech.cancel();

    utterance = {
      text: newText,
      voice,
      rate: 1.2,
      volume,
    };
    EasySpeech.speak(utterance);
  }

  function play(): void {
    if (!isAvailable) {
      return;
    }

    isPlaying = true;

    if (!speechSynthesis.speaking && utterance) {
      EasySpeech.speak(utterance);
    } else {
      EasySpeech.resume();
    }
  }

  function playFromStart(): void {
    if (!isAvailable) {
      return;
    }

    if (!utterance) {
      return;
    }

    isPlaying = true;
    EasySpeech.cancel();
    EasySpeech.speak(utterance);
  }

  function pause(): void {
    if (!isAvailable) {
      return;
    }

    isPlaying = false;
    EasySpeech.pause();
  }

  function end(): void {
    if (!isAvailable) {
      return;
    }

    story = undefined;
    isPlaying = false;
    EasySpeech.cancel();
    utterance = undefined;
  }

  function mute(): void {
    volume = 0;

    if (utterance) {
      utterance.volume = volume;
    }
  }

  function unmute(): void {
    volume = 1;

    if (utterance) {
      utterance.volume = volume;
    }
  }

  return {
    get isAvailable() {
      return isAvailable;
    },
    get story() {
      return story;
    },
    get isActive() {
      return isActive;
    },
    get isPlaying() {
      return isPlaying;
    },
    get volume() {
      return volume;
    },
    get voices() {
      return voices;
    },
    get voice() {
      return voice;
    },
    read,
    play,
    playFromStart,
    pause,
    end,
    mute,
    unmute,
  };
}

export const audioStore = AudioStore();
