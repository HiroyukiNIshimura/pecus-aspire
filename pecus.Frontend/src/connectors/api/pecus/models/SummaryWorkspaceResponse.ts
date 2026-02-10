/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkspaceMode } from './WorkspaceMode';
export type SummaryWorkspaceResponse = {
    /**
     * ワークスペースID
     */
    id: number;
    /**
     * ワークスペース名
     */
    name: string;
    /**
     * ワークスペースコード
     */
    code?: string | null;
    /**
     * ジャンルID
     */
    genreId?: number | null;
    /**
     * ジャンル名
     */
    genreName?: string | null;
    /**
     * ジャンルのアイコン（例: FontAwesome のクラス名）
     */
    genreIcon?: string | null;
    mode?: WorkspaceMode | null;
};

