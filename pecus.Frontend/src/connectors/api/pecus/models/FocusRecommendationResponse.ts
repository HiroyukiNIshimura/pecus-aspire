/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FocusTaskResponse } from './FocusTaskResponse';
/**
 * フォーカス推奨レスポンス
 */
export type FocusRecommendationResponse = {
    /**
     * 今すぐ取り組むべきタスク（先行タスクなし or 完了済み、スコア上位）
     */
    focusTasks: Array<FocusTaskResponse>;
    /**
     * 今は着手できないタスク（先行タスク未完了）
     */
    waitingTasks: Array<FocusTaskResponse>;
    /**
     * 対象タスクの総数
     */
    totalTaskCount: number;
    /**
     * レスポンス生成日時
     */
    generatedAt: string;
};

