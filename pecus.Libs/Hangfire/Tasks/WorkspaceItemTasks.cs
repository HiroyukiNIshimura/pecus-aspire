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
    private readonly ILogger<WorkspaceItemTasks> _logger;

    /// <summary>
    /// WorkspaceItemTasks のコンストラクタ
    /// </summary>
    /// <param name="context">DBコンテキスト</param>
    /// <param name="logger">ロガー</param>
    public WorkspaceItemTasks(ApplicationDbContext context, ILogger<WorkspaceItemTasks> logger)
    {
        _context = context;
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

            // Body から RawBody を抽出
            var rawBody = LexicalTextExtractor.ExtractText(item.Body);

            // RawBody を更新
            item.RawBody = rawBody;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Successfully updated RawBody for WorkspaceItem {WorkspaceItemId}. " +
                "Extracted text length: {TextLength}",
                workspaceItemId,
                rawBody.Length
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