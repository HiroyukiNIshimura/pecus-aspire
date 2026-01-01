namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// ワークスペース更新通知メールテンプレート用モデル
/// </summary>
public class WorkspaceUpdatedEmailModel : EmailTemplateModelBase, IEmailTemplateModel<WorkspaceUpdatedEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "workspace-updated";

    /// <summary>宛先ユーザー名（受信者表示名）</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>ワークスペース名</summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>ワークスペースコード</summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>更新者名</summary>
    public string UpdatedByName { get; set; } = string.Empty;

    /// <summary>更新日時（JST表示想定）</summary>
    public DateTimeOffset UpdatedAt { get; set; }

    /// <summary>変更内容のリスト（例: "名前を変更", "カテゴリを変更"）</summary>
    public List<string> Changes { get; set; } = new();

    /// <summary>旧ワークスペース名（名前変更時のみ）</summary>
    public string? OldWorkspaceName { get; set; }

    /// <summary>新ワークスペース名（名前変更時のみ）</summary>
    public string? NewWorkspaceName { get; set; }

    /// <summary>旧カテゴリ名（カテゴリ変更時のみ）</summary>
    public string? OldCategoryName { get; set; }

    /// <summary>新カテゴリ名（カテゴリ変更時のみ）</summary>
    public string? NewCategoryName { get; set; }

    /// <summary>旧説明（説明変更時のみ）</summary>
    public string? OldDescription { get; set; }

    /// <summary>新説明（説明変更時のみ）</summary>
    public string? NewDescription { get; set; }

    /// <summary>組織名</summary>
    public string OrganizationName { get; set; } = string.Empty;

    /// <summary>ワークスペース詳細ページ URL</summary>
    public string WorkspaceUrl { get; set; } = string.Empty;
}