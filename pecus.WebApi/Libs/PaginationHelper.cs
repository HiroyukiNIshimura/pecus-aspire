using Microsoft.EntityFrameworkCore;
using Pecus.Models.Responses.Common;

namespace Pecus.Libs;

/// <summary>
/// ページネーションヘルパー
/// </summary>
public static class PaginationHelper
{
    /// <summary>
    /// クエリにページネーションを適用
    /// </summary>
    public static async Task<List<T>> ApplyPaginationAsync<T>(
        IQueryable<T> query,
        int page,
        int pageSize
    )
    {
        var skip = (page - 1) * pageSize;
        return await query.Skip(skip).Take(pageSize).ToListAsync();
    }

    /// <summary>
    /// ページネーション付きレスポンスを作成
    /// </summary>
    public static PagedResponse<T> CreatePagedResponse<T>(
        IEnumerable<T> data,
        int totalCount,
        int page,
        int pageSize
    )
    {
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResponse<T>
        {
            Data = data,
            CurrentPage = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            HasPreviousPage = page > 1,
            HasNextPage = page < totalPages,
        };
    }

    /// <summary>
    /// ページ番号を検証
    /// </summary>
    public static int ValidatePageNumber(int? page) =>
        page.HasValue && page.Value > 0 ? page.Value : 1;
}
