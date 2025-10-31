/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SkillDetailResponse } from './SkillDetailResponse';
/**
 * スキル作成・更新レスポンス
 */
export type SkillResponse = {
    /**
     * 成功フラグ
     */
    success?: boolean;
    /**
     * メッセージ
     */
    message: string | null;
    skill?: SkillDetailResponse;
};

