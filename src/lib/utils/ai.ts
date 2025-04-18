import type { AiModel } from '$lib/models/ai';

export const aiModelRefMap = new Map<AiModel, string>([
  ['gemini-2.0-flash', 'https://ai.google.dev/gemini-api/docs/models#gemini-2.0-flash'],
  ['gemini-2.0-flash-lite', 'https://ai.google.dev/gemini-api/docs/models#gemini-2.0-flash-lite'],
  ['gemini-2.5-flash-preview-04-17', 'https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash-preview'],
]);
