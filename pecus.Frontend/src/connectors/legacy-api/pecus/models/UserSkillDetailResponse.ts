/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ユーザースキル詳細レスポンス（追加日時・説明を含む）
 */
export type UserSkillDetailResponse = {
    /**
     * スキルID
     */
    id: number;
    /**
     * スキル名
     */
    name: string;
    /**
     * スキル説明
     */
    description?: string | null;
    /**
     * スキル追加日時
     */
    addedAt: string;
};

