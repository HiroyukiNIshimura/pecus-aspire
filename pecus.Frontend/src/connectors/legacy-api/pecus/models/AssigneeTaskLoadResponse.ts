/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 担当者の期限日別タスク負荷レスポンス
 */
export type AssigneeTaskLoadResponse = {
    /**
     * 担当ユーザーID
     */
    assignedUserId?: number;
    /**
     * 期限日（UTC, 日単位）
     */
    dueDate?: string;
    /**
     * しきい値（組織設定 TaskOverdueThreshold）
     */
    threshold?: number;
    /**
     * 現在の未完了・未破棄タスク数
     */
    activeTaskCount?: number;
    /**
     * 新規作成を含めた想定タスク数
     */
    projectedTaskCount?: number;
    /**
     * しきい値を超過しているか
     */
    isExceeded?: boolean;
    /**
     * 期限切れタスク数（組織全体）
     */
    overdueCount?: number;
    /**
     * 今日期限のタスク数（組織全体）
     */
    dueTodayCount?: number;
    /**
     * 今週期限のタスク数（組織全体）
     */
    dueThisWeekCount?: number;
    /**
     * 未完了タスク総数（組織全体）
     */
    totalActiveCount?: number;
    /**
     * 担当中のアイテム数（コンテキストスイッチ指標）
     */
    activeItemCount?: number;
    /**
     * 担当中のワークスペース数（コンテキストスイッチ指標）
     */
    activeWorkspaceCount?: number;
    /**
     * 負荷レベル: Low, Medium, High, Overloaded
     */
    workloadLevel?: string;
};

