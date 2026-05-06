import { z } from 'zod';

export const generateAiTextInputSchema = z.object({
  markdown: z.string({ error: 'マークダウンが不正です。' }).min(1, 'マークダウンが不正です。'),
  cursorMarker: z.string({ error: 'カーソルマーカーが不正です。' }).min(1, 'カーソルマーカーが不正です。'),
  userPrompt: z.string({ error: '指示が不正です。' }).min(1, '指示が不正です。'),
});

export type GenerateAiTextInput = z.infer<typeof generateAiTextInputSchema>;
