/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DocumentTreeItemResponse } from './DocumentTreeItemResponse';
/**
 * ドキュメントツリーレスポンス
 */
export type DocumentTreeResponse = {
    /**
     * ツリーアイテム一覧
     */
    items?: Array<DocumentTreeItemResponse>;
    /**
     * 総アイテム数
     */
    totalCount?: number;
};

