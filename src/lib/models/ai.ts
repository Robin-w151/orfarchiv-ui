import { Schema } from 'effect';

export const AiModels = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
] as const;

export const AiModel = Schema.Literals(AiModels);
export type AiModel = typeof AiModel.Type;

export interface AiModelConfig {
  readonly name: string;
  readonly modelCode: string;
  readonly ref: string;
  readonly reasoningEffort: string;
}

export type AiModelConfigMap = {
  readonly [K in AiModel]: AiModelConfig;
};
