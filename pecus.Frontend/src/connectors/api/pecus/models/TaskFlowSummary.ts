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
    totalCount: number | string;
    /**
     * 着手可能タスク数（先行タスクなし or 完了済み、かつ未完了・未破棄）
     */
    readyCount: number | string;
    /**
     * 待機中タスク数（先行タスク未完了）
     */
    waitingCount: number | string;
    /**
     * 進行中タスク数（進捗 &gt; 0 かつ未完了）
     */
    inProgressCount: number | string;
    /**
     * 完了タスク数
     */
    completedCount: number | string;
    /**
     * 破棄タスク数
     */
    discardedCount: number | string;
};

