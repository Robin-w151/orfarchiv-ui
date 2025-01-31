import { browser } from '$app/environment';
import type { Story } from '$lib/models/story';
import { isMediaSessionAvailable } from '$lib/utils/web-api-support';
import EasySpeech from 'easy-speech';

function AudioStore() {
  let isAvailable = $state(false);
  let story = $state<Story | undefined>(undefined);
  let isPlaying = $state(false);
  let volume = $state(1);
  let utterance: { text: string; voice?: SpeechSynthesisVoice; rate: number; volume: number } | undefined;
  let voice: SpeechSynthesisVoice | undefined;

  const isActive = $derived<boolean>(!!story);

  if (browser) {
    (async () => {
      const { speechSynthesis, speechSynthesisUtterance } = await EasySpeech.detect();
      if (speechSynthesis && speechSynthesisUtterance) {
        try {
          await EasySpeech.init({ maxTimeout: 5000, interval: 250 });
          voice = EasySpeech.voices().find((voice) => /de/i.test(voice.lang));
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

          isAvailable = true;
          console.info(`Text-to-Speech initialized. Voice: ${voice?.name}`);
        } catch (error) {
          console.info(`Text-to-Speech not available: ${(error as Error).message}`);
        }
      }
    })();
  }

  if (isMediaSessionAvailable()) {
    navigator.mediaSession.setActionHandler('play', () => {
      console.log('play');
      play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('pause');
      pause();
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      console.log('stop');
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
      rate: 1.3,
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
