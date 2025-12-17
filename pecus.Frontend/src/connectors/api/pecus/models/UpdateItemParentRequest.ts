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
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

