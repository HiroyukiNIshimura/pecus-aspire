/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * エラーレスポンス
 */
export type ErrorResponse = {
    /**
     * HTTPステータスコード
     */
    statusCode?: number;
    /**
     * エラーメッセージ
     */
    message: string;
    /**
     * エラー詳細（オプション）
     */
    details?: string | null;
};

