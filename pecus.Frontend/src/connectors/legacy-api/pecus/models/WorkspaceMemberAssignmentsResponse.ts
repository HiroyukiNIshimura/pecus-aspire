/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignedItemInfo } from './AssignedItemInfo';
import type { AssignedTaskInfo } from './AssignedTaskInfo';
/**
 * ワークスペースメンバーが担当しているタスク/アイテムの情報
 * Viewer変更前のチェック用
 */
export type WorkspaceMemberAssignmentsResponse = {
    /**
     * 未完了タスク担当（タスク詳細へのリンク用）
     */
    assignedTasks?: Array<AssignedTaskInfo>;
    /**
     * アイテム担当者（アイテム詳細へのリンク用）
     */
    assignedItems?: Array<AssignedItemInfo>;
    /**
     * コミッター（アイテム詳細へのリンク用）
     */
    committerItems?: Array<AssignedItemInfo>;
    /**
     * オーナー（アイテム詳細へのリンク用）
     */
    ownerItems?: Array<AssignedItemInfo>;
    /**
     * 担当があるかどうか
     */
    hasAssignments?: boolean;
};

