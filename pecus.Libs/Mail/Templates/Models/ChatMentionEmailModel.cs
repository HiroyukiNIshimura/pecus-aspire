namespace Pecus.Libs.Mail.Templates.Models;

/// <summary>
/// チャットメンション通知メールテンプレート用モデル
/// </summary>
public class ChatMentionEmailModel : EmailTemplateModelBase, IEmailTemplateModel<ChatMentionEmailModel>
{
    /// <inheritdoc />
    public static string TemplateName => "chat-mention";

    /// <summary>宛先ユーザー名（受信者表示名）</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>メンションしたユーザー名</summary>
    public string MentionedByName { get; set; } = string.Empty;

    /// <summary>チャットルーム名</summary>
    public string RoomName { get; set; } = string.Empty;

    /// <summary>メッセージ本文のプレビュー</summary>
    public string MessagePreview { get; set; } = string.Empty;

    /// <summary>メンション日時（JST表示想定）</summary>
    public DateTimeOffset MentionedAt { get; set; }

    /// <summary>ワークスペース名</summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>ワークスペースコード</summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>チャットルーム詳細ページ URL</summary>
    public string ChatUrl { get; set; } = string.Empty;

    /// <summary>組織名</summary>
    public string OrganizationName { get; set; } = string.Empty;
}
