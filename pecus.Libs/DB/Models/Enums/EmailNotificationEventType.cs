namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// メール通知のイベント種別（配信フィルタリング判定用）
/// </summary>
public enum EmailNotificationEventType
{
    #region 自分宛て

    /// <summary>
    /// 自分へのメンション
    /// </summary>
    DirectMention = 1,

    /// <summary>
    /// 自分への返信依頼（NeedReply）
    /// </summary>
    DirectNeedReply = 2,

    /// <summary>
    /// 自分への督促（Urge / Reminder）
    /// </summary>
    DirectUrge = 3,

    /// <summary>
    /// ヘルプ要請（HelpWanted）
    /// </summary>
    DirectHelpWanted = 4,

    #endregion

    #region タスク

    /// <summary>
    /// 自分が担当するタスクの作成
    /// </summary>
    TaskAssignedCreated = 10,

    /// <summary>
    /// 自分が関係するタスクの完了
    /// </summary>
    TaskRelatedCompleted = 11,

    /// <summary>
    /// 自分が担当するタスクの期限超過
    /// </summary>
    TaskOverdue = 12,

    #endregion

    #region アイテム・PIN

    /// <summary>
    /// PIN留めしたアイテムの更新・タスク追加
    /// </summary>
    PinnedItemActivity = 20,

    /// <summary>
    /// 担当・コミット対象アイテムの更新
    /// </summary>
    AssignedItemUpdated = 21,

    /// <summary>
    /// アイテム本文の更新
    /// </summary>
    ItemBodyUpdated = 22,

    #endregion

    #region コメント

    /// <summary>
    /// 一般コメントの追加
    /// </summary>
    GeneralComment = 30,

    #endregion

    #region アジェンダ

    /// <summary>
    /// アジェンダへの招待・変更
    /// </summary>
    AgendaInvitationOrUpdate = 40,

    /// <summary>
    /// アジェンダの中止・リマインダー
    /// </summary>
    AgendaCancellationOrReminder = 41,

    #endregion

    #region ワークスペース

    /// <summary>
    /// ワークスペース全体の活動・メンバー変更
    /// </summary>
    WorkspaceActivity = 50,

    #endregion
}