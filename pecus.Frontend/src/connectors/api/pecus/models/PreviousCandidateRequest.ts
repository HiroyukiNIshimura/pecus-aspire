/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 前回の候補情報（イテレーション用）
 */
export type PreviousCandidateRequest = {
    /**
     * タスク内容
     */
    content: string;
    /**
     * 採用されたかどうか
     */
    isAccepted?: boolean;
    /**
     * 却下理由（却下の場合）
     */
    rejectionReason?: string | null;
};

