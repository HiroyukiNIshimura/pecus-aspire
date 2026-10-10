/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * アイテムの親更新リクエスト
 */
export type UpdateItemParentRequest = {
    /**
     * 対象アイテムID（子となるアイテム）
     */
    itemId: number;
    /**
     * 新しい親アイテムID（ルートにする場合はnull）
     */
    newParentItemId?: number | null;
    /**
     * 新しい親の子リスト内での挿入位置インデックス（0始まり）。
     * null の場合は末尾に追加。
     */
    insertAtIndex?: number | null;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

