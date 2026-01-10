using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Pecus.Libs.DB.Services;

/// <summary>
/// バッチ処理対応の組織削除サービス（大規模データ向け）
/// サブクエリを使用してメモリ効率を改善し、バッチ削除で大量データに対応
/// </summary>
/// <remarks>
/// 特徴:
/// - IDリストをメモリに保持せずサブクエリで処理
/// - バッチ削除で長時間ロックを回避
/// - 進捗ログを出力
///
/// </remarks>
public class BatchOrganizationDeletionService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BatchOrganizationDeletionService> _logger;

    /// <summary>
    /// バッチサイズ（1回の削除で処理する最大件数）
    /// コマンドタイムアウトやデッドロックを防ぐため、適切に調整してください。
    /// </summary>
    private const int DefaultBatchSize = 1000;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public BatchOrganizationDeletionService(
        ApplicationDbContext context,
        ILogger<BatchOrganizationDeletionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 組織と関連データをバッチ処理で物理削除
    /// </summary>
    /// <remarks>
    /// FK依存関係を考慮した順序で削除を実行します。
    /// 大量データに対応するため、バッチ単位で削除を行います。
    /// </remarks>
    /// <param name="organizationId">削除対象の組織ID</param>
    /// <param name="batchSize">1回の削除で処理する最大件数</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    public async Task DeleteOrganizationWithRelatedDataAsync(
        int organizationId,
        int batchSize = DefaultBatchSize,
        CancellationToken cancellationToken = default)
    {
        var organization = await _context.Organizations
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == organizationId, cancellationToken);

        if (organization == null)
        {
            _logger.LogWarning("Organization not found for deletion: OrganizationId={OrganizationId}", organizationId);
            return;
        }

        var organizationName = organization.Name;

        _logger.LogInformation(
            "組織削除を開始します: OrganizationId={OrganizationId}, OrganizationName={OrganizationName}",
            organizationId,
            organizationName);

        // ワークスペースIDのサブクエリ
        var workspaceIdsQuery = _context.Workspaces
            .Where(w => w.OrganizationId == organizationId)
            .Select(w => w.Id);

        // ユーザーIDのサブクエリ
        var userIdsQuery = _context.Users
            .Where(u => u.OrganizationId == organizationId)
            .Select(u => u.Id);

        // ボットIDのサブクエリ
        var botIdsQuery = _context.Bots
            .Where(b => b.OrganizationId == organizationId)
            .Select(b => b.Id);

        // チャットルームIDのサブクエリ
        var chatRoomIdsQuery = _context.ChatRooms
            .Where(r => r.OrganizationId == organizationId)
            .Select(r => r.Id);

        // タスクIDのサブクエリ
        var taskIdsQuery = _context.WorkspaceTasks
            .Where(t => workspaceIdsQuery.Contains(t.WorkspaceId))
            .Select(t => t.Id);

        // アイテムIDのサブクエリ
        var itemIdsQuery = _context.WorkspaceItems
            .Where(i => workspaceIdsQuery.Contains(i.WorkspaceId))
            .Select(i => i.Id);

        // ChatMessage
        await DeleteInBatchesAsync(
            _context.ChatMessages.Where(m => chatRoomIdsQuery.Contains(m.ChatRoomId)),
            "ChatMessages",
            organizationId,
            batchSize,
            cancellationToken);

        // ChatRoomMember
        await DeleteInBatchesAsync(
            _context.ChatRoomMembers.Where(m => chatRoomIdsQuery.Contains(m.ChatRoomId)),
            "ChatRoomMembers",
            organizationId,
            batchSize,
            cancellationToken);

        // ChatRoom
        await DeleteInBatchesAsync(
            _context.ChatRooms.Where(r => r.OrganizationId == organizationId),
            "ChatRooms",
            organizationId,
            batchSize,
            cancellationToken);

        // ChatActor（User）
        await DeleteInBatchesAsync(
            _context.ChatActors.Where(a => a.UserId != null && userIdsQuery.Contains(a.UserId.Value)),
            "ChatActors (User)",
            organizationId,
            batchSize,
            cancellationToken);

        // ChatActor（Bot）
        await DeleteInBatchesAsync(
            _context.ChatActors.Where(a => a.BotId != null && botIdsQuery.Contains(a.BotId.Value)),
            "ChatActors (Bot)",
            organizationId,
            batchSize,
            cancellationToken);

        // Bot
        await DeleteInBatchesAsync(
            _context.Bots.Where(b => b.OrganizationId == organizationId),
            "Bots",
            organizationId,
            batchSize,
            cancellationToken);

        // TaskComment
        await DeleteInBatchesAsync(
            _context.TaskComments.Where(c => taskIdsQuery.Contains(c.WorkspaceTaskId)),
            "TaskComments",
            organizationId,
            batchSize,
            cancellationToken);

        // WorkspaceTask
        await DeleteInBatchesAsync(
            _context.WorkspaceTasks.Where(t => workspaceIdsQuery.Contains(t.WorkspaceId)),
            "WorkspaceTasks",
            organizationId,
            batchSize,
            cancellationToken);

        // Activity
        await DeleteInBatchesAsync(
            _context.Activities.Where(a => workspaceIdsQuery.Contains(a.WorkspaceId)),
            "Activities",
            organizationId,
            batchSize,
            cancellationToken);

        // WorkspaceItemAttachment
        await DeleteInBatchesAsync(
            _context.WorkspaceItemAttachments.Where(a => itemIdsQuery.Contains(a.WorkspaceItemId)),
            "WorkspaceItemAttachments",
            organizationId,
            batchSize,
            cancellationToken);

        // WorkspaceItemRelation（アイテムに紐づく）
        await DeleteInBatchesAsync(
            _context.WorkspaceItemRelations.Where(r => itemIdsQuery.Contains(r.FromItemId) || itemIdsQuery.Contains(r.ToItemId)),
            "WorkspaceItemRelations (by item)",
            organizationId,
            batchSize,
            cancellationToken);

        // WorkspaceItemRelation（ユーザーが作成）
        await DeleteInBatchesAsync(
            _context.WorkspaceItemRelations.Where(r => userIdsQuery.Contains(r.CreatedByUserId)),
            "WorkspaceItemRelations (by user)",
            organizationId,
            batchSize,
            cancellationToken);

        // WorkspaceItemTag（アイテムに紐づく）
        await DeleteInBatchesAsync(
            _context.WorkspaceItemTags.Where(t => itemIdsQuery.Contains(t.WorkspaceItemId)),
            "WorkspaceItemTags (by item)",
            organizationId,
            batchSize,
            cancellationToken);

        // WorkspaceItemTag（ユーザーが作成）
        await DeleteInBatchesAsync(
            _context.WorkspaceItemTags.Where(t => userIdsQuery.Contains(t.CreatedByUserId)),
            "WorkspaceItemTags (by user)",
            organizationId,
            batchSize,
            cancellationToken);

        // WorkspaceItemPin
        await DeleteInBatchesAsync(
            _context.WorkspaceItemPins.Where(p => itemIdsQuery.Contains(p.WorkspaceItemId)),
            "WorkspaceItemPins",
            organizationId,
            batchSize,
            cancellationToken);

        // WorkspaceItem
        await DeleteInBatchesAsync(
            _context.WorkspaceItems.Where(i => workspaceIdsQuery.Contains(i.WorkspaceId)),
            "WorkspaceItems",
            organizationId,
            batchSize,
            cancellationToken);

        // WorkspaceSkill（ワークスペースに紐づく）
        await DeleteInBatchesAsync(
            _context.WorkspaceSkills.Where(s => workspaceIdsQuery.Contains(s.WorkspaceId)),
            "WorkspaceSkills (by workspace)",
            organizationId,
            batchSize,
            cancellationToken);

        // WorkspaceSkill（ユーザーが追加）
        await DeleteInBatchesAsync(
            _context.WorkspaceSkills.Where(s => s.AddedByUserId != null && userIdsQuery.Contains(s.AddedByUserId.Value)),
            "WorkspaceSkills (by user)",
            organizationId,
            batchSize,
            cancellationToken);

        // WorkspaceUser
        await DeleteInBatchesAsync(
            _context.WorkspaceUsers.Where(u => workspaceIdsQuery.Contains(u.WorkspaceId)),
            "WorkspaceUsers",
            organizationId,
            batchSize,
            cancellationToken);

        // Workspace
        await DeleteInBatchesAsync(
            _context.Workspaces.Where(w => w.OrganizationId == organizationId),
            "Workspaces",
            organizationId,
            batchSize,
            cancellationToken);

        // UserSkill（ユーザーが追加者）
        await DeleteInBatchesAsync(
            _context.UserSkills.Where(s => s.AddedByUserId != null && userIdsQuery.Contains(s.AddedByUserId.Value)),
            "UserSkills (by AddedByUserId)",
            organizationId,
            batchSize,
            cancellationToken);

        // UserSkill（ユーザー自身のスキル）
        await DeleteInBatchesAsync(
            _context.UserSkills.Where(s => userIdsQuery.Contains(s.UserId)),
            "UserSkills (by UserId)",
            organizationId,
            batchSize,
            cancellationToken);

        // UserSetting
        await DeleteInBatchesAsync(
            _context.UserSettings.Where(s => userIdsQuery.Contains(s.UserId)),
            "UserSettings",
            organizationId,
            batchSize,
            cancellationToken);

        // RefreshToken
        await DeleteInBatchesAsync(
            _context.RefreshTokens.Where(t => userIdsQuery.Contains(t.UserId)),
            "RefreshTokens",
            organizationId,
            batchSize,
            cancellationToken);

        // Device
        await DeleteInBatchesAsync(
            _context.Devices.Where(d => userIdsQuery.Contains(d.UserId)),
            "Devices",
            organizationId,
            batchSize,
            cancellationToken);

        // EmailChangeToken
        await DeleteInBatchesAsync(
            _context.EmailChangeTokens.Where(t => userIdsQuery.Contains(t.UserId)),
            "EmailChangeTokens",
            organizationId,
            batchSize,
            cancellationToken);

        // Tag
        await DeleteInBatchesAsync(
            _context.Tags.Where(t => t.OrganizationId == organizationId),
            "Tags",
            organizationId,
            batchSize,
            cancellationToken);

        // Skill
        await DeleteInBatchesAsync(
            _context.Skills.Where(s => s.OrganizationId == organizationId),
            "Skills",
            organizationId,
            batchSize,
            cancellationToken);

        // User
        await DeleteInBatchesAsync(
            _context.Users.Where(u => u.OrganizationId == organizationId),
            "Users",
            organizationId,
            batchSize,
            cancellationToken);

        // OrganizationSetting
        await DeleteInBatchesAsync(
            _context.OrganizationSettings.Where(s => s.OrganizationId == organizationId),
            "OrganizationSettings",
            organizationId,
            batchSize,
            cancellationToken);

        // Organization
        await _context.Organizations
            .Where(o => o.Id == organizationId)
            .ExecuteDeleteAsync(cancellationToken);

        _logger.LogWarning(
            "組織を物理削除しました: OrganizationId={OrganizationId}, OrganizationName={OrganizationName}",
            organizationId,
            organizationName);
    }

    /// <summary>
    /// バッチ単位で削除を実行
    /// </summary>
    private async Task DeleteInBatchesAsync<T>(
        IQueryable<T> query,
        string entityName,
        int organizationId,
        int batchSize,
        CancellationToken cancellationToken) where T : class
    {
        int totalDeleted = 0;
        int deleted;

        do
        {
            cancellationToken.ThrowIfCancellationRequested();

            deleted = await query
                .Take(batchSize)
                .ExecuteDeleteAsync(cancellationToken);

            totalDeleted += deleted;

            if (deleted > 0)
            {
                _logger.LogDebug(
                    "[OrgId={OrganizationId}] {EntityName}: {DeletedCount}件削除 (累計: {TotalDeleted}件)",
                    organizationId,
                    entityName,
                    deleted,
                    totalDeleted);
            }
        } while (deleted >= batchSize);

        if (totalDeleted > 0)
        {
            _logger.LogInformation(
                "[OrgId={OrganizationId}] {EntityName}: 合計 {TotalDeleted}件を削除しました",
                organizationId,
                entityName,
                totalDeleted);
        }
    }
}
