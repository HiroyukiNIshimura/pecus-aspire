using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部公開用アイテム一覧レスポンス
/// </summary>
public class ExternalItemListResponse
{
    /// <summary>
    /// ワークスペースコード
    /// </summary>
    [Required]
    public required string WorkspaceCode { get; set; }

    /// <summary>
    /// 総件数
    /// </summary>
    [Required]
    public int TotalCount { get; set; }

    /// <summary>
    /// 現在のページ
    /// </summary>
    [Required]
    public int CurrentPage { get; set; }

    /// <summary>
    /// ページあたりの件数
    /// </summary>
    [Required]
    public int PageSize { get; set; }

    /// <summary>
    /// 次ページの有無
    /// </summary>
    [Required]
    public bool HasNextPage { get; set; }

    /// <summary>
    /// アイテムの配列
    /// </summary>
    [Required]
    public required IReadOnlyList<ExternalItemResponse> Items { get; set; }
}
