import { cubicInOut, linear } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export type Position = 'top' | 'bottom' | 'left' | 'right' | 'center';
export type TransformOrigin = `${Position}` | `${Position} ${Position}`;

export const transitionDefaults = {
  duration: 150,
  easing: cubicInOut,
};

export function rollFade(node: Element): TransitionConfig {
  const opacity = +getComputedStyle(node).opacity;

  return {
    ...transitionDefaults,
    css: (t: number, u: number) => `transform: translateY(${0.5 * u}rem); opacity: ${t * opacity}`,
  };
}

export function rollDown(node: Element): TransitionConfig {
  const height = window.screen.availHeight;
  const opacity = +getComputedStyle(node).opacity;

  return {
    duration: 250,
    easing: linear,
    css: (t: number) => {
      return `max-height: ${t * height}px; opacity: ${t * opacity}; overflow: hidden`;
    },
  };
}

export function scaleFade(node: Element): TransitionConfig {
  const opacity = +getComputedStyle(node).opacity;

  return {
    ...transitionDefaults,
    css: (t: number, u: number) => `transform: scale(${1 - 0.1 * u}); opacity: ${t * opacity}`,
  };
}
