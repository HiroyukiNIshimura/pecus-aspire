/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ドキュメントツリー内の兄弟間ソート順変更リクエスト
 */
export type UpdateSiblingOrderRequest = {
    /**
     * 移動するアイテムID
     */
    itemId: number;
    /**
     * 挿入位置インデックス（0始まり、同じ親を持つ兄弟リスト内での位置）
     */
    newIndex: number;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

