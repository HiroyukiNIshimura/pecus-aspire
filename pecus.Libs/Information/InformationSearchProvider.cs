using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.Information.Models;
using Pecus.Libs.Utils;

namespace Pecus.Libs.Information;

/// <summary>
/// 情報検索プロバイダーの実装
/// pgroonga を使用してワークスペースアイテムをあいまい検索する
/// </summary>
public class InformationSearchProvider : IInformationSearchProvider
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<InformationSearchProvider> _logger;

    /// <summary>
    /// 本文スニペットの最大文字数
    /// </summary>
    private const int MaxSnippetLength = 200;

    /// <summary>
    /// InformationSearchProvider のコンストラクタ
    /// </summary>
    public InformationSearchProvider(
        ApplicationDbContext context,
        ILogger<InformationSearchProvider> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<InformationSearchResult> SearchAsync(
        int userId,
        string searchTopic,
        int limit = 5,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTopic))
        {
            return new InformationSearchResult { SearchTopic = searchTopic };
        }

        _logger.LogDebug(
            "情報検索開始: UserId={UserId}, Topic={Topic}",
            userId,
            searchTopic
        );

        // ユーザーがアクセス可能なワークスペースIDを取得
        var accessibleWorkspaceIds = await GetAccessibleWorkspaceIdsAsync(userId, cancellationToken);

        if (accessibleWorkspaceIds.Count == 0)
        {
            _logger.LogDebug("ユーザーがアクセス可能なワークスペースがありません: UserId={UserId}", userId);
            return new InformationSearchResult { SearchTopic = searchTopic };
        }

        // pgroonga クエリを構築
        var pgroongaQuery = PgroongaQueryBuilder.BuildQuery(searchTopic);

        if (string.IsNullOrEmpty(pgroongaQuery))
        {
            return new InformationSearchResult { SearchTopic = searchTopic };
        }

        // ワークスペースIDリストを SQL パラメータとして構築
        var workspaceIdList = string.Join(",", accessibleWorkspaceIds);

        // 検索結果取得クエリ（スコア順、上位N件のみ）
        // xmin はシステムカラムなので SELECT * では含まれない
        // DISTINCT と ORDER BY pgroonga_score() の併用は PostgreSQL の制約でエラーになるため
        // サブクエリで重複排除してから外側でスコア順にソート
#pragma warning disable EF1002
        var searchSql = $@"
            SELECT sub.""Id"" AS ""ItemId"",
                   sub.""WorkspaceId"",
                   w.""Code"" AS ""WorkspaceCode"",
                   sub.""Code"" AS ""ItemCode"",
                   sub.""Subject"",
                   LEFT(sub.""RawBody"", {MaxSnippetLength}) AS ""BodySnippet"",
                   sub.score AS ""Score""
            FROM (
                SELECT DISTINCT ON (wi.""Id"") wi.""Id"", wi.""WorkspaceId"", wi.""Code"", wi.""Subject"", wi.""RawBody"",
                       pgroonga_score(wi.tableoid, wi.ctid) AS score
                FROM ""WorkspaceItems"" wi
                LEFT JOIN ""WorkspaceItemTags"" wit ON wi.""Id"" = wit.""WorkspaceItemId""
                LEFT JOIN ""Tags"" t ON wit.""TagId"" = t.""Id"" AND t.""IsActive"" = true
                WHERE wi.""WorkspaceId"" = ANY(ARRAY[{workspaceIdList}])
                  AND wi.""IsArchived"" = false
                  AND wi.""IsDraft"" = false
                  AND (ARRAY[wi.""Subject"", wi.""RawBody"", wi.""Code""] &@~ {{0}} OR t.""Name"" &@~ {{0}})
                ORDER BY wi.""Id"", pgroonga_score(wi.tableoid, wi.ctid) DESC
            ) sub
            INNER JOIN ""Workspaces"" w ON sub.""WorkspaceId"" = w.""Id""
            ORDER BY sub.score DESC
            LIMIT {{1}}";

        var items = await _context.Database
            .SqlQueryRaw<InformationSearchItem>(searchSql, pgroongaQuery, limit)
            .ToListAsync(cancellationToken);
#pragma warning restore EF1002

        _logger.LogDebug(
            "情報検索完了: Topic={Topic}, ReturnedCount={ReturnedCount}",
            searchTopic,
            items.Count
        );

        return new InformationSearchResult
        {
            Items = items,
            SearchTopic = searchTopic,
        };
    }

    /// <summary>
    /// ユーザーがアクセス可能なワークスペースIDを取得
    /// </summary>
    private async Task<List<int>> GetAccessibleWorkspaceIdsAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        // ユーザーがメンバーとして参加しているワークスペースを取得
        var workspaceIds = await _context.WorkspaceUsers
            .Where(wu => wu.UserId == userId)
            .Select(wu => wu.WorkspaceId)
            .Distinct()
            .ToListAsync(cancellationToken);

        return workspaceIds;
    }
}
