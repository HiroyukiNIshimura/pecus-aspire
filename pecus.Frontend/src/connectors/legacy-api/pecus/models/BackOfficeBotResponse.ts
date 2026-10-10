/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BotType } from './BotType';
/**
 * BackOffice用 ボットレスポンス（Persona/Constraint編集用）
 */
export type BackOfficeBotResponse = {
    /**
     * ボットID
     */
    id: number;
    /**
     * ボット名
     */
    name: string;
    type: BotType;
    /**
     * ペルソナ（ボットの性格・役割設定）
     */
    persona?: string | null;
    /**
     * 行動指針（制約条件）
     */
    constraint?: string | null;
    /**
     * ボットのアイコンURL
     */
    iconUrl?: string | null;
    /**
     * 作成日時
     */
    createdAt: string;
    /**
     * 更新日時
     */
    updatedAt: string;
    /**
     * 楽観ロック用 RowVersion
     */
    rowVersion: number;
};

