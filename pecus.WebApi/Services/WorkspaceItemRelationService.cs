using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Services;

/// <summary>
/// ワークスペースアイテム関連サービス
/// </summary>
public class WorkspaceItemRelationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkspaceItemRelationService> _logger;

    public WorkspaceItemRelationService(
        ApplicationDbContext context,
        ILogger<WorkspaceItemRelationService> logger
    )
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// ワークスペースアイテムに関連を追加
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="fromItemId">関連元アイテムID</param>
    /// <param name="request">関連追加リクエスト</param>
    /// <param name="createdByUserId">作成者ID</param>
    /// <returns>作成された関連</returns>
    public async Task<WorkspaceItemRelation> AddRelationAsync(
        int workspaceId,
        int fromItemId,
        AddWorkspaceItemRelationRequest request,
        int createdByUserId
    )
    {
        // 関連元アイテムの存在確認
        var fromItem = await _context.WorkspaceItems.FirstOrDefaultAsync(wi =>
            wi.Id == fromItemId && wi.WorkspaceId == workspaceId
        );

        if (fromItem == null)
        {
            throw new NotFoundException("関連元アイテムが見つかりません。");
        }

        // 関連先アイテムの存在確認（同じワークスペース内のみ）
        var toItem = await _context.WorkspaceItems.FirstOrDefaultAsync(wi =>
            wi.Id == request.ToItemId && wi.WorkspaceId == workspaceId
        );

        if (toItem == null)
        {
            throw new NotFoundException("関連先アイテムが見つかりません。");
        }

        // 自己参照チェック
        if (fromItemId == request.ToItemId)
        {
            throw new InvalidOperationException("同じアイテム同士を関連付けることはできません。");
        }

        // 既存の関連チェック
        var existingRelation = await _context.WorkspaceItemRelations.FirstOrDefaultAsync(r =>
            r.FromItemId == fromItemId
            && r.ToItemId == request.ToItemId
            && r.RelationType == request.RelationType
        );

        if (existingRelation != null)
        {
            throw new DuplicateException("指定された関連は既に存在します。");
        }

        // 関連を作成
        var relation = new WorkspaceItemRelation
        {
            FromItemId = fromItemId,
            ToItemId = request.ToItemId,
            RelationType = request.RelationType,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = createdByUserId,
        };

        _context.WorkspaceItemRelations.Add(relation);
        await _context.SaveChangesAsync();

        // 作成された関連を詳細情報付きで取得
        var createdRelation = await _context
            .WorkspaceItemRelations.Include(r => r.FromItem)
            .Include(r => r.ToItem)
            .Include(r => r.CreatedByUser)
            .FirstAsync(r => r.Id == relation.Id);

        _logger.LogInformation(
            "ワークスペースアイテム関連を追加しました。FromItemId: {FromItemId}, ToItemId: {ToItemId}, RelationType: {RelationType}",
            fromItemId,
            request.ToItemId,
            request.RelationType
        );

        return createdRelation;
    }

    /// <summary>
    /// ワークスペースアイテムの関連一覧を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <returns>関連一覧（RelationsFrom と RelationsTo のタプル）</returns>
    public async Task<(
        List<WorkspaceItemRelation> RelationsFrom,
        List<WorkspaceItemRelation> RelationsTo
    )> GetRelationsAsync(int workspaceId, int itemId)
    {
        // アイテムの存在確認
        var item = await _context.WorkspaceItems.FirstOrDefaultAsync(wi =>
            wi.Id == itemId && wi.WorkspaceId == workspaceId
        );

        if (item == null)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        // 関連元としての関連を取得
        var relationsFrom = await _context
            .WorkspaceItemRelations.Where(r => r.FromItemId == itemId)
            .Include(r => r.ToItem)
            .Include(r => r.CreatedByUser)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        // 関連先としての関連を取得
        var relationsTo = await _context
            .WorkspaceItemRelations.Where(r => r.ToItemId == itemId)
            .Include(r => r.FromItem)
            .Include(r => r.CreatedByUser)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return (relationsFrom, relationsTo);
    }

    /// <summary>
    /// ワークスペースアイテムの関連を削除
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="relationId">関連ID</param>
    /// <param name="currentUserId">現在のユーザーID</param>
    public async Task DeleteRelationAsync(
        int workspaceId,
        int itemId,
        int relationId,
        int currentUserId
    )
    {
        // 関連の存在確認（アイテムがワークスペースに属しているか確認）
        var relation = await _context
            .WorkspaceItemRelations.Include(r => r.FromItem)
            .Include(r => r.ToItem)
            .FirstOrDefaultAsync(r =>
                r.Id == relationId
                && (r.FromItemId == itemId || r.ToItemId == itemId)
                && r.FromItem!.WorkspaceId == workspaceId
            );

        if (relation == null)
        {
            throw new NotFoundException("指定された関連が見つかりません。");
        }

        _context.WorkspaceItemRelations.Remove(relation);

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "ワークスペースアイテム関連を削除しました。RelationId: {RelationId}, FromItemId: {FromItemId}, ToItemId: {ToItemId}",
            relationId,
            relation.FromItemId,
            relation.ToItemId
        );
    }

    /// <summary>
    /// 特定の関連を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="relationId">関連ID</param>
    /// <returns>関連</returns>
    public async Task<WorkspaceItemRelation> GetRelationAsync(
        int workspaceId,
        int itemId,
        int relationId
    )
    {
        var relation = await _context
            .WorkspaceItemRelations.Include(r => r.FromItem)
            .Include(r => r.ToItem)
            .Include(r => r.CreatedByUser)
            .FirstOrDefaultAsync(r =>
                r.Id == relationId
                && (r.FromItemId == itemId || r.ToItemId == itemId)
                && r.FromItem!.WorkspaceId == workspaceId
            );

        if (relation == null)
        {
            throw new NotFoundException("指定された関連が見つかりません。");
        }

        return relation;
    }
}