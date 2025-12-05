/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * マイコミッターワークスペースレスポンス
 * ログインユーザーがコミッターになっているアイテムを持つワークスペースの情報
 */
export type MyCommitterWorkspaceResponse = {
    /**
     * ワークスペースID
     */
    workspaceId: number;
    /**
     * ワークスペースコード
     */
    workspaceCode: string | null;
    /**
     * ワークスペース名
     */
    workspaceName: string | null;
    /**
     * ジャンルアイコン
     */
    genreIcon?: string | null;
    /**
     * ジャンル名
     */
    genreName?: string | null;
    /**
     * コミッターになっているアイテム数
     */
    itemCount: number;
    /**
     * 未完了タスク数
     */
    activeTaskCount: number;
    /**
     * 完了済みタスク数
     */
    completedTaskCount: number;
    /**
     * 期限超過タスク数
     */
    overdueTaskCount: number;
};

