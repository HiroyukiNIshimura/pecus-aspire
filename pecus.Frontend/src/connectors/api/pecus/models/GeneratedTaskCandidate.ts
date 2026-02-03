/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EstimatedSize } from './EstimatedSize';
/**
 * AIが生成するタスク候補
 */
export type GeneratedTaskCandidate = {
    /**
     * 一時的なID（フロント管理用）
     */
    tempId: string;
    /**
     * タスク内容
     */
    content: string;
    /**
     * タスクタイプID（AIがTaskTypeテーブルから選択）
     */
    suggestedTaskTypeId?: number | null;
    /**
     * タスクタイプ選択理由（AIが判断根拠を説明）
     */
    taskTypeRationale?: string | null;
    /**
     * AIが推奨する担当者ユーザーID（nullの場合はリクエストユーザーにフォールバック）
     */
    suggestedAssigneeId?: number | null;
    /**
     * 担当者選択理由（AIが判断根拠を説明）
     */
    assigneeRationale?: string | null;
    estimatedSize?: EstimatedSize;
    /**
     * 先行タスクの一時ID（依存関係）
     */
    predecessorTempIds?: Array<string>;
    /**
     * クリティカルパス上か
     */
    isOnCriticalPath?: boolean;
    /**
     * 並行作業可能か
     */
    canParallelize?: boolean;
    /**
     * 推奨開始日（プロジェクト開始からの相対日数）
     */
    suggestedStartDayOffset?: number;
    /**
     * 推奨期間（日数）
     */
    suggestedDurationDays?: number;
    /**
     * AIによる補足説明
     */
    rationale?: string | null;
};

