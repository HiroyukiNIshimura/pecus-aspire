namespace Pecus.Libs.Mail.Templates.Models;

public class ItemCreatedEmailModel
{
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

public class ItemUpdatedEmailModel
{
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

    /// <summary>更新者名</summary>
    public string UpdatedByName { get; set; } = string.Empty;

    /// <summary>更新日時（JST表示想定）</summary>
    public DateTimeOffset UpdatedAt { get; set; }

    /// <summary>変更概要（任意）</summary>
    public string? ChangeSummary { get; set; }

    /// <summary>変更項目のリスト（任意）</summary>
    public List<string>? ChangedFields { get; set; }

    /// <summary>ワークスペース名</summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>ワークスペースコード</summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>アイテム詳細ページ URL</summary>
    public string ItemUrl { get; set; } = string.Empty;
}