/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserItem } from './UserItem';
/**
 * アジェンダ例外レスポンス（特定回の中止・変更）
 */
export type AgendaExceptionResponse = {
    /**
     * 例外ID
     */
    id: number;
    /**
     * 親アジェンダID
     */
    agendaId: number;
    /**
     * 対象の元の開始日時（どの回かを特定）
     */
    originalStartAt: string;
    /**
     * この回は中止か
     */
    isCancelled?: boolean;
    /**
     * 中止理由
     */
    cancellationReason?: string | null;
    /**
     * 変更後の開始日時
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
     * 作成日時
     */
    createdAt?: string;
    createdByUser?: UserItem;
};

