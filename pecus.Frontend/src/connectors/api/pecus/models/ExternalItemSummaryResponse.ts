/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExternalUserRefResponse } from './ExternalUserRefResponse';
/**
 * 外部公開用アイテムサマリーレスポンス（一覧用）
 */
export type ExternalItemSummaryResponse = {
    /**
     * アイテム番号（ワークスペース内の連番）
     */
    itemNumber: number;
    /**
     * 件名
     */
    subject: string;
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

