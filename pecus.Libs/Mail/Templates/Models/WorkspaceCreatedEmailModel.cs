namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// ワークスペース作成通知メールテンプレート用モデル
/// </summary>
public class WorkspaceCreatedEmailModel : IEmailTemplateModel<WorkspaceCreatedEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "workspace-created";

    /// <summary>宛先ユーザー名（受信者表示名）</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>ワークスペース名</summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>ワークスペースコード</summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>ワークスペースカテゴリ名（任意）</summary>
    public string? CategoryName { get; set; }

    /// <summary>ワークスペース説明（任意）</summary>
    public string? Description { get; set; }

    /// <summary>作成者名</summary>
    public string CreatedByName { get; set; } = string.Empty;

    /// <summary>作成日時（JST表示想定）</summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>組織名</summary>
    public string OrganizationName { get; set; } = string.Empty;

    /// <summary>ワークスペース詳細ページ URL</summary>
    public string WorkspaceUrl { get; set; } = string.Empty;
}