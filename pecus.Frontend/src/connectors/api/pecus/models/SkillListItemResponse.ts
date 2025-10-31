/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * スキルリストアイテムレスポンス
 */
export type SkillListItemResponse = {
    /**
     * スキルID
     */
    id?: number;
    /**
     * スキル名
     */
    name: string | null;
    /**
     * スキルの説明
     */
    description?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 更新日時
     */
    updatedAt?: string | null;
    /**
     * アクティブフラグ
     */
    isActive?: boolean;
    /**
     * このスキルを保有しているユーザー数
     */
    userCount?: number;
};

