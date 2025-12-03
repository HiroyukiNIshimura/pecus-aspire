/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペースアイテム属性更新リクエスト
 */
export type UpdateWorkspaceItemAttributeRequest = {
    /**
     * 更新する値（属性に応じた型を JSON 形式で送信。null で値をクリア）
     */
    value?: any;
    /**
     * 楽観的ロック用バージョン
     */
    rowVersion: number;
};

