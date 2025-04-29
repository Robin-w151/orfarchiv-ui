import { z } from 'zod';

export const AiModels = [
  'gemini-2.5-pro-exp-03-25',
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
] as const;

export const AiModel = z.enum(AiModels);
export type AiModel = z.infer<typeof AiModel>;

export interface AiModelConfig {
  ref: string;
  supportsThinking: boolean;
}
