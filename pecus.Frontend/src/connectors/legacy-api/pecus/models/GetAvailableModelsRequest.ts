/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GenerativeApiVendor } from './GenerativeApiVendor';
/**
 * 利用可能なAIモデル一覧取得リクエスト
 */
export type GetAvailableModelsRequest = {
    /**
     * APIキー
     */
    apiKey: string;
    vendor: GenerativeApiVendor;
};

