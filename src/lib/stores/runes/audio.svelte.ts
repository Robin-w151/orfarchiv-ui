import { browser } from '$app/env';
import type { Story, StoryContentChapter } from '$lib/models/story';
import { getChapterTitle } from '$lib/utils/chapter';
import { logger } from '$lib/utils/logger';
import { isMediaSessionAvailable } from '$lib/utils/support';
import EasySpeech from 'easy-speech';
import { getContext, setContext } from 'svelte';
import settings from '../settings';

interface Segment {
  chapterIndex: number;
  text: string;
}

interface AudioStoreInterface {
  isAvailable: boolean;
  story: Story | undefined;
  isActive: boolean;
  isPlaying: boolean;
  volume: number;
  voices: Array<SpeechSynthesisVoice>;
  voice: SpeechSynthesisVoice | undefined;
  chapters: ReadonlyArray<StoryContentChapter>;
  chapterIndex: number;
  chapterTitle: string | undefined;
  progress: number;
  read: (story: Story, chapters: ReadonlyArray<StoryContentChapter>) => void;
  play: () => void;
  playFromStart: () => void;
  playChapter: (index: number) => void;
  nextChapter: () => void;
  previousChapter: () => void;
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
  chapters = $state<ReadonlyArray<StoryContentChapter>>([]);

  private segments = $state<Array<Segment>>([]);
  private segmentIndex = $state(0);
  private speechSynthesis: SpeechSynthesis | undefined;
  private utterance: { text: string; voice?: SpeechSynthesisVoice; rate: number; volume: number } | undefined;
  // Incremented whenever playback is cancelled or restarted so that outdated utterances do not advance the queue
  private playbackId = 0;

  isActive = $derived<boolean>(!!this.story);
  chapterIndex = $derived<number>(this.segments[this.segmentIndex]?.chapterIndex ?? 0);
  chapterTitle = $derived<string | undefined>(this.chapters[this.chapterIndex]?.title);
  progress = $derived<number>(this.segments.length ? this.segmentIndex / this.segments.length : 0);

  read = (newStory: Story, newChapters: ReadonlyArray<StoryContentChapter>): void => {
    if (!this.isAvailable) {
      return;
    }

    if (this.story?.id === newStory.id) {
      this.play();
      return;
    }

    this.story = newStory;
    this.chapters = newChapters;
    this.segments = newChapters.flatMap((chapter, chapterIndex) =>
      chapter.segments.map((text) => ({ chapterIndex, text })),
    );
    this.segmentIndex = 0;
    this.isPlaying = true;

    logger.infoGroup('audio-read', [
      ['story', newStory],
      ['chapters', newChapters],
    ]);

    this.startPlayback();
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

    if (!this.speechSynthesis?.speaking) {
      this.startPlayback();
    } else {
      EasySpeech.resume();
    }
  };

  playFromStart = (): void => {
    if (!this.isAvailable || !this.segments.length) {
      return;
    }

    logger.infoGroup('audio-play-from-start', [['story', $state.snapshot(this.story)]], true);

    this.segmentIndex = 0;
    this.isPlaying = true;
    this.startPlayback();
  };

  playChapter = (index: number): void => {
    if (!this.isAvailable || !this.segments.length) {
      return;
    }

    const chapterIndex = Math.min(Math.max(index, 0), this.chapters.length - 1);
    const segmentIndex = this.segments.findIndex((segment) => segment.chapterIndex === chapterIndex);
    if (segmentIndex < 0) {
      return;
    }

    logger.infoGroup(
      'audio-play-chapter',
      [
        ['story', $state.snapshot(this.story)],
        ['chapter', chapterIndex],
      ],
      true,
    );

    this.segmentIndex = segmentIndex;
    this.isPlaying = true;
    this.startPlayback();
  };

  nextChapter = (): void => {
    this.playChapter(this.chapterIndex + 1);
  };

  previousChapter = (): void => {
    // Restarts the current chapter when playback is already past its first segment
    const segmentIndex = this.segments.findIndex((segment) => segment.chapterIndex === this.chapterIndex);
    this.playChapter(this.segmentIndex > segmentIndex ? this.chapterIndex : this.chapterIndex - 1);
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
    this.chapters = [];
    this.segments = [];
    this.segmentIndex = 0;
    this.isPlaying = false;
    this.playbackId += 1;
    logger.infoGroup('audio-end', [['utterance', this.utterance]], true);

    EasySpeech.cancel();
    this.utterance = undefined;
  };

  mute = (): void => {
    // Applies to the segments spoken from now on, the currently spoken segment keeps its volume
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

  async init(): Promise<void> {
    if (!browser) {
      return;
    }

    const { speechSynthesis, speechSynthesisUtterance } = EasySpeech.detect();
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
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        logger.info('media-session action: previoustrack');
        this.previousChapter();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        logger.info('media-session action: nexttrack');
        this.nextChapter();
      });
    }
  }

  private startPlayback(): void {
    this.playbackId += 1;
    EasySpeech.cancel();
    this.speakCurrentSegment(this.playbackId);
  }

  private speakCurrentSegment(playbackId: number): void {
    const segment = this.segments[this.segmentIndex];
    if (!segment) {
      this.isPlaying = false;
      this.segmentIndex = 0;
      return;
    }

    this.updateMediaSessionMetadata();

    this.utterance = {
      text: segment.text,
      voice: this.voice,
      rate: 1.2,
      volume: this.volume,
    };

    // The end event also fires on cancel, so the queue is advanced from the speak promise guarded by the playback id
    EasySpeech.speak(this.utterance)
      .then(() => {
        if (playbackId !== this.playbackId) {
          return;
        }

        this.segmentIndex += 1;
        this.speakCurrentSegment(playbackId);
      })
      .catch((error) => {
        if (playbackId !== this.playbackId) {
          return;
        }

        this.isPlaying = false;
        logger.errorGroup('audio-error', [[(error as Error).message]]);
      });
  }

  private updateMediaSessionMetadata(): void {
    if (!this.story || !isMediaSessionAvailable()) {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.story.title,
      artist:
        this.chapters.length > 1
          ? getChapterTitle(this.chapters[this.chapterIndex], this.chapterIndex)
          : 'Text to Speech',
    });
  }
}

const DEFAULT_KEY = Symbol('root_audio_store');

export function getAudioStore(key: symbol = DEFAULT_KEY): AudioStoreInterface {
  return getContext(key);
}

export function setAudioStore(key: symbol = DEFAULT_KEY): AudioStoreInterface {
  const audioStore = new AudioStore();
  audioStore.init();
  return setContext(key, audioStore);
}
