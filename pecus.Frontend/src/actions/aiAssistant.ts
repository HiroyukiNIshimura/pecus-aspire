'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { GenerateTextResponse } from '@/connectors/api/pecus';
import type { ApiResponse } from './types';

/**
 * AIアシスタント生成リクエスト
 */
export interface GenerateAiTextRequest {
  /** エディタ全体のMarkdownコンテンツ（カーソル位置マーカー含む） */
  markdown: string;
  /** カーソル位置を示すマーカー文字列 */
  cursorMarker: string;
  /** ユーザーからの指示（何を生成してほしいか） */
  userPrompt: string;
}

/**
 * Server Action: AIアシスタントによるテキスト生成
 *
 * エディタのカーソル位置に挿入する最適なテキストを生成する。
 * 組織のAI設定が未構成の場合はエラーを返す。
 *
 * @param request 生成リクエスト
 * @returns 生成されたテキスト（Markdown形式）
 */
export async function generateAiText(request: GenerateAiTextRequest): Promise<ApiResponse<GenerateTextResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.aiAssistant.postApiAiAssistantGenerate({
      markdown: request.markdown,
      cursorMarker: request.cursorMarker,
      userPrompt: request.userPrompt,
    });

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to generate AI text:', error);
    return parseErrorResponse(error, 'テキストの生成に失敗しました。');
  }
}
