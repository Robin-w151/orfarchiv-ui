/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
  // interface Locals {}
  // interface Platform {}
  // interface Session {}
  // interface Stuff {}
}

/**
 * The CloseWatcher interface allows a custom UI component with open and close semantics
 * to respond to device-specific close actions in the same way as a built-in component.
 *
 * Close requests are platform-mediated interactions intended to close an in-page component,
 * such as the Esc key on desktop platforms, the back button on Android, or accessibility
 * gestures on mobile devices.
 *
 * @example
 * ```typescript
 * const watcher = new CloseWatcher();
 * watcher.onclose = () => {
 *   myModal.close();
 * };
 *
 * // Clean up when no longer needed
 * watcher.destroy();
 * ```
 *
 * @experimental This is an experimental technology. Check browser compatibility before using in production.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CloseWatcher
 */
declare class CloseWatcher extends EventTarget {
  /**
   * Creates a new CloseWatcher instance.
   *
   * @param options Optional configuration for the CloseWatcher
   */
  constructor(options?: CloseWatcherOptions);

  /**
   * Fires a `cancel` event and if that event is not canceled with `Event.preventDefault()`,
   * proceeds to fire a `close` event, and then finally deactivates the close watcher.
   *
   * This method is useful for centralizing close-handling code by triggering the same
   * event sequence as platform-native close requests.
   */
  requestClose(): void;

  /**
   * Immediately fires the `close` event, without firing `cancel` first,
   * and deactivates the close watcher.
   *
   * Use this method when you want to bypass any confirmation logic in cancel handlers.
   */
  close(): void;

  /**
   * Deactivates the close watcher so that it will no longer receive close events.
   *
   * You should call this method when the UI component is closed through other means
   * or when the component is no longer needed, to free up resources and allow
   * creation of new independent CloseWatcher instances.
   */
  destroy(): void;

  /**
   * Event handler called before the `close` event, allowing you to prevent
   * the close action by calling `event.preventDefault()`.
   *
   * This event only fires if the page has received transient user activation,
   * and is useful for implementing confirmation dialogs or preventing data loss.
   *
   * @example
   * ```typescript
   * watcher.oncancel = (event) => {
   *   if (hasUnsavedData) {
   *     event.preventDefault();
   *     // Show confirmation dialog
   *   }
   * };
   * ```
   */
  oncancel: ((this: CloseWatcher, ev: Event) => any) | null;

  /**
   * Event handler called when a close request is received and should be processed.
   *
   * This event fires after any `cancel` event has been processed and not prevented.
   * After this event, the CloseWatcher is automatically deactivated.
   *
   * @example
   * ```typescript
   * watcher.onclose = () => {
   *   myModal.close();
   * };
   * ```
   */
  onclose: ((this: CloseWatcher, ev: Event) => any) | null;

  /**
   * Adds an event listener for CloseWatcher-specific events.
   *
   * @param type The event type ("cancel" or "close")
   * @param listener The event listener function
   * @param options Optional event listener options
   */
  addEventListener<K extends keyof CloseWatcherEventMap>(
    type: K,
    listener: (this: CloseWatcher, ev: CloseWatcherEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * Adds an event listener for any event type.
   *
   * @param type The event type
   * @param listener The event listener function or object
   * @param options Optional event listener options
   */
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * Removes an event listener for CloseWatcher-specific events.
   *
   * @param type The event type ("cancel" or "close")
   * @param listener The event listener function to remove
   * @param options Optional event listener options
   */
  removeEventListener<K extends keyof CloseWatcherEventMap>(
    type: K,
    listener: (this: CloseWatcher, ev: CloseWatcherEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;

  /**
   * Removes an event listener for any event type.
   *
   * @param type The event type
   * @param listener The event listener function or object to remove
   * @param options Optional event listener options
   */
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

/**
 * Configuration options for creating a CloseWatcher instance.
 */
interface CloseWatcherOptions {
  /**
   * An AbortSignal that can be used to destroy the CloseWatcher.
   * When the signal is aborted, the CloseWatcher will be automatically destroyed.
   *
   * @example
   * ```typescript
   * const controller = new AbortController();
   * const watcher = new CloseWatcher({ signal: controller.signal });
   *
   * // Later, destroy the watcher
   * controller.abort();
   * ```
   */
  signal?: AbortSignal;
}

/**
 * Event map for CloseWatcher events.
 */
interface CloseWatcherEventMap {
  /**
   * Fired before the close event, allowing prevention of the close action.
   * Only fires with transient user activation.
   */
  cancel: Event;

  /**
   * Fired when a close request should be processed.
   * The CloseWatcher is deactivated after this event.
   */
  close: Event;
}
