/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WorkspaceTaskStatistics = {
    /**
     * コメント数
     */
    commentCount: number;
    /**
     * 総件数
     */
    totalCount: number;
    /**
     * 完了済み件数
     */
    completedCount: number;
    /**
     * 未完了件数
     */
    incompleteCount: number;
    /**
     * 期限切れ件数
     */
    overdueCount: number;
    /**
     * 今日締め切り件数
     */
    dueTodayCount: number;
    /**
     * 近日締め切り件数（7日以内）
     */
    dueSoonCount: number;
    /**
     * 破棄された件数
     */
    discardedCount: number;
};

