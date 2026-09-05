namespace Pecus.Libs.DB.Models;

/// <summary>
/// カスタムメール通知設定（JSONB値オブジェクト）
/// </summary>
public class EmailNotificationCustomSettings
{
    #region 自分宛て

    /// <summary>
    /// 自分へのメンション
    /// </summary>
    public bool DirectMention { get; set; } = true;

    /// <summary>
    /// 自分への返信依頼（NeedReply）
    /// </summary>
    public bool DirectNeedReply { get; set; } = true;

    /// <summary>
    /// 自分への督促（Urge / Reminder）
    /// </summary>
    public bool DirectUrge { get; set; } = true;

    /// <summary>
    /// ヘルプ要請（HelpWanted）
    /// </summary>
    public bool DirectHelpWanted { get; set; } = true;

    #endregion

    #region タスク

    /// <summary>
    /// 自分が担当するタスクの作成
    /// </summary>
    public bool TaskAssignedCreated { get; set; } = true;

    /// <summary>
    /// 自分が関係するタスクの完了
    /// </summary>
    public bool TaskRelatedCompleted { get; set; } = true;

    /// <summary>
    /// 自分が担当するタスクの期限超過
    /// </summary>
    public bool TaskOverdue { get; set; } = true;

    #endregion

    #region アイテム・PIN

    /// <summary>
    /// PIN留めしたアイテムの更新・タスク追加
    /// </summary>
    public bool PinnedItemActivity { get; set; } = true;

    /// <summary>
    /// 担当・コミット対象アイテムの更新
    /// </summary>
    public bool AssignedItemUpdated { get; set; } = false;

    /// <summary>
    /// アイテム本文の更新
    /// </summary>
    public bool ItemBodyUpdated { get; set; } = false;

    #endregion

    #region コメント

    /// <summary>
    /// 一般コメントの追加
    /// </summary>
    public bool GeneralComment { get; set; } = false;

    #endregion

    #region アジェンダ

    /// <summary>
    /// アジェンダへの招待・変更
    /// </summary>
    public bool AgendaInvitationOrUpdate { get; set; } = true;

    /// <summary>
    /// アジェンダの中止・リマインダー
    /// </summary>
    public bool AgendaCancellationOrReminder { get; set; } = true;

    #endregion

    #region ワークスペース

    /// <summary>
    /// ワークスペース全体の活動・メンバー変更
    /// </summary>
    public bool WorkspaceActivity { get; set; } = false;

    #endregion
}