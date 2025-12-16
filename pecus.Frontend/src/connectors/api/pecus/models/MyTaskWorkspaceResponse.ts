/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * マイタスクワークスペースレスポンス
 * ログインユーザーが担当のタスクを持つワークスペースの情報
 */
export type MyTaskWorkspaceResponse = {
    /**
     * リスト内での一意なインデックス（フロントエンドのReact key用）
     */
    listIndex?: number;
    /**
     * ワークスペースID
     */
    workspaceId: number;
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
    /**
     * ヘルプコメント数
     */
    helpCommentCount: number;
    /**
     * 督促コメント数
     */
    reminderCommentCount: number;
    /**
     * 最も古い期限日（ソート用、未完了タスクのみ対象）
     */
    oldestDueDate?: string | null;
};

