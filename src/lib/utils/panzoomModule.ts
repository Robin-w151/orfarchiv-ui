import { dynamicModuleLoader } from './dynamicModuleLoader';

export const Panzoom = dynamicModuleLoader(() => import('@panzoom/panzoom').then((module) => module.default));
