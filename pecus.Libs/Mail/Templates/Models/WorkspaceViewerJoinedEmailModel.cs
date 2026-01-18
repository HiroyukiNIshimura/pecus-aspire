namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// ワークスペース閲覧者加入通知メールテンプレート用のモデル
/// </summary>
public class WorkspaceViewerJoinedEmailModel : EmailTemplateModelBase, IEmailTemplateModel<WorkspaceViewerJoinedEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "workspace-viewer-joined";

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
    /// 加入日時（JST 表示想定）
    /// </summary>
    public DateTimeOffset JoinedAt { get; set; }

    /// <summary>
    /// フロントエンドのワークスペース詳細ページ URL
    /// </summary>
    public string FrontendWorkspaceUrl { get; set; } = string.Empty;
}