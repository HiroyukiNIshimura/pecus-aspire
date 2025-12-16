/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 自ユーザースキル設定リクエスト
 */
export type SetOwnSkillsRequest = {
    /**
     * スキルIDのリスト。既存のすべてのスキルを置き換えます。
     * 空のリストまたはnullの場合はすべてのスキルを削除します。
     */
    skillIds?: Array<number> | null;
    /**
     * ユーザーの楽観的ロック用RowVersion。
     * 競合検出に使用されます。設定されている場合、ユーザーのRowVersionをチェックします。
     */
    userRowVersion?: number | null;
};

