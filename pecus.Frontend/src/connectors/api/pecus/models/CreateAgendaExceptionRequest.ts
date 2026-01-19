/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * アジェンダ例外作成リクエスト（特定回の中止・変更）
 */
export type CreateAgendaExceptionRequest = {
    /**
     * 対象の元の開始日時（どの回かを特定）
     */
    originalStartAt: string;
    /**
     * この回を中止するか
     */
    isCancelled?: boolean;
    /**
     * 中止理由（IsCancelled=trueの場合）
     */
    cancellationReason?: string | null;
    /**
     * 変更後の開始日時（時間変更の場合）
     */
    modifiedStartAt?: string | null;
    /**
     * 変更後の終了日時
     */
    modifiedEndAt?: string | null;
    /**
     * 変更後のタイトル
     */
    modifiedTitle?: string | null;
    /**
     * 変更後の場所
     */
    modifiedLocation?: string | null;
    /**
     * 変更後のURL
     */
    modifiedUrl?: string | null;
    /**
     * 変更後の詳細
     */
    modifiedDescription?: string | null;
    /**
     * 参加者へ通知を送信するか
     */
    sendNotification?: boolean;
};

