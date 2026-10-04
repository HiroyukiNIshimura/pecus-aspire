/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SkillDetailResponse } from './SkillDetailResponse';
/**
 * スキルレスポンス
 */
export type SkillResponse = {
    /**
     * 成功フラグ
     */
    success?: boolean;
    /**
     * メッセージ
     */
    message: string;
    skill?: SkillDetailResponse;
};

