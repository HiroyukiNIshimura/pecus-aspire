/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalUserRefResponse } from './ExternalUserRefResponse';
/**
 * 外部公開用アイテム情報レスポンス
 */
export type ExternalItemResponse = {
    /**
     * ワークスペースコード
     */
    workspaceCode: string;
    /**
     * アイテム番号（ワークスペース内の連番）
     */
    itemNumber: number;
    /**
     * 件名
     */
    subject: string;
    /**
     * 本文（Markdown変換データ）
     */
    body?: string | null;
    /**
     * タグ（タグ名一覧）
     */
    tags: Array<string>;
    owner: ExternalUserRefResponse;
    assignedUser?: ExternalUserRefResponse | null;
    committer?: ExternalUserRefResponse | null;
    /**
     * 期限日時
     */
    dueDate?: string | null;
    /**
     * アクティブフラグ
     */
    isActive: boolean;
    /**
     * アーカイブフラグ
     */
    isArchived: boolean;
    /**
     * 下書きフラグ
     */
    isDraft: boolean;
};

