using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
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
    /// ワークスペースアイテムの RawBody を更新する
    /// </summary>
    /// <param name="workspaceItemId">対象のワークスペースアイテムID</param>
    /// <param name="rowVersion">更新条件となる RowVersion</param>
    /// <remarks>
    /// Body から Lexical JSON をパースしてプレーンテキストを抽出し、RawBody に設定します。
    /// 指定された ID と RowVersion が一致するレコードが存在しない場合は、
    /// 競合として扱いエラーにせず処理をスキップします。
    /// </remarks>
    public async Task UpdateRawBodyAsync(int workspaceItemId, uint rowVersion)
    {
        _logger.LogInformation(
            "Updating RawBody for WorkspaceItem {WorkspaceItemId} with RowVersion {RowVersion}",
            workspaceItemId,
            rowVersion
        );

        try
        {
            // ID と RowVersion が一致するレコードを検索
            var item = await _context
                .WorkspaceItems.FirstOrDefaultAsync(wi =>
                    wi.Id == workspaceItemId && wi.RowVersion == rowVersion
                );

            if (item == null)
            {
                _logger.LogInformation(
                    "WorkspaceItem {WorkspaceItemId} with RowVersion {RowVersion} not found. " +
                    "The item may have been updated or deleted. Skipping RawBody update.",
                    workspaceItemId,
                    rowVersion
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

            item.RawBody = result.Result;

            if (result.UnknownNodes.Count > 0)
            {
                _logger.LogWarning(
                    "Unknown nodes detected for WorkspaceItem {WorkspaceItemId}: {UnknownNodes}",
                    workspaceItemId,
                    string.Join(", ", result.UnknownNodes)
                );
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Successfully updated RawBody for WorkspaceItem {WorkspaceItemId}. " +
                "Extracted text length: {TextLength}, ProcessingTime: {ProcessingTimeMs}ms",
                workspaceItemId,
                item.RawBody.Length,
                result.ProcessingTimeMs
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to update RawBody for WorkspaceItem {WorkspaceItemId}",
                workspaceItemId
            );
            throw;
        }
    }
}