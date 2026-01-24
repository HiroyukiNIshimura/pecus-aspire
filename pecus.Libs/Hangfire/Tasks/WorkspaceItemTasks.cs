using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.Lexical;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// ワークスペースアイテム関連のHangfireタスク
/// </summary>
public class WorkspaceItemTasks
{
    private readonly ApplicationDbContext _context;
    private readonly ILexicalConverterService _lexicalConverter;
    private readonly ILogger<WorkspaceItemTasks> _logger;

    /// <summary>
    /// WorkspaceItemTasks のコンストラクタ
    /// </summary>
    /// <param name="context">DBコンテキスト</param>
    /// <param name="lexicalConverter">Lexical変換サービス</param>
    /// <param name="logger">ロガー</param>
    public WorkspaceItemTasks(
        ApplicationDbContext context,
        ILexicalConverterService lexicalConverter,
        ILogger<WorkspaceItemTasks> logger)
    {
        _context = context;
        _lexicalConverter = lexicalConverter;
        _logger = logger;
    }

    /// <summary>
    /// ワークスペースアイテムの検索インデックス（RawBody）を更新する
    /// </summary>
    /// <param name="workspaceItemId">対象のワークスペースアイテムID</param>
    /// <remarks>
    /// Body から Lexical JSON をパースしてプレーンテキストを抽出し、
    /// WorkspaceItemSearchIndices テーブルに Upsert します。
    /// アイテムが存在しない場合はスキップします。
    /// </remarks>
    public async Task UpdateSearchIndexAsync(int workspaceItemId)
    {
        _logger.LogInformation(
            "Updating SearchIndex for WorkspaceItem {WorkspaceItemId}",
            workspaceItemId
        );

        try
        {
            // タグを含めて取得（FullText 構築に必要）
            var item = await _context.WorkspaceItems
                .AsNoTracking()
                .Include(wi => wi.WorkspaceItemTags)
                    .ThenInclude(wit => wit.Tag)
                .FirstOrDefaultAsync(wi => wi.Id == workspaceItemId);

            if (item == null)
            {
                _logger.LogInformation(
                    "WorkspaceItem {WorkspaceItemId} not found. Skipping SearchIndex update.",
                    workspaceItemId
                );
                return;
            }

            // gRPC サービス経由で Body からプレーンテキストを抽出
            var result = await _lexicalConverter.ToPlainTextAsync(item.Body ?? string.Empty);

            if (!result.Success)
            {
                _logger.LogError(
                    "Failed to convert Lexical JSON to plain text for WorkspaceItem {WorkspaceItemId}: {ErrorMessage}",
                    workspaceItemId,
                    result.ErrorMessage
                );
                throw new InvalidOperationException($"Lexical conversion failed: {result.ErrorMessage}");
            }

            if (result.UnknownNodes.Count > 0)
            {
                _logger.LogWarning(
                    "Unknown nodes detected for WorkspaceItem {WorkspaceItemId}: {UnknownNodes}",
                    workspaceItemId,
                    string.Join(", ", result.UnknownNodes)
                );
            }

            var rawBody = result.Result ?? string.Empty;

            // タグ名を抽出（アクティブなタグのみ）
            var tagNames = item.WorkspaceItemTags
                .Where(wit => wit.Tag?.IsActive == true)
                .Select(wit => wit.Tag!.Name)
                .ToList();

            // FullText を構築: Subject + Code + TagNames + RawBody
            var fullTextParts = new List<string>();
            if (!string.IsNullOrWhiteSpace(item.Subject))
                fullTextParts.Add(item.Subject);
            if (!string.IsNullOrWhiteSpace(item.Code))
                fullTextParts.Add(item.Code);
            if (tagNames.Count > 0)
                fullTextParts.AddRange(tagNames);
            if (!string.IsNullOrWhiteSpace(rawBody))
                fullTextParts.Add(rawBody);

            var fullText = string.Join(" ", fullTextParts);

            // Upsert: 存在すれば更新、なければ挿入
            var searchIndex = await _context.WorkspaceItemSearchIndices
                .FirstOrDefaultAsync(si => si.WorkspaceItemId == workspaceItemId);

            if (searchIndex == null)
            {
                searchIndex = new WorkspaceItemSearchIndex
                {
                    WorkspaceItemId = workspaceItemId,
                    RawBody = rawBody,
                    FullText = fullText,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.WorkspaceItemSearchIndices.Add(searchIndex);
            }
            else
            {
                searchIndex.RawBody = rawBody;
                searchIndex.FullText = fullText;
                searchIndex.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Successfully updated SearchIndex for WorkspaceItem {WorkspaceItemId}. " +
                "Extracted text length: {TextLength}, ProcessingTime: {ProcessingTimeMs}ms",
                workspaceItemId,
                rawBody.Length,
                result.ProcessingTimeMs
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to update SearchIndex for WorkspaceItem {WorkspaceItemId}",
                workspaceItemId
            );
            throw;
        }
    }

    /// <summary>
    /// ワークスペースアイテムの RawBody を更新する（後方互換性のため残す）
    /// </summary>
    /// <param name="workspaceItemId">対象のワークスペースアイテムID</param>
    /// <param name="rowVersion">更新条件となる RowVersion（現在は未使用）</param>
    [Obsolete("Use UpdateSearchIndexAsync instead")]
    public Task UpdateRawBodyAsync(int workspaceItemId, uint rowVersion)
    {
        return UpdateSearchIndexAsync(workspaceItemId);
    }
}