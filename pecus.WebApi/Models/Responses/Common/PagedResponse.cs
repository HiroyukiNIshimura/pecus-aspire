using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Common;

/// <summary>
/// ページネーション付きレスポンス
/// </summary>
/// <typeparam name="T">データの型</typeparam>
public class PagedResponse<T>
{
    /// <summary>
    /// データのリスト
    /// </summary>
    [Required]
    public required IEnumerable<T> Data { get; set; }

    /// <summary>
    /// 現在のページ番号（1から始まる）
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// 1ページあたりのアイテム数
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// 総アイテム数
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// 総ページ数
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// 前のページが存在するか
    /// </summary>
    public bool HasPreviousPage { get; set; }

    /// <summary>
    /// 次のページが存在するか
    /// </summary>
    public bool HasNextPage { get; set; }
}