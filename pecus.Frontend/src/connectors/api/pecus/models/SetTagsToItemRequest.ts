/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request DTO for setting all tags on a workspace item
 */
export type SetTagsToItemRequest = {
    /**
     * タグ名のリスト。既存のすべてのタグを置き換えます。
     * 空のリストまたはnullの場合はすべてのタグを削除します。
     */
    tags?: Array<string> | null;
    /**
     * アイテムの楽観的ロック用RowVersion。
     * 競合検出に使用されます。設定されている場合、アイテムのRowVersionをチェックします。
     */
    itemRowVersion?: number | null;
};

