using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// アイテム作成通知メールテンプレート用のモデル
/// </summary>
public class ItemCreatedEmailModel : EmailTemplateModelBase, IEmailTemplateModel<ItemCreatedEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "item-created";

    /// <summary>宛先ユーザー名（受信者表示名）</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>アイテムタイトル</summary>
    public string ItemTitle { get; set; } = string.Empty;

    /// <summary>アイテムコード / 識別子（任意）</summary>
    public string? ItemCode { get; set; }

    /// <summary>アイテム種別（任意）</summary>
    public string? ItemType { get; set; }

    /// <summary>チャンネル（任意）</summary>
    public string? Channel { get; set; }

    /// <summary>アイテム本文（プレーンテキスト）</summary>
    public string? BodyText { get; set; }

    /// <summary>アイテム本文（HTML）</summary>
    public string? BodyHtml { get; set; }

    /// <summary>作成者名</summary>
    public string CreatedByName { get; set; } = string.Empty;

    /// <summary>作成日時（JST表示想定）</summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>ワークスペース名</summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>ワークスペースコード</summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>アイテム詳細ページ URL</summary>
    public string ItemUrl { get; set; } = string.Empty;
}

/// <summary>
/// アイテム更新通知メールテンプレート用のモデル
/// </summary>
/// <remarks>
/// 全ての ActivityActionType に対応する統一テンプレート。
/// エフェクト内容は ActivityActionType に応じて変化する。
/// </remarks>
public class ItemUpdatedEmailModel : EmailTemplateModelBase, IEmailTemplateModel<ItemUpdatedEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "item-updated";

    /// <summary>宛先ユーザー名（受信者表示名）</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>アイテムタイトル（件名）</summary>
    public string ItemTitle { get; set; } = string.Empty;

    /// <summary>アイテムコード / 識別子</summary>
    public string ItemCode { get; set; } = string.Empty;

    /// <summary>アイテム種別（任意）</summary>
    public string? ItemType { get; set; }

    /// <summary>アイテム本文（プレーンテキスト、概要表示用）</summary>
    public string? BodyText { get; set; }

    /// <summary>アイテム本文（HTML、概要表示用）</summary>
    public string? BodyHtml { get; set; }

    /// <summary>
    /// アクティビティのリスト（複数の変更をまとめて通知可能）
    /// </summary>
    public List<ItemActivityEntry> Activities { get; set; } = [];

    /// <summary>ワークスペース名</summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>ワークスペースコード</summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>アイテム詳細ページ URL</summary>
    public string ItemUrl { get; set; } = string.Empty;
}

/// <summary>
/// アイテム更新通知に含まれる個別アクティビティエントリ
/// </summary>
public class ItemActivityEntry
{
    /// <summary>エフェクト内容（「件名が変更されました」など）</summary>
    public string EffectMessage { get; set; } = string.Empty;

    /// <summary>更新者名</summary>
    public string UpdatedByName { get; set; } = string.Empty;

    /// <summary>更新日時</summary>
    public DateTimeOffset UpdatedAt { get; set; }
}

/// <summary>
/// ActivityActionType から日本語のエフェクトメッセージを取得するヘルパー
/// </summary>
public static class ActivityEffectMessageHelper
{
    /// <summary>
    /// ActivityActionType に対応するエフェクトメッセージを取得
    /// </summary>
    /// <param name="actionType">アクション種類</param>
    /// <returns>日本語のエフェクトメッセージ</returns>
    public static string GetEffectMessage(ActivityActionType actionType)
    {
        return actionType switch
        {
            ActivityActionType.Created => "アイテムが作成されました",
            ActivityActionType.SubjectUpdated => "件名が変更されました",
            ActivityActionType.BodyUpdated => "本文が更新されました",
            ActivityActionType.FileAdded => "ファイルが追加されました",
            ActivityActionType.FileRemoved => "ファイルが削除されました",
            ActivityActionType.AssigneeChanged => "担当者が変更されました",
            ActivityActionType.RelationAdded => "関連が追加されました",
            ActivityActionType.RelationRemoved => "関連が削除されました",
            ActivityActionType.ArchivedChanged => "アーカイブ状態が変更されました",
            ActivityActionType.DraftChanged => "下書き状態が変更されました",
            ActivityActionType.CommitterChanged => "コミッターが変更されました",
            ActivityActionType.PriorityChanged => "優先度が変更されました",
            ActivityActionType.DueDateChanged => "期限が変更されました",
            ActivityActionType.TaskAdded => "タスクが追加されました",
            ActivityActionType.TaskCompleted => "タスクが完了しました",
            ActivityActionType.TaskDiscarded => "タスクが破棄されました",
            _ => "アイテムが更新されました"
        };
    }
}