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
     * クリティカルパス（最長の依存チェーン）
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

