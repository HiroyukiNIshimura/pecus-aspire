using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.Common;

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
