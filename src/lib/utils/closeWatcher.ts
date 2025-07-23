import { isCloseWatcherAvailable } from './support';

export interface CloseWatcherOptions {
  onClose?: () => void;
}

export interface CloseWatcherReturn {
  setup: () => void;
  cleanup: () => void;
  requestClose: () => void;
  readonly isActive: boolean;
}

export function createCloseWatcher(options?: CloseWatcherOptions): CloseWatcherReturn {
  let closeWatcher: CloseWatcher | undefined;

  function setup(): void {
    cleanup();

    closeWatcher = getCloseWatcher();
    closeWatcher?.addEventListener('close', handleClose);
  }

  function cleanup(): void {
    if (closeWatcher) {
      closeWatcher.removeEventListener('close', handleClose);
      closeWatcher.destroy();
      closeWatcher = undefined;
    }
  }

  function requestClose(): void {
    if (closeWatcher) {
      closeWatcher.requestClose();
    } else {
      options?.onClose?.();
    }
  }

  function handleClose(): void {
    cleanup();
    options?.onClose?.();
  }

  function getCloseWatcher(): CloseWatcher | undefined {
    return isCloseWatcherAvailable() ? new CloseWatcher() : undefined;
  }

  return {
    setup,
    cleanup,
    requestClose,
    get isActive(): boolean {
      return !!closeWatcher;
    },
  };
}
