/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JsonElement } from './JsonElement';
/**
 * ワークスペースアイテム属性更新リクエスト
 */
export type UpdateWorkspaceItemAttributeRequest = {
    value?: JsonElement;
    /**
     * 楽観的ロック用バージョン
     */
    rowVersion: number;
};

