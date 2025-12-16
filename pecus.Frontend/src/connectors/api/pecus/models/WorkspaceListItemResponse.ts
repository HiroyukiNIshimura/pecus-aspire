/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceUserItem } from './WorkspaceUserItem';
/**
 * ワークスペースリストアイテムレスポンス
 */
export type WorkspaceListItemResponse = {
    /**
     * ワークスペースID
     */
    id: number | string;
    /**
     * ワークスペース名
     */
    name: string;
    /**
     * ワークスペースコード
     */
    code?: string | null;
    /**
     * ワークスペースの説明
     */
    description?: string | null;
    /**
     * 組織ID
     */
    organizationId?: number | string;
    /**
     * 組織名
     */
    organizationName?: string | null;
    /**
     * ジャンルID
     */
    genreId?: number | string | null;
    /**
     * ジャンル名
     */
    genreName?: string | null;
    /**
     * ジャンルのアイコン（例: FontAwesome のクラス名）
     */
    genreIcon?: string | null;
    /**
     * アクティブなアイテム数
     */
    activeItemCount?: number | string;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 更新日時
     */
    updatedAt?: string | null;
    /**
     * アクティブフラグ
     */
    isActive?: boolean;
    /**
     * 参加者数（アクティブなワークスペースユーザーの数）
     */
    memberCount?: number | string;
    /**
     * 参加しているユーザー一覧
     */
    members?: any[] | null;
    owner?: (null | WorkspaceUserItem);
};

