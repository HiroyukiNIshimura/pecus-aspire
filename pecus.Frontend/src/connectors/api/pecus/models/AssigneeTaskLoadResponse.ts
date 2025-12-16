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
};

