import { Effect, Fiber } from 'effect';

export function runEffect<A, E>(
  effect: Effect.Effect<A, E, never>,
): { complete: () => Promise<void>; cancel: () => void } {
  const fiber = Effect.runFork(effect);
  return {
    complete: () => Effect.runPromise(Fiber.await(fiber).pipe(Effect.ignore)),
    cancel: () => Effect.runSync(Fiber.interruptFork(fiber)),
  };
}
