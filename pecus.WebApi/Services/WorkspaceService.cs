using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests;

namespace Pecus.Services;

/// <summary>
/// ワークスペース管理サービス
/// </summary>
public class WorkspaceService
{
    private readonly ApplicationDbContext _context;

    public WorkspaceService(ApplicationDbContext context) => _context = context;

    /// <summary>
    /// ワークスペースを作成
    /// </summary>
    public async Task<Workspace> CreateWorkspaceAsync(
        CreateWorkspaceRequest request,
        int organizationId,
        int? createdByUserId = null
    )
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 組織の存在確認
            var organization = await _context.Organizations.FindAsync(organizationId);
            if (organization == null)
            {
                throw new NotFoundException("組織が見つかりません。");
            }

            // 組織内でユニークなワークスペースコードを生成
            var code = await GenerateUniqueWorkspaceCodeAsync(_context, organizationId);

            var workspace = new Workspace
            {
                Name = request.Name,
                Code = code,
                Description = request.Description,
                OrganizationId = organizationId,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = createdByUserId,
                IsActive = true,
            };

            _context.Workspaces.Add(workspace);
            await _context.SaveChangesAsync();

            // ワークスペースを作成したユーザーを自動的にOwnerとして参加させる
            if (createdByUserId.HasValue)
            {
                var workspaceUser = new WorkspaceUser
                {
                    WorkspaceId = workspace.Id,
                    UserId = createdByUserId.Value,
                    WorkspaceRole = "Owner",
                    JoinedAt = DateTime.UtcNow,
                    IsActive = true,
                };
                _context.WorkspaceUsers.Add(workspaceUser);
                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            return workspace;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// 組織内でユニークなワークスペースコードを生成（8文字）
    /// </summary>
    private static async Task<string> GenerateUniqueWorkspaceCodeAsync(
        ApplicationDbContext context,
        int organizationId
    )
    {
        string code;
        bool exists;

        do
        {
            code = CodeGenerator.GenerateWorkspaceCode();

            // 同じ組織内で既に存在するかチェック
            exists = await context.Workspaces.AnyAsync(w =>
                w.OrganizationId == organizationId && w.Code == code
            );
        } while (exists);

        return code;
    }

    /// <summary>
    /// ワークスペースIDで取得
    /// </summary>
    public async Task<Workspace?> GetWorkspaceByIdAsync(int workspaceId) =>
        await _context
            .Workspaces.Include(w => w.Organization)
            .FirstOrDefaultAsync(w => w.Id == workspaceId);

    /// <summary>
    /// ワークスペースをページネーション付きで取得
    /// </summary>
    public async Task<(List<Workspace> workspaces, int totalCount)> GetWorkspacesPagedAsync(
        int page,
        int pageSize,
        bool? activeOnly = null
    )
    {
        var query = _context.Workspaces.Include(w => w.Organization).AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(w => w.IsActive);
        }

        query = query.OrderBy(w => w.Id);

        var totalCount = await query.CountAsync();
        var workspaces = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return (workspaces, totalCount);
    }

    /// <summary>
    /// 組織IDでワークスペースをページネーション付きで取得
    /// </summary>
    public async Task<(
        List<Workspace> workspaces,
        int totalCount
    )> GetWorkspacesByOrganizationPagedAsync(
        int organizationId,
        int page,
        int pageSize,
        bool? activeOnly = null
    )
    {
        var query = _context
            .Workspaces.Include(w => w.Organization)
            .Include(w => w.WorkspaceUsers).ThenInclude(wu => wu.User)
            .Where(w => w.OrganizationId == organizationId)
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(w => w.IsActive);
        }

        query = query.OrderBy(w => w.Id);

        var totalCount = await query.CountAsync();
        var workspaces = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return (workspaces, totalCount);
    }

    /// <summary>
    /// ワークスペースを更新
    /// </summary>
    public async Task<Workspace> UpdateWorkspaceAsync(
        int workspaceId,
        UpdateWorkspaceRequest request,
        int? updatedByUserId = null
    )
    {
        var workspace = await _context.Workspaces.FindAsync(workspaceId);
        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        if (request.Name != null)
        {
            workspace.Name = request.Name;
        }

        if (request.Description != null)
        {
            workspace.Description = request.Description;
        }

        workspace.UpdatedAt = DateTime.UtcNow;
        workspace.UpdatedByUserId = updatedByUserId;

        await _context.SaveChangesAsync();
        return workspace;
    }

    /// <summary>
    /// ワークスペースを削除
    /// </summary>
    public async Task<bool> DeleteWorkspaceAsync(int workspaceId)
    {
        var workspace = await _context.Workspaces.FindAsync(workspaceId);
        if (workspace == null)
        {
            return false;
        }

        _context.Workspaces.Remove(workspace);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// ワークスペースを無効化
    /// </summary>
    public async Task<bool> DeactivateWorkspaceAsync(int workspaceId, int? updatedByUserId = null)
    {
        var workspace = await _context.Workspaces.FindAsync(workspaceId);
        if (workspace == null)
        {
            return false;
        }

        workspace.IsActive = false;
        workspace.UpdatedAt = DateTime.UtcNow;
        workspace.UpdatedByUserId = updatedByUserId;
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// ワークスペースを有効化
    /// </summary>
    public async Task<bool> ActivateWorkspaceAsync(int workspaceId, int? updatedByUserId = null)
    {
        var workspace = await _context.Workspaces.FindAsync(workspaceId);
        if (workspace == null)
        {
            return false;
        }

        workspace.IsActive = true;
        workspace.UpdatedAt = DateTime.UtcNow;
        workspace.UpdatedByUserId = updatedByUserId;
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// 組織のワークスペースを全て取得
    /// </summary>
    public async Task<List<Workspace>> GetWorkspacesByOrganizationAsync(int organizationId) =>
        await _context
            .Workspaces.Include(w => w.Organization)
            .Where(w => w.OrganizationId == organizationId)
            .ToListAsync();

    /// <summary>
    /// ワークスペースにユーザーを参加させる
    /// </summary>
    public async Task<WorkspaceUser> AddUserToWorkspaceAsync(
        int workspaceId,
        AddUserToWorkspaceRequest request,
        int? invitedByUserId = null
    )
    {
        // ワークスペースの存在確認
        var workspace = await _context
            .Workspaces.Include(w => w.Organization)
            .FirstOrDefaultAsync(w => w.Id == workspaceId);
        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーの存在確認
        var user = await _context.Users.FindAsync(request.UserId);
        if (user == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // ユーザーの組織とワークスペースの組織が一致するかチェック
        if (user.OrganizationId != workspace.OrganizationId)
        {
            throw new InvalidOperationException(
                "ユーザーは自分の組織に属するワークスペースにのみ参加できます。"
            );
        }

        // 既に参加しているかチェック
        var existingMembership = await _context.WorkspaceUsers.FirstOrDefaultAsync(wu =>
            wu.WorkspaceId == workspaceId && wu.UserId == request.UserId
        );
        if (existingMembership != null)
        {
            throw new DuplicateException("ユーザーは既にこのワークスペースに参加しています。");
        }

        // ワークスペースユーザーを作成
        var workspaceUser = new WorkspaceUser
        {
            WorkspaceId = workspaceId,
            UserId = request.UserId,
            WorkspaceRole = request.WorkspaceRole ?? "Member",
            JoinedAt = DateTime.UtcNow,
            IsActive = true,
        };

        _context.WorkspaceUsers.Add(workspaceUser);
        await _context.SaveChangesAsync();

        // ユーザー情報を含めて再ロード
        await _context.Entry(workspaceUser).Reference(wu => wu.User).LoadAsync();

        return workspaceUser;
    }

    /// <summary>
    /// ワークスペースからユーザーを削除
    /// </summary>
    public async Task<bool> RemoveUserFromWorkspaceAsync(int workspaceId, int userId)
    {
        var workspaceUser = await _context.WorkspaceUsers.FirstOrDefaultAsync(wu =>
            wu.WorkspaceId == workspaceId && wu.UserId == userId
        );

        if (workspaceUser == null)
        {
            return false;
        }

        _context.WorkspaceUsers.Remove(workspaceUser);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// ワークスペースのメンバー一覧をページネーション付きで取得
    /// </summary>
    public async Task<(List<WorkspaceUser> members, int totalCount)> GetWorkspaceMembersPagedAsync(
        int workspaceId,
        int page,
        int pageSize,
        bool? activeOnly = null
    )
    {
        var query = _context
            .WorkspaceUsers.Include(wu => wu.User)
            .Include(wu => wu.Workspace)
            .Where(wu => wu.WorkspaceId == workspaceId)
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(wu => wu.IsActive && (wu.User == null || wu.User.IsActive));
        }

        query = query.OrderBy(wu => wu.JoinedAt);

        var totalCount = await query.CountAsync();
        var members = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return (members, totalCount);
    }
}
