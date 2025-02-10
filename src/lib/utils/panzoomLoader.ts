let Panzoom: Promise<typeof import('@panzoom/panzoom').default> | undefined;

export function getPanzoom(): Promise<typeof import('@panzoom/panzoom').default> {
  if (!Panzoom) {
    Panzoom = import('@panzoom/panzoom').then((module) => module.default);
  }

  return Panzoom;
}
