/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SystemNotificationType } from './SystemNotificationType';
/**
 * BackOffice用 システム通知詳細レスポンス
 */
export type BackOfficeNotificationDetailResponse = {
    /**
     * 通知ID
     */
    id: number;
    /**
     * 件名
     */
    subject: string;
    /**
     * 本文（Markdown形式）
     */
    body: string;
    type?: SystemNotificationType;
    /**
     * 公開開始日時
     */
    publishAt?: string;
    /**
     * 公開終了日時
     */
    endAt?: string | null;
    /**
     * 配信済みフラグ
     */
    isProcessed?: boolean;
    /**
     * 配信日時
     */
    processedAt?: string | null;
    /**
     * 配信したChatMessageのID（JSON配列）
     */
    messageIds?: string | null;
    /**
     * 削除済みフラグ
     */
    isDeleted?: boolean;
    /**
     * 削除日時
     */
    deletedAt?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 作成者ユーザーID
     */
    createdByUserId?: number;
    /**
     * 作成者ユーザー名
     */
    createdByUserName?: string | null;
    /**
     * 更新日時
     */
    updatedAt?: string | null;
    /**
     * 更新者ユーザーID
     */
    updatedByUserId?: number | null;
    /**
     * 更新者ユーザー名
     */
    updatedByUserName?: string | null;
    /**
     * 編集可能か（公開前のみ編集可）
     */
    isEditable?: boolean;
    /**
     * 楽観的ロック用バージョン番号
     */
    rowVersion: number;
};

