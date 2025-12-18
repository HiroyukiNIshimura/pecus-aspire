namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// ワークスペース削除通知メールテンプレート用モデル
/// </summary>
public class WorkspaceDeletedEmailModel : IEmailTemplateModel<WorkspaceDeletedEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "workspace-deleted";

    /// <summary>宛先ユーザー名（受信者表示名）</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>削除されたワークスペース名</summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>ワークスペースコード</summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>ワークスペースカテゴリ名（任意）</summary>
    public string? CategoryName { get; set; }

    /// <summary>削除者名</summary>
    public string DeletedByName { get; set; } = string.Empty;

    /// <summary>削除日時（JST表示想定）</summary>
    public DateTimeOffset DeletedAt { get; set; }

    /// <summary>組織名</summary>
    public string OrganizationName { get; set; } = string.Empty;

    /// <summary>削除理由（任意）</summary>
    public string? DeletionReason { get; set; }

    /// <summary>バックアップ・復旧に関する案内（任意）</summary>
    public string? BackupInfo { get; set; }
}