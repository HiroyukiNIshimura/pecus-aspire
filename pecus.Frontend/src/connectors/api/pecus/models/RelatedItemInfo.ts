/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RelationType } from './RelationType';
/**
 * 関連アイテムの基本情報
 */
export type RelatedItemInfo = {
    /**
     * アイテムID
     */
    id?: number;
    /**
     * 件名
     */
    subject?: string | null;
    /**
     * コード
     */
    code?: string | null;
    relationType?: RelationType;
    /**
     * 関連の方向（このアイテムから見て）
     * "from": このアイテムが関連元
     * "to": このアイテムが関連先
     */
    direction?: string | null;
    /**
     * オーナーID
     */
    ownerId?: number | null;
    /**
     * オーナーユーザー名
     */
    ownerUsername?: string | null;
    /**
     * オーナーアバターURL
     */
    ownerAvatarUrl?: string | null;
};

