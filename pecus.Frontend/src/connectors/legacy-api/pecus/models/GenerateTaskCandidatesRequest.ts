/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PreviousCandidateRequest } from './PreviousCandidateRequest';
/**
 * タスク候補生成リクエスト
 */
export type GenerateTaskCandidatesRequest = {
    /**
     * プロジェクト開始日
     */
    startDate: string;
    /**
     * プロジェクト完了日（アイテムのDueDateと異なる場合）
     */
    endDate?: string | null;
    /**
     * 追加のコンテキスト情報（ユーザーからの補足）
     */
    additionalContext?: string | null;
    /**
     * 前回の生成結果へのフィードバック（イテレーション用）
     */
    feedback?: string | null;
    /**
     * 前回生成されたタスク候補（イテレーション用）
     */
    previousCandidates?: Array<PreviousCandidateRequest> | null;
};

