import { z } from 'zod';

export const AiModels = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
] as const;

export const AiModel = z.enum(AiModels);
export type AiModel = z.infer<typeof AiModel>;

export interface AiModelConfig {
  name: string;
  modelCode: string;
  ref: string;
  supportsThinking: boolean;
}

export type AiModelConfigMap = {
  [K in AiModel]: AiModelConfig;
};
