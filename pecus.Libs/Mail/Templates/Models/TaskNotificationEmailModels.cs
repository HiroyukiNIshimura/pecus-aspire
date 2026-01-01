namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// タスク作成通知メールテンプレート用モデル
/// </summary>
public class TaskCreatedEmailModel : EmailTemplateModelBase, IEmailTemplateModel<TaskCreatedEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "task-created";

    /// <summary>宛先ユーザー名（受信者表示名）</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>タスクタイトル</summary>
    public string TaskTitle { get; set; } = string.Empty;

    /// <summary>タスクコード / 識別子（任意）</summary>
    public string? TaskCode { get; set; }

    /// <summary>優先度（High/Medium/Low 等の文字列表現）</summary>
    public string? Priority { get; set; }

    /// <summary>期限（任意）</summary>
    public DateTimeOffset? DueDate { get; set; }

    /// <summary>担当者名（任意）</summary>
    public string? AssigneeName { get; set; }

    /// <summary>作成者名</summary>
    public string CreatedByName { get; set; } = string.Empty;

    /// <summary>作成日時（JST表示想定）</summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>ワークスペース名</summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>ワークスペースコード</summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>タスク詳細ページ URL</summary>
    public string TaskUrl { get; set; } = string.Empty;
}

/// <summary>
/// タスク完了通知メールテンプレート用モデル
/// </summary>
public class TaskCompletedEmailModel : EmailTemplateModelBase, IEmailTemplateModel<TaskCompletedEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "task-completed";

    /// <summary>宛先ユーザー名（受信者表示名）</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>タスクタイトル</summary>
    public string TaskTitle { get; set; } = string.Empty;

    /// <summary>タスクコード / 識別子（任意）</summary>
    public string? TaskCode { get; set; }

    /// <summary>担当者名（任意）</summary>
    public string? AssigneeName { get; set; }

    /// <summary>完了者名（任意）</summary>
    public string? CompletedByName { get; set; }

    /// <summary>破棄の場合の理由</summary>
    public string? DiscardReason { get; set; }

    /// <summary>完了日時（JST表示想定）</summary>
    public DateTimeOffset CompletedAt { get; set; }

    /// <summary>ワークスペース名</summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>ワークスペースコード</summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>タスク詳細ページ URL</summary>
    public string TaskUrl { get; set; } = string.Empty;
}