/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvailableModelResponse } from './AvailableModelResponse';
/**
 * 利用可能なAIモデル一覧取得レスポンス
 */
export type GetAvailableModelsResponse = {
    /**
     * 成功したかどうか
     */
    success: boolean;
    /**
     * 利用可能なモデルのリスト（成功時のみ）
     */
    models?: Array<AvailableModelResponse> | null;
    /**
     * エラーメッセージ（失敗時のみ）
     */
    errorMessage?: string | null;
    /**
     * エラー詳細（開発用、失敗時のみ）
     */
    errorDetail?: string | null;
};

