import type { Attachment } from 'svelte/attachments';

export interface FocusTrapOptions {
  /**
   * CSS selector or HTMLElement to receive focus on mount.
   * Defaults to the first tabbable element inside the container.
   */
  initialFocus?: string | HTMLElement;

  /**
   * CSS selector or HTMLElement to receive focus if the trap container
   * has no focusable children. Defaults to the container itself.
   */
  fallbackFocus?: string | HTMLElement;

  /**
   * If true, skips focusing any element when the trap is initially set up.
   * Defaults to false.
   */
  skipInitialFocus?: boolean;
}

/**
 * Svelte attachment which traps Tab/Shift+Tab focus inside its node.
 */
export const focusTrap = ({
  initialFocus,
  fallbackFocus,
  skipInitialFocus,
}: FocusTrapOptions = {}): Attachment<HTMLElement> => {
  return (node) => {
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'area[href]',
        'input:not([disabled]):not([type=hidden])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'iframe',
        'object',
        'embed',
        '[contenteditable]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      return Array.from(node.querySelectorAll<HTMLElement>(selector)).filter((el) => {
        const style = getComputedStyle(el);
        return (
          (el.offsetWidth > 0 || el.offsetHeight > 0 || style.visibility !== 'hidden') &&
          el.getAttribute('aria-hidden') !== 'true'
        );
      });
    };

    const resolveFocusTarget = (
      element: string | HTMLElement | undefined,
      fallbackElement: HTMLElement,
    ): HTMLElement => {
      if (!element) {
        return fallbackElement;
      }

      if (typeof element === 'string') {
        return node.querySelector<HTMLElement>(element) ?? fallbackElement;
      }

      return element;
    };

    const focusInitial = (): void => {
      const all = getFocusableElements();
      const first = all[0];
      const fallback = resolveFocusTarget(fallbackFocus, node);
      const target = resolveFocusTarget(initialFocus, first || fallback);
      target.focus();
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        resolveFocusTarget(fallbackFocus, node).focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement;

      if (!node.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey) {
        if (active === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const onFocusIn = (event: FocusEvent): void => {
      if (!node.contains(event.target as Node)) {
        event.stopImmediatePropagation();
        focusInitial();
      }
    };

    node.tabIndex = node.tabIndex ?? -1;
    node.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);

    if (!skipInitialFocus) {
      focusInitial();
    }

    return () => {
      node.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
    };
  };
};
