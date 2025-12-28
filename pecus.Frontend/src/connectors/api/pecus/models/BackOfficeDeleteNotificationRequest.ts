/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * BackOffice用 システム通知削除リクエスト
 */
export type BackOfficeDeleteNotificationRequest = {
    /**
     * 配信済みメッセージも削除するか
     */
    deleteMessages?: boolean;
    /**
     * 楽観的ロック用バージョン番号
     */
    rowVersion: number;
};

