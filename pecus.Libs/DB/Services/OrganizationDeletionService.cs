using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Pecus.Libs.DB.Services;

/// <summary>
/// 組織削除サービス
/// 組織と関連データを物理削除する共通ロジックを提供
/// </summary>
public class OrganizationDeletionService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<OrganizationDeletionService> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public OrganizationDeletionService(
        ApplicationDbContext context,
        ILogger<OrganizationDeletionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 組織と関連データをすべて物理削除
    /// </summary>
    /// <remarks>
    /// FK依存関係を考慮した順序で削除を実行します。
    /// トランザクションは呼び出し元で管理することも、このメソッド内で管理することも可能です。
    /// </remarks>
    /// <param name="organizationId">削除対象の組織ID</param>
    /// <param name="useTransaction">トランザクションを使用するか（デフォルト: true）</param>
    public async Task DeleteOrganizationWithRelatedDataAsync(int organizationId, bool useTransaction = true)
    {
        if (useTransaction)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await DeleteOrganizationCoreAsync(organizationId);
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        else
        {
            await DeleteOrganizationCoreAsync(organizationId);
        }
    }

    /// <summary>
    /// 組織削除のコアロジック
    /// FK依存関係（特にRestrict）を考慮した順序で削除
    /// </summary>
    private async Task DeleteOrganizationCoreAsync(int organizationId)
    {
        var organization = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            _logger.LogWarning("Organization not found for deletion: OrganizationId={OrganizationId}", organizationId);
            return;
        }

        var organizationName = organization.Name;

        // 事前に ID リストを取得
        var workspaceIds = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId)
            .Select(w => w.Id)
            .ToListAsync();

        var chatRoomIds = await _context.ChatRooms
            .Where(r => r.OrganizationId == organizationId)
            .Select(r => r.Id)
            .ToListAsync();

        var userIds = await _context.Users
            .Where(u => u.OrganizationId == organizationId)
            .Select(u => u.Id)
            .ToListAsync();

        var botIds = await _context.Bots
            .Where(b => b.OrganizationId == organizationId)
            .Select(b => b.Id)
            .ToListAsync();

        var taskIds = new List<int>();
        if (workspaceIds.Count > 0)
        {
            taskIds = await _context.WorkspaceTasks
                .Where(t => workspaceIds.Contains(t.WorkspaceId))
                .Select(t => t.Id)
                .ToListAsync();
        }

        var itemIds = new List<int>();
        if (workspaceIds.Count > 0)
        {
            itemIds = await _context.WorkspaceItems
                .Where(i => workspaceIds.Contains(i.WorkspaceId))
                .Select(i => i.Id)
                .ToListAsync();
        }

        // ChatRoom 関連
        if (chatRoomIds.Count > 0)
        {
            await _context.ChatMessages
                .Where(m => chatRoomIds.Contains(m.ChatRoomId))
                .ExecuteDeleteAsync();

            await _context.ChatRoomMembers
                .Where(m => chatRoomIds.Contains(m.ChatRoomId))
                .ExecuteDeleteAsync();
        }

        // ChatRoom（CreatedByUserId は Restrict だが、組織削除時は ChatRoom 自体を先に削除）
        await _context.ChatRooms
            .Where(r => r.OrganizationId == organizationId)
            .ExecuteDeleteAsync();

        // ChatActor 関連
        if (userIds.Count > 0)
        {
            await _context.ChatActors
                .Where(a => userIds.Contains(a.UserId!.Value))
                .ExecuteDeleteAsync();
        }

        if (botIds.Count > 0)
        {
            await _context.ChatActors
                .Where(a => botIds.Contains(a.BotId!.Value))
                .ExecuteDeleteAsync();
        }

        // Bot
        await _context.Bots
            .Where(b => b.OrganizationId == organizationId)
            .ExecuteDeleteAsync();

        // TaskComment（UserId は Restrict）
        if (taskIds.Count > 0)
        {
            await _context.TaskComments
                .Where(c => taskIds.Contains(c.WorkspaceTaskId))
                .ExecuteDeleteAsync();
        }

        // WorkspaceTask（AssignedUserId, CreatedByUserId は Restrict）
        if (workspaceIds.Count > 0)
        {
            await _context.WorkspaceTasks
                .Where(t => workspaceIds.Contains(t.WorkspaceId))
                .ExecuteDeleteAsync();
        }

        // Activity
        if (workspaceIds.Count > 0)
        {
            await _context.Activities
                .Where(a => workspaceIds.Contains(a.WorkspaceId))
                .ExecuteDeleteAsync();
        }

        // WorkspaceItemAttachment（UploadedByUserId は Restrict）
        if (itemIds.Count > 0)
        {
            await _context.WorkspaceItemAttachments
                .Where(a => itemIds.Contains(a.WorkspaceItemId))
                .ExecuteDeleteAsync();
        }

        // WorkspaceItemRelation（CreatedByUserId は Restrict）
        if (itemIds.Count > 0)
        {
            await _context.WorkspaceItemRelations
                .Where(r => itemIds.Contains(r.FromItemId) || itemIds.Contains(r.ToItemId))
                .ExecuteDeleteAsync();
        }
        // 他の組織のアイテムでも、このユーザーが作成したリレーションを削除
        if (userIds.Count > 0)
        {
            await _context.WorkspaceItemRelations
                .Where(r => userIds.Contains(r.CreatedByUserId))
                .ExecuteDeleteAsync();
        }

        // WorkspaceItemTag（CreatedByUserId は Restrict）
        if (itemIds.Count > 0)
        {
            await _context.WorkspaceItemTags
                .Where(t => itemIds.Contains(t.WorkspaceItemId))
                .ExecuteDeleteAsync();
        }
        // 他の組織のアイテムでも、このユーザーが作成したタグ付けを削除
        if (userIds.Count > 0)
        {
            await _context.WorkspaceItemTags
                .Where(t => userIds.Contains(t.CreatedByUserId))
                .ExecuteDeleteAsync();
        }

        // WorkspaceItemPin
        if (itemIds.Count > 0)
        {
            await _context.WorkspaceItemPins
                .Where(p => itemIds.Contains(p.WorkspaceItemId))
                .ExecuteDeleteAsync();
        }

        // WorkspaceItem（OwnerId は Restrict）
        if (workspaceIds.Count > 0)
        {
            await _context.WorkspaceItems
                .Where(i => workspaceIds.Contains(i.WorkspaceId))
                .ExecuteDeleteAsync();
        }

        // WorkspaceSkill（AddedByUserId は Restrict）
        if (workspaceIds.Count > 0)
        {
            await _context.WorkspaceSkills
                .Where(s => workspaceIds.Contains(s.WorkspaceId))
                .ExecuteDeleteAsync();
        }
        // 他のワークスペースでも、このユーザーが追加したスキルを削除
        if (userIds.Count > 0)
        {
            await _context.WorkspaceSkills
                .Where(s => s.AddedByUserId != null && userIds.Contains(s.AddedByUserId.Value))
                .ExecuteDeleteAsync();
        }

        // WorkspaceUser
        if (workspaceIds.Count > 0)
        {
            await _context.WorkspaceUsers
                .Where(u => workspaceIds.Contains(u.WorkspaceId))
                .ExecuteDeleteAsync();
        }

        // Workspace
        await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId)
            .ExecuteDeleteAsync();

        // UserSkill（AddedByUserId は Restrict）
        // 他組織のユーザースキルでも、このユーザーが追加者の場合は先に削除
        if (userIds.Count > 0)
        {
            // このユーザーが AddedByUserId として参照されているスキルを先に削除
            await _context.UserSkills
                .Where(s => s.AddedByUserId != null && userIds.Contains(s.AddedByUserId.Value))
                .ExecuteDeleteAsync();

            // このユーザー自身のスキルを削除
            await _context.UserSkills
                .Where(s => userIds.Contains(s.UserId))
                .ExecuteDeleteAsync();
        }

        // UserSetting
        if (userIds.Count > 0)
        {
            await _context.UserSettings
                .Where(s => userIds.Contains(s.UserId))
                .ExecuteDeleteAsync();
        }

        // RefreshToken
        if (userIds.Count > 0)
        {
            await _context.RefreshTokens
                .Where(t => userIds.Contains(t.UserId))
                .ExecuteDeleteAsync();
        }

        // Device
        if (userIds.Count > 0)
        {
            await _context.Devices
                .Where(d => userIds.Contains(d.UserId))
                .ExecuteDeleteAsync();
        }

        // EmailChangeToken
        if (userIds.Count > 0)
        {
            await _context.EmailChangeTokens
                .Where(t => userIds.Contains(t.UserId))
                .ExecuteDeleteAsync();
        }

        // Tag（CreatedByUserId は Restrict、組織に紐づくので先に削除）
        await _context.Tags
            .Where(t => t.OrganizationId == organizationId)
            .ExecuteDeleteAsync();

        // Skill（CreatedByUserId, UpdatedByUserId は Restrict、組織に紐づくので先に削除）
        await _context.Skills
            .Where(s => s.OrganizationId == organizationId)
            .ExecuteDeleteAsync();

        // User
        await _context.Users
            .Where(u => u.OrganizationId == organizationId)
            .ExecuteDeleteAsync();

        // OrganizationSetting
        await _context.OrganizationSettings
            .Where(s => s.OrganizationId == organizationId)
            .ExecuteDeleteAsync();

        // Organization（ExecuteDeleteAsync で直接削除、xmin の問題を回避）
        await _context.Organizations
            .Where(o => o.Id == organizationId)
            .ExecuteDeleteAsync();

        _logger.LogWarning(
            "組織を物理削除しました: OrganizationId={OrganizationId}, OrganizationName={OrganizationName}",
            organizationId,
            organizationName);
    }
}
