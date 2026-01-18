/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HealthAnalysisScope } from './HealthAnalysisScope';
import type { HealthAnalysisType } from './HealthAnalysisType';
/**
 * 健康診断リクエスト
 */
export type HealthAnalysisRequest = {
    scope: HealthAnalysisScope;
    /**
     * ワークスペースID（Scope が Workspace の場合に必須）
     */
    workspaceId?: number | null;
    analysisType: HealthAnalysisType;
};

