namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// ワークスペース加入通知メールテンプレート用のモデル
/// </summary>
public class WorkspaceJoinedEmailModel : EmailTemplateModelBase, IEmailTemplateModel<WorkspaceJoinedEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "workspace-joined";

    /// <summary>
    /// 加入者のユーザー名
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペースコード（URL 等で使用）
    /// </summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>
    /// 招待者の名前（任意）
    /// </summary>
    public string? InviterName { get; set; }

    /// <summary>
    /// 加入日時（JST 表示想定）
    /// </summary>
    public DateTimeOffset JoinedAt { get; set; }

    /// <summary>
    /// フロントエンドのワークスペース詳細ページ URL
    /// </summary>
    public string FrontendWorkspaceUrl { get; set; } = string.Empty;
}