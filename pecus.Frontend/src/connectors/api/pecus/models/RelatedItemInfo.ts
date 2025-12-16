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
     * リスト内での一意なインデックス（フロントエンドのReact key用）
     */
    listIndex?: number;
    /**
     * 関連ID（削除時に使用）
     */
    relationId?: number;
    /**
     * アイテムID
     */
    id?: number;
    /**
     * 件名
     */
    subject?: string;
    /**
     * コード
     */
    code?: string;
    relationType?: RelationType;
    /**
     * 関連の方向（このアイテムから見て）
     * "from": このアイテムが関連元
     * "to": このアイテムが関連先
     */
    direction?: string;
    /**
     * オーナーID
     */
    ownerId?: number | null;
    /**
     * アーカイブ済みかどうか
     */
    isArchived?: boolean;
    /**
     * オーナーユーザー名
     */
    ownerUsername?: string | null;
    /**
     * オーナーアバターURL
     */
    ownerAvatarUrl?: string | null;
};

