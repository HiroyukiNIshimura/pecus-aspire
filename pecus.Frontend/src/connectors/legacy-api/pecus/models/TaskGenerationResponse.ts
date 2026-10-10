/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GeneratedTaskCandidate } from './GeneratedTaskCandidate';
/**
 * タスク生成AIの応答
 */
export type TaskGenerationResponse = {
    /**
     * 生成されたタスク候補
     */
    candidates: Array<GeneratedTaskCandidate>;
    /**
     * プロジェクト全体の推定期間（日数）
     */
    totalEstimatedDays?: number;
    /**
     * クリティカルパスの説明
     */
    criticalPathDescription?: string | null;
    /**
     * AIからの提案・注意事項
     */
    suggestions?: Array<string>;
};

