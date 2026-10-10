/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * カスタムメール通知設定（JSONB値オブジェクト）
 */
export type EmailNotificationCustomSettings = {
    /**
     * 自分へのメンション
     */
    directMention?: boolean;
    /**
     * 自分への返信依頼（NeedReply）
     */
    directNeedReply?: boolean;
    /**
     * 自分への督促（Urge / Reminder）
     */
    directUrge?: boolean;
    /**
     * ヘルプ要請（HelpWanted）
     */
    directHelpWanted?: boolean;
    /**
     * 自分が担当するタスクの作成
     */
    taskAssignedCreated?: boolean;
    /**
     * 自分が関係するタスクの完了
     */
    taskRelatedCompleted?: boolean;
    /**
     * 自分が担当するタスクの期限超過
     */
    taskOverdue?: boolean;
    /**
     * PIN留めしたアイテムの更新・タスク追加
     */
    pinnedItemActivity?: boolean;
    /**
     * 担当・コミット対象アイテムの更新
     */
    assignedItemUpdated?: boolean;
    /**
     * アイテム本文の更新
     */
    itemBodyUpdated?: boolean;
    /**
     * 一般コメントの追加
     */
    generalComment?: boolean;
    /**
     * アジェンダへの招待・変更
     */
    agendaInvitationOrUpdate?: boolean;
    /**
     * アジェンダの中止・リマインダー
     */
    agendaCancellationOrReminder?: boolean;
    /**
     * ワークスペース全体の活動・メンバー変更
     */
    workspaceActivity?: boolean;
};

