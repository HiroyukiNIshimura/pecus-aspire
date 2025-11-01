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

/// <summary>
/// ページネーション付きレスポンス（統計情報付き）
/// </summary>
/// <typeparam name="T">データの型</typeparam>
/// <typeparam name="TSummary">統計情報の型</typeparam>
public class PagedResponse<T, TSummary> : PagedResponse<T>
{
    /// <summary>
    /// リストデータの統計情報
    /// </summary>
    public TSummary? Summary { get; set; }
}
