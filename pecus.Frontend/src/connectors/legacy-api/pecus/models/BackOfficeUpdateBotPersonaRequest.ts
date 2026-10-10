/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * BackOffice用 ボットのPersona/Constraint更新リクエスト
 */
export type BackOfficeUpdateBotPersonaRequest = {
    /**
     * ペルソナ（ボットの性格・役割設定）
     */
    persona?: string | null;
    /**
     * 行動指針（制約条件）
     */
    constraint?: string | null;
    /**
     * 楽観ロック用 RowVersion
     */
    rowVersion: number;
};

