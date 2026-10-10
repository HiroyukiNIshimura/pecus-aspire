/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HealthAnalysisScope } from './HealthAnalysisScope';
import type { HealthAnalysisType } from './HealthAnalysisType';
/**
 * 健康診断レスポンス
 */
export type HealthAnalysisResponse = {
    analysisType: HealthAnalysisType;
    scope: HealthAnalysisScope;
    /**
     * ワークスペースID（Scope が Workspace の場合）
     */
    workspaceId?: number | null;
    /**
     * ワークスペース名（Scope が Workspace の場合）
     */
    workspaceName?: string | null;
    /**
     * 生成AIによる診断結果
     */
    analysis: string;
    /**
     * 診断生成日時
     */
    generatedAt: string;
};

