namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// アクティビティのアクション種類を表す列挙型
/// </summary>
public enum ActivityActionType
{
    /// <summary>
    /// 作成
    /// </summary>
    Created,
    /// <summary>
    /// 件名更新
    /// </summary>
    SubjectUpdated,
    /// <summary>
    /// 本文更新
    /// </summary>
    BodyUpdated,
    /// <summary>
    /// ファイル追加
    /// </summary>
    FileAdded,
    /// <summary>
    /// ファイル削除
    /// </summary>
    FileRemoved,

    /// <summary>
    /// ステータス変更
    /// </summary>
    StatusChanged,
    /// <summary>
    /// 担当者変更
    /// </summary>
    AssigneeChanged,
    /// <summary>
    /// 関連追加
    /// </summary>
    RelationAdded,
    /// <summary>
    /// 関連削除
    /// </summary>
    RelationRemoved,
    /// <summary>
    /// アーカイブ状態変更
    /// </summary>
    ArchivedChanged,
    /// <summary>
    /// 下書き状態変更
    /// </summary>
    DraftChanged,
    /// <summary>
    /// コミッター変更
    /// </summary>
    CommitterChanged,
    /// <summary>
    /// 優先度変更
    /// </summary>
    PriorityChanged,
    /// <summary>
    /// 期限変更
    /// </summary>
    DueDateChanged
}