import { logger } from './logger';
import { isViewTransitionAvailable } from './support';

let isViewTransitionInProgress = false;

export function runViewTransition(
  fn: () => void | Promise<void>,
  { useReducedMotion = false }: { useReducedMotion?: boolean } = {},
): void {
  if (isViewTransitionAvailable() && !useReducedMotion) {
    logger.debug('view-transition: starting');
    if (isViewTransitionInProgress) {
      logger.debug('view-transition: already in progress');
      return;
    }
    isViewTransitionInProgress = true;
    const transition = document.startViewTransition(fn);
    transition.finished.then(() => {
      isViewTransitionInProgress = false;
      logger.debug('view-transition: finished');
    });
  } else {
    logger.debug('view-transition: not available');
    fn();
  }
}
