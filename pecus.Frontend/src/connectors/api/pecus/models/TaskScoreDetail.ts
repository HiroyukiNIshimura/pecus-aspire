/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * タスクスコア詳細（デバッグ・説明用）
 */
export type TaskScoreDetail = {
    /**
     * 優先度スコア（1-4）
     */
    priorityScore: number;
    /**
     * 期限スコア（1-10）
     */
    deadlineScore: number;
    /**
     * 後続タスク影響スコア（0-10）
     */
    successorImpactScore: number;
    /**
     * 優先度の重み（デフォルト: 2）
     */
    priorityWeight: number;
    /**
     * 期限の重み（デフォルト: 3）
     */
    deadlineWeight: number;
    /**
     * 後続影響の重み（デフォルト: 5）
     */
    successorImpactWeight: number;
    /**
     * スコア計算式の説明
     */
    explanation?: string | null;
};

