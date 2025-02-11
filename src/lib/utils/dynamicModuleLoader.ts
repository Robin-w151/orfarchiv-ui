export function dynamicModuleLoader<T>(importFn: () => Promise<T>): { module: Promise<T> } {
  let cache: Promise<T> | undefined;
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'module') {
          if (!cache) {
            cache = importFn();
          }
          return cache;
        }

        return undefined;
      },
    },
  ) as { module: Promise<T> };
}
