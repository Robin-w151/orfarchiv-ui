import { z } from 'zod';

export const AiModels = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
] as const;

export const AiModel = z.enum(AiModels);
export type AiModel = z.infer<typeof AiModel>;

export interface AiModelConfig {
  readonly name: string;
  readonly modelCode: string;
  readonly ref: string;
  readonly supportsThinking: boolean;
}

export type AiModelConfigMap = {
  readonly [K in AiModel]: AiModelConfig;
};

export const OpenAIError = z.object({
  status: z.number(),
  error: z.array(
    z.object({
      error: z.object({
        code: z.number(),
        message: z.string(),
        status: z.string(),
      }),
    }),
  ),
});
export type OpenAIError = z.infer<typeof OpenAIError>;
