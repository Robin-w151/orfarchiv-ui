import { browser } from '$app/environment';
import type { Story } from '$lib/models/story';
import { logger } from '$lib/utils/logger';
import { isMediaSessionAvailable } from '$lib/utils/support';
import EasySpeech from 'easy-speech';
import { getContext, setContext } from 'svelte';
import settings from '../settings';

interface AudioStoreInterface {
  isAvailable: boolean;
  story: Story | undefined;
  isActive: boolean;
  isPlaying: boolean;
  volume: number;
  voices: Array<SpeechSynthesisVoice>;
  voice: SpeechSynthesisVoice | undefined;
  read: (story: Story, text: string) => void;
  play: () => void;
  playFromStart: () => void;
  pause: () => void;
  end: () => void;
  mute: () => void;
  unmute: () => void;
}

class AudioStore implements AudioStoreInterface {
  isAvailable = $state(false);
  story = $state<Story | undefined>(undefined);
  isPlaying = $state(false);
  volume = $state(1);
  voice: SpeechSynthesisVoice | undefined;
  voices: Array<SpeechSynthesisVoice> = $state([]);
  isActive = $derived<boolean>(!!this.story);

  private speechSynthesis: SpeechSynthesis | undefined;
  private utterance: { text: string; voice?: SpeechSynthesisVoice; rate: number; volume: number } | undefined;

  constructor() {
    this.init();
  }

  read = (newStory: Story, newText: string): void => {
    if (!this.isAvailable) {
      return;
    }

    if (this.story?.id === newStory.id) {
      this.play();
      return;
    }

    this.story = newStory;
    this.isPlaying = true;

    if (isMediaSessionAvailable()) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: newStory.title,
        artist: 'Text to Speech',
      });
    }

    EasySpeech.cancel();

    this.utterance = {
      text: newText,
      voice: this.voice,
      rate: 1.2,
      volume: this.volume,
    };
    logger.infoGroup('audio-read', [
      ['story', newStory],
      ['text', newText],
      ['utterance', this.utterance],
    ]);

    EasySpeech.speak(this.utterance);
  };

  play = (): void => {
    if (!this.isAvailable) {
      return;
    }

    this.isPlaying = true;
    logger.infoGroup(
      'audio-play',
      [
        ['story', $state.snapshot(this.story)],
        ['utterance', this.utterance],
      ],
      true,
    );

    if (!this.speechSynthesis?.speaking && this.utterance) {
      EasySpeech.speak(this.utterance);
    } else {
      EasySpeech.resume();
    }
  };

  playFromStart = (): void => {
    if (!this.isAvailable) {
      return;
    }

    if (!this.utterance) {
      return;
    }

    this.isPlaying = true;
    logger.infoGroup(
      'audio-play-from-start',
      [
        ['story', $state.snapshot(this.story)],
        ['utterance', this.utterance],
      ],
      true,
    );

    EasySpeech.cancel();
    EasySpeech.speak(this.utterance);
  };

  pause = (): void => {
    if (!this.isAvailable) {
      return;
    }

    this.isPlaying = false;
    logger.infoGroup(
      'audio-pause',
      [
        ['story', $state.snapshot(this.story)],
        ['utterance', this.utterance],
      ],
      true,
    );

    EasySpeech.pause();
  };

  end = (): void => {
    if (!this.isAvailable) {
      return;
    }

    this.story = undefined;
    this.isPlaying = false;
    logger.infoGroup('audio-end', [['utterance', this.utterance]], true);

    EasySpeech.cancel();
    this.utterance = undefined;
  };

  mute = (): void => {
    this.volume = 0;

    if (this.utterance) {
      this.utterance.volume = this.volume;
      logger.infoGroup(
        'audio-mute',
        [
          ['story', $state.snapshot(this.story)],
          ['utterance', this.utterance],
        ],
        true,
      );
    }
  };

  unmute = (): void => {
    this.volume = 1;

    if (this.utterance) {
      this.utterance.volume = this.volume;
      logger.infoGroup(
        'audio-unmute',
        [
          ['story', $state.snapshot(this.story)],
          ['utterance', this.utterance],
        ],
        true,
      );
    }
  };

  private async init(): Promise<void> {
    if (!browser) {
      return;
    }

    const { speechSynthesis, speechSynthesisUtterance } = await EasySpeech.detect();
    if (speechSynthesis && speechSynthesisUtterance) {
      try {
        await EasySpeech.init({ maxTimeout: 5000, interval: 250 });
        this.voices = EasySpeech.voices().filter((voice) => /de/i.test(voice.lang));
        this.voice = this.voices[0];
        EasySpeech.on({
          resume: () => {
            this.isPlaying = true;
          },
          pause: () => {
            this.isPlaying = false;
          },
          end: () => {
            this.isPlaying = false;
          },
        });

        settings.subscribe((settings) => {
          if (settings.audioVoice) {
            this.voice = this.voices.find((voice) => voice.voiceURI === settings.audioVoice);
          } else {
            this.voice = this.voices[0];
          }
        });

        this.speechSynthesis = speechSynthesis;
        this.isAvailable = true;
        logger.infoGroup('text-to-speech initialized', [['voice', this.voice]], true);
      } catch (error) {
        logger.errorGroup('text-to-speech not available', [[(error as Error).message]]);
      }
    }

    if (isMediaSessionAvailable()) {
      navigator.mediaSession.setActionHandler('play', () => {
        logger.info('media-session action: play');
        this.play();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        logger.info('media-session action: pause');
        this.pause();
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        logger.info('media-session action: stop');
        this.end();
      });
    }
  }
}

const DEFAULT_KEY = 'root_audio_store';

export function getAudioStore(key: string = DEFAULT_KEY): AudioStoreInterface {
  return getContext(key);
}

export function setAudioStore(key: string = DEFAULT_KEY): AudioStoreInterface {
  const audioStore = new AudioStore();
  return setContext(key, audioStore);
}
