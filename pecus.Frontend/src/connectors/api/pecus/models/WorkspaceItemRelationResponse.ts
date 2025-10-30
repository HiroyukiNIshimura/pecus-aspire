/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペースアイテム関連情報レスポンス
 */
export type WorkspaceItemRelationResponse = {
    /**
     * 関連ID
     */
    id?: number;
    /**
     * 関連元アイテムID
     */
    fromItemId?: number;
    /**
     * 関連元アイテムコード
     */
    fromItemCode?: string | null;
    /**
     * 関連元アイテム件名
     */
    fromItemSubject?: string | null;
    /**
     * 関連先アイテムID
     */
    toItemId?: number;
    /**
     * 関連先アイテムコード
     */
    toItemCode?: string | null;
    /**
     * 関連先アイテム件名
     */
    toItemSubject?: string | null;
    /**
     * 関連タイプ
     */
    relationType?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 作成者ID
     */
    createdByUserId?: number;
    /**
     * 作成者ユーザー名
     */
    createdByUsername?: string | null;
};

