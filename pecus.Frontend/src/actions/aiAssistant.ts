'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { GenerateTextResponse } from '@/connectors/api/pecus';
import { type GenerateAiTextInput, generateAiTextInputSchema } from '@/schemas/aiAssistantSchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { validationError } from './types';

/**
 * Server Action: AIアシスタントによるテキスト生成
 *
 * エディタのカーソル位置に挿入する最適なテキストを生成する。
 * 組織のAI設定が未構成の場合はエラーを返す。
 *
 * @param input 生成リクエスト
 * @returns 生成されたテキスト（Markdown形式）
 */
export async function generateAiText(input: GenerateAiTextInput): Promise<ApiResponse<GenerateTextResponse>> {
  const parseResult = generateAiTextInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.aiAssistant.postApiAiAssistantGenerate({
      markdown: parseResult.data.markdown,
      cursorMarker: parseResult.data.cursorMarker,
      userPrompt: parseResult.data.userPrompt,
    });

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to generate AI text:', error);
    return handleApiErrorForAction<GenerateTextResponse>(error, {
      defaultMessage: 'テキストの生成に失敗しました。',
    });
  }
}
