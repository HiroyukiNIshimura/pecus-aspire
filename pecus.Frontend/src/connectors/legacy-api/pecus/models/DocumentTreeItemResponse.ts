/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ドキュメントツリーのアイテム情報
 */
export type DocumentTreeItemResponse = {
    /**
     * アイテムID
     */
    id?: number;
    /**
     * アイテムコード
     */
    code: string;
    /**
     * 件名
     */
    subject: string;
    /**
     * 親アイテムID（nullの場合はルートアイテム）
     */
    parentId?: number | null;
    /**
     * 下書きかどうか
     */
    isDraft?: boolean;
    /**
     * 表示順序（同一親内での並び順）
     */
    sortOrder?: number;
    /**
     * 行バージョン（楽観的ロック用）
     */
    rowVersion?: number;
};

