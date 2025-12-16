/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペーススキル設定リクエスト
 */
export type SetWorkspaceSkillsRequest = {
    /**
     * スキルIDのリスト。既存のすべてのスキルを置き換えます。
     * 空のリストまたはnullの場合はすべてのスキルを削除します。
     */
    skillIds?: any[] | null;
    /**
     * ワークスペースの楽観的ロック用RowVersion。
     * 競合検出に使用されます。
     */
    rowVersion: number | string;
};

