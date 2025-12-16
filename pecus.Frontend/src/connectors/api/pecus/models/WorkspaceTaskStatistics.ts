/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WorkspaceTaskStatistics = {
    /**
     * コメント数
     */
    commentCount: number | string;
    /**
     * 総件数
     */
    totalCount: number | string;
    /**
     * 完了済み件数
     */
    completedCount: number | string;
    /**
     * 未完了件数
     */
    incompleteCount: number | string;
    /**
     * 期限切れ件数
     */
    overdueCount: number | string;
    /**
     * 今日締め切り件数
     */
    dueTodayCount: number | string;
    /**
     * 近日締め切り件数（7日以内）
     */
    dueSoonCount: number | string;
    /**
     * 破棄された件数
     */
    discardedCount: number | string;
};

