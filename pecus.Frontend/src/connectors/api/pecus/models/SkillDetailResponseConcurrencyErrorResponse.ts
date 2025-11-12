/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SkillDetailResponse } from './SkillDetailResponse';
/**
 * 競合エラーレスポンス（409 Conflict）
 */
export type SkillDetailResponseConcurrencyErrorResponse = {
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
    current?: SkillDetailResponse;
};

