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
     * リスト内での一意なインデックス（フロントエンドのReact key用）
     */
    listIndex?: number | string;
    /**
     * ワークスペースID
     */
    workspaceId: number | string;
    /**
     * ワークスペースコード
     */
    workspaceCode: string;
    /**
     * ワークスペース名
     */
    workspaceName: string;
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
    itemCount: number | string;
    /**
     * 未完了タスク数
     */
    activeTaskCount: number | string;
    /**
     * 完了済みタスク数
     */
    completedTaskCount: number | string;
    /**
     * 期限超過タスク数
     */
    overdueTaskCount: number | string;
    /**
     * ヘルプコメント数
     */
    helpCommentCount: number | string;
    /**
     * 督促コメント数
     */
    reminderCommentCount: number | string;
    /**
     * 最も古い期限日（ソート用、未完了タスクのみ対象）
     */
    oldestDueDate?: string | null;
};

