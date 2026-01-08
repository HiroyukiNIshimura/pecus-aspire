namespace Pecus.Libs.Information.Models;

/// <summary>
/// 情報検索結果
/// </summary>
public class InformationSearchResult
{
    /// <summary>
    /// 検索にヒットしたアイテム情報
    /// </summary>
    public List<InformationSearchItem> Items { get; set; } = [];

    /// <summary>
    /// 検索キーワード
    /// </summary>
    public string SearchTopic { get; set; } = string.Empty;
}

/// <summary>
/// 検索結果のアイテム情報
/// </summary>
public class InformationSearchItem
{
    /// <summary>
    /// ワークスペースアイテムID
    /// </summary>
    public int ItemId { get; set; }

    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>
    /// アイテムコード
    /// </summary>
    public string ItemCode { get; set; } = string.Empty;

    /// <summary>
    /// アイテム件名
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// アイテム本文（検索スニペット用に一部抽出）
    /// </summary>
    public string? BodySnippet { get; set; }

    /// <summary>
    /// 検索スコア（pgroonga のスコア）
    /// </summary>
    public double Score { get; set; }
}