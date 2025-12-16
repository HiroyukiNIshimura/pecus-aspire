/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TagDetailResponse } from './TagDetailResponse';
/**
 * タグレスポンス
 */
export type TagResponse = {
    /**
     * 成功フラグ
     */
    success?: boolean;
    /**
     * メッセージ
     */
    message?: string;
    tag?: (null | TagDetailResponse);
};

