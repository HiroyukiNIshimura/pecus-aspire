namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// 督促コメント（リマインダー）通知メールテンプレート用モデル
/// </summary>
public class ReminderCommentEmailModel : EmailTemplateModelBase, IEmailTemplateModel<ReminderCommentEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "reminder-comment";

    /// <summary>宛先ユーザー名（受信者表示名）</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>督促を送ったユーザー名</summary>
    public string RemindedByName { get; set; } = string.Empty;

    /// <summary>関連アイテムのタイトル</summary>
    public string ItemTitle { get; set; } = string.Empty;

    /// <summary>アイテムコード / 識別子（任意）</summary>
    public string? ItemCode { get; set; }

    /// <summary>タスク内容</summary>
    public string TaskContent { get; set; } = string.Empty;

    /// <summary>タスク優先度（High/Medium/Low 等の文字列表現）</summary>
    public string? TaskPriority { get; set; }

    /// <summary>タスク担当者名（任意）</summary>
    public string? TaskAssigneeName { get; set; }

    /// <summary>コメント本文</summary>
    public string CommentBody { get; set; } = string.Empty;

    /// <summary>コメント投稿日時（JST表示想定）</summary>
    public DateTimeOffset CommentedAt { get; set; }

    /// <summary>タスク期限（任意）</summary>
    public DateTimeOffset? TaskDueDate { get; set; }

    /// <summary>ワークスペース名</summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>ワークスペースコード</summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>アイテム詳細ページ URL</summary>
    public string ItemUrl { get; set; } = string.Empty;

    /// <summary>組織名</summary>
    public string OrganizationName { get; set; } = string.Empty;
}