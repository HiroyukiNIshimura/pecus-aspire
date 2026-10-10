/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenerateTextRequest } from '../models/GenerateTextRequest';
import type { GenerateTextResponse } from '../models/GenerateTextResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AiAssistantService {
    /**
     * エディタのカーソル位置に挿入するテキストを生成
     * @param requestBody キャンセルトークン
     * @returns GenerateTextResponse テキスト生成成功
     * @throws ApiError
     */
    public static postApiAiAssistantGenerate(
        requestBody: GenerateTextRequest,
    ): CancelablePromise<GenerateTextResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai-assistant/generate',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                503: `AI機能が利用できない（組織設定が未構成）`,
            },
        });
    }
}
