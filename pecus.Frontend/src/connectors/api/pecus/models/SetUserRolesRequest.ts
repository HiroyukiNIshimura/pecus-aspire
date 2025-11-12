/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ユーザーロール設定リクエスト
 */
export type SetUserRolesRequest = {
    /**
     * ロールIDのリスト。既存のすべてのロールを置き換えます。
     * 空のリストまたはnullの場合はすべてのロールを削除します。
     */
    roles: Array<number>;
    /**
     * ユーザーの楽観的ロック用RowVersion。
     * 競合検出に使用されます。設定されている場合、ユーザーのRowVersionをチェックします。
     */
    userRowVersion?: number | null;
};

