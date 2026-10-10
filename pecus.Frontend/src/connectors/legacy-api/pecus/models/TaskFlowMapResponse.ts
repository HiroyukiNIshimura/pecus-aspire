/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskFlowNode } from './TaskFlowNode';
import type { TaskFlowSummary } from './TaskFlowSummary';
/**
 * タスクフローマップレスポンス
 * アイテム内のタスク依存関係を可視化するためのデータ
 */
export type TaskFlowMapResponse = {
    /**
     * クリティカルパス（合計所要期間が最長の依存チェーン）
     * 期間は各タスクの StartDate（なければ前タスクの DueDate、最初のタスクなら CreatedAt）から DueDate までの日数を合計して算出
     */
    criticalPath: Array<TaskFlowNode>;
    /**
     * その他の依存チェーン（クリティカルパス以外）
     */
    otherChains: Array<Array<TaskFlowNode>>;
    /**
     * 独立タスク（依存関係なし）
     */
    independentTasks: Array<TaskFlowNode>;
    summary: TaskFlowSummary;
};

