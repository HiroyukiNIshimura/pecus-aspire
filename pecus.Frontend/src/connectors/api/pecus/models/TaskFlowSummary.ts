/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * タスクフローマップのサマリ情報
 */
export type TaskFlowSummary = {
    /**
     * 総タスク数
     */
    totalCount: number;
    /**
     * 着手可能タスク数（先行タスクなし or 完了済み、かつ未完了・未破棄）
     */
    readyCount: number;
    /**
     * 待機中タスク数（先行タスク未完了）
     */
    waitingCount: number;
    /**
     * 進行中タスク数（進捗 > 0 かつ未完了）
     */
    inProgressCount: number;
    /**
     * 完了タスク数
     */
    completedCount: number;
    /**
     * 破棄タスク数
     */
    discardedCount: number;
};

