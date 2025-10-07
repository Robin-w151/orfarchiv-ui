import { cubicInOut, linear } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export type Position = 'top' | 'bottom' | 'left' | 'right' | 'center';
export type TransformOrigin = `${Position}` | `${Position} ${Position}`;

export const transitionDefaults = {
  duration: 150,
  easing: cubicInOut,
};

export function rollFade(node: Element, options: TransitionConfig): TransitionConfig {
  const opacity = +getComputedStyle(node).opacity;

  return {
    ...transitionDefaults,
    ...options,
    css: (t: number, u: number) => `transform: translateY(${0.5 * u}rem); opacity: ${t * opacity}`,
  };
}

export function rollDown(node: Element, options: TransitionConfig): TransitionConfig {
  const height = window.screen.availHeight;
  const opacity = +getComputedStyle(node).opacity;

  return {
    duration: 250,
    easing: linear,
    ...options,
    css: (t: number) => {
      return `max-height: ${t * height}px; opacity: ${t * opacity}; overflow: hidden`;
    },
  };
}

export function scaleFade(node: Element, options: TransitionConfig): TransitionConfig {
  const opacity = +getComputedStyle(node).opacity;

  return {
    ...transitionDefaults,
    ...options,
    css: (t: number, u: number) => `transform: scale(${1 - 0.1 * u}); opacity: ${t * opacity}`,
  };
}
