using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Utils;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Workspace;

namespace Pecus.Services;

/// <summary>
/// ワークスペース管理サービス
/// </summary>
public class WorkspaceService
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public WorkspaceService(ApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

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
                GenreId = request.GenreId,
                OrganizationId = organizationId,
                OwnerId = request.OwnerId,
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
                    WorkspaceRole = WorkspaceRole.Owner,
                    JoinedAt = DateTime.UtcNow,
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
        bool? isActive = null,
        int? genreId = null,
        string? name = null
    )
    {
        var query = _context
            .Workspaces.Include(w => w.Organization)
            .Include(w => w.Genre)
            .Include(w => w.Owner)
            .Include(w => w.WorkspaceUsers.Where(wu => wu.User != null && wu.User.IsActive))
                .ThenInclude(wu => wu.User)
            .Include(w => w.WorkspaceItems)
            .Where(w => w.OrganizationId == organizationId)
            .AsSplitQuery() // デカルト爆発防止
            .AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(w => w.IsActive == isActive.Value);
        }

        if (genreId.HasValue)
        {
            query = query.Where(w => w.GenreId == genreId.Value);
        }

        if (!string.IsNullOrEmpty(name))
        {
            query = query.Where(w => w.Name.StartsWith(name));
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

        workspace.Name = request.Name;

        if (request.Description != null)
        {
            workspace.Description = request.Description;
        }

        // ジャンルが存在するかチェック（必須）
        var genre = await _context.Genres.FindAsync(request.GenreId);
        if (genre == null)
        {
            throw new NotFoundException("指定されたジャンルが見つかりません。");
        }
        workspace.GenreId = request.GenreId;

        workspace.UpdatedAt = DateTime.UtcNow;
        workspace.UpdatedByUserId = updatedByUserId;
        workspace.RowVersion = request.RowVersion;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(workspaceId);
        }

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

        //カスケードで関連テーブルのレコードも消える
        _context.Workspaces.Remove(workspace);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// ワークスペースを無効化
    /// </summary>
    public async Task<bool> DeactivateWorkspaceAsync(
        int workspaceId,
        uint rowVersion,
        int? updatedByUserId = null
    )
    {
        var workspace = await _context.Workspaces.FindAsync(workspaceId);
        if (workspace == null)
        {
            return false;
        }

        workspace.IsActive = false;
        workspace.UpdatedAt = DateTime.UtcNow;
        workspace.UpdatedByUserId = updatedByUserId;
        workspace.RowVersion = rowVersion;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(workspaceId);
        }

        return true;
    }

    /// <summary>
    /// ワークスペースを有効化
    /// </summary>
    public async Task<bool> ActivateWorkspaceAsync(
        int workspaceId,
        uint rowVersion,
        int? updatedByUserId = null
    )
    {
        var workspace = await _context.Workspaces.FindAsync(workspaceId);
        if (workspace == null)
        {
            return false;
        }

        workspace.IsActive = true;
        workspace.UpdatedAt = DateTime.UtcNow;
        workspace.UpdatedByUserId = updatedByUserId;
        workspace.RowVersion = rowVersion;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(workspaceId);
        }

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
        AddUserToWorkspaceRequest request
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
            WorkspaceRole = request.WorkspaceRole ?? WorkspaceRole.Member,
            JoinedAt = DateTime.UtcNow,
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
    /// ワークスペースメンバーのロールを変更
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="userId">対象ユーザーID</param>
    /// <param name="newRole">新しいロール</param>
    /// <returns>更新後のワークスペースユーザー情報</returns>
    public async Task<WorkspaceUser> UpdateWorkspaceUserRoleAsync(
        int workspaceId,
        int userId,
        WorkspaceRole newRole
    )
    {
        // ワークスペースの存在確認とオーナー情報取得
        var workspace = await _context.Workspaces.FindAsync(workspaceId);
        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ワークスペースユーザーの存在確認
        var workspaceUser = await _context.WorkspaceUsers
            .Include(wu => wu.User)
            .FirstOrDefaultAsync(wu =>
                wu.WorkspaceId == workspaceId && wu.UserId == userId
            );

        if (workspaceUser == null)
        {
            throw new NotFoundException("指定されたユーザーはワークスペースのメンバーではありません。");
        }

        // Workspace.OwnerId のユーザーを Owner 以外に変更しようとした場合はエラー
        if (workspace.OwnerId == userId && newRole != WorkspaceRole.Owner)
        {
            throw new InvalidOperationException(
                "ワークスペースのオーナーのロールを Owner 以外に変更することはできません。"
            );
        }

        // ロールを更新
        workspaceUser.WorkspaceRole = newRole;
        await _context.SaveChangesAsync();

        return workspaceUser;
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
            .AsSplitQuery() // デカルト爆発防止
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(wu => wu.User != null && wu.User.IsActive);
        }

        query = query.OrderBy(wu => wu.JoinedAt);

        var totalCount = await query.CountAsync();
        var members = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return (members, totalCount);
    }

    /// <summary>
    /// 組織のワークスペース統計情報を取得
    /// </summary>
    public async Task<WorkspaceStatistics> GetWorkspaceStatisticsAsync(int organizationId)
    {
        var statistics = new WorkspaceStatistics
        {
            ActiveWorkspaceCount = 0,
            InactiveWorkspaceCount = 0,
            UniqueMemberCount = 0,
            RecentWorkspaceCount = 0,
            WorkspaceCountByGenre = new List<GenreCount>()
        };

        // アクティブ/非アクティブのワークスペース数を取得
        var workspaceCounts = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId)
            .GroupBy(w => w.IsActive)
            .Select(g => new { IsActive = g.Key, Count = g.Count() })
            .ToListAsync();

        statistics.ActiveWorkspaceCount = workspaceCounts.FirstOrDefault(w => w.IsActive)?.Count ?? 0;
        statistics.InactiveWorkspaceCount = workspaceCounts.FirstOrDefault(w => !w.IsActive)?.Count ?? 0;

        // ユニークなメンバーの総数を取得（同じユーザーが複数のワークスペースに属する場合も1人とカウント）
        statistics.UniqueMemberCount = await _context.WorkspaceUsers
            .Where(wu => wu.Workspace.OrganizationId == organizationId && wu.User != null && wu.User.IsActive)
            .Select(wu => wu.UserId)
            .Distinct()
            .CountAsync();

        // ジャンルごとのワークスペース数を取得
        statistics.WorkspaceCountByGenre = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId)
            .GroupBy(w => new { w.GenreId, GenreName = w.Genre != null ? w.Genre.Name : "未設定" })
            .Select(g => new GenreCount
            {
                GenreId = g.Key.GenreId!.Value,
                GenreName = g.Key.GenreName,
                Count = g.Count()
            })
            .ToListAsync();

        // 最近作成されたワークスペース数（過去30日）
        statistics.RecentWorkspaceCount = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId && w.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            .CountAsync();

        return statistics;
    }

    /// <summary>
    /// ユーザーがアクセス可能なワークスペースをページネーション付きで取得
    /// </summary>
    public async Task<(
        List<Workspace> workspaces,
        int totalCount
    )> GetAccessibleWorkspacesByUserPagedAsync(
        int userId,
        int page,
        int pageSize,
        bool? isActive = null,
        int? genreId = null,
        string? name = null
    )
    {
        // ユーザーが参加しているワークスペースのIDリストを取得
        var accessibleWorkspaceIds = await _context
            .WorkspaceUsers
            .Where(wu => wu.UserId == userId)
            .Select(wu => wu.WorkspaceId)
            .ToListAsync();

        var query = _context
            .Workspaces
            .Include(w => w.Organization)
            .Include(w => w.Genre)
            .Include(w => w.Owner)
            .Include(w => w.WorkspaceUsers.Where(wu => wu.User != null && wu.User.IsActive))
                .ThenInclude(wu => wu.User)
            .Include(w => w.WorkspaceItems)
            .Where(w => accessibleWorkspaceIds.Contains(w.Id))
            .AsSplitQuery() // デカルト爆発防止
            .AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(w => w.IsActive == isActive.Value);
        }

        if (genreId.HasValue)
        {
            query = query.Where(w => w.GenreId == genreId.Value);
        }

        if (!string.IsNullOrEmpty(name))
        {
            query = query.Where(w => w.Name.StartsWith(name));
        }

        query = query.OrderBy(w => w.Id);

        var totalCount = await query.CountAsync();
        var workspaces = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return (workspaces, totalCount);
    }

    /// <summary>
    /// ユーザーがアクセス可能なワークスペースの統計情報を取得
    /// </summary>
    public async Task<WorkspaceStatistics> GetAccessibleWorkspaceStatisticsAsync(int userId)
    {
        var statistics = new WorkspaceStatistics
        {
            ActiveWorkspaceCount = 0,
            InactiveWorkspaceCount = 0,
            UniqueMemberCount = 0,
            RecentWorkspaceCount = 0,
            WorkspaceCountByGenre = new List<GenreCount>()
        };

        // ユーザーが参加しているワークスペースのIDリストを取得
        var accessibleWorkspaceIds = await _context
            .WorkspaceUsers
            .Where(wu => wu.UserId == userId)
            .Select(wu => wu.WorkspaceId)
            .ToListAsync();

        // アクティブ/非アクティブのワークスペース数を取得
        var workspaceCounts = await _context.Workspaces
            .Where(w => accessibleWorkspaceIds.Contains(w.Id))
            .GroupBy(w => w.IsActive)
            .Select(g => new { IsActive = g.Key, Count = g.Count() })
            .ToListAsync();

        statistics.ActiveWorkspaceCount = workspaceCounts.FirstOrDefault(w => w.IsActive)?.Count ?? 0;
        statistics.InactiveWorkspaceCount = workspaceCounts.FirstOrDefault(w => !w.IsActive)?.Count ?? 0;

        // アクセス可能なワークスペース全体のユニークなメンバー数を取得
        statistics.UniqueMemberCount = await _context.WorkspaceUsers
            .Where(wu => accessibleWorkspaceIds.Contains(wu.WorkspaceId) && wu.User != null && wu.User.IsActive)
            .Select(wu => wu.UserId)
            .Distinct()
            .CountAsync();

        // ジャンルごとのワークスペース数を取得
        statistics.WorkspaceCountByGenre = await _context.Workspaces
            .Where(w => accessibleWorkspaceIds.Contains(w.Id))
            .GroupBy(w => new { w.GenreId, GenreName = w.Genre != null ? w.Genre.Name : "未設定" })
            .Select(g => new GenreCount
            {
                GenreId = g.Key.GenreId!.Value,
                GenreName = g.Key.GenreName,
                Count = g.Count()
            })
            .ToListAsync();

        // 最近作成されたワークスペース数（過去30日）
        statistics.RecentWorkspaceCount = await _context.Workspaces
            .Where(w => accessibleWorkspaceIds.Contains(w.Id) && w.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            .CountAsync();

        return statistics;
    }

    private async Task RaiseConflictException(int workspaceId)
    {
        // 最新データを取得
        var latestWorkspace = await _context.Workspaces.FindAsync(workspaceId);
        if (latestWorkspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }
        throw new ConcurrencyException<WorkspaceDetailResponse>(
            "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
            new WorkspaceDetailResponse
            {
                Id = latestWorkspace.Id,
                Name = latestWorkspace.Name,
                Code = latestWorkspace.Code,
                Description = latestWorkspace.Description,
                OrganizationId = latestWorkspace.OrganizationId,
                GenreId = latestWorkspace.GenreId,
                CreatedAt = latestWorkspace.CreatedAt,
                UpdatedAt = latestWorkspace.UpdatedAt,
                IsActive = latestWorkspace.IsActive,
                RowVersion = latestWorkspace.RowVersion!,
            }
        );
    }

    /// <summary>
    /// ワークスペースコードからワークスペースIDを取得
    /// </summary>
    /// <param name="code">ワークスペースコード</param>
    /// <returns>ワークスペースID</returns>
    public async Task<int> GetWorkspaceIdByCodeAsync(string code)
    {
        var workspace = await _context.Workspaces
            .AsNoTracking()
            .Where(w => w.Code == code)
            .Select(w => new { w.Id })
            .FirstOrDefaultAsync();

        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        return workspace.Id;
    }

    /// <summary>
    /// ワークスペースアクセス権限をチェック（codeベース：ユーザーがワークスペースにアクセス可能か確認）
    /// </summary>
    /// <param name="code">ワークスペースコード</param>
    /// <param name="userId">ユーザーID</param>
    /// <returns>ワークスペースID</returns>
    public async Task<int> CheckWorkspaceAccessByCodeAsync(string code, int userId)
    {
        var workspace = await _context.Workspaces
            .AsNoTracking()
            .Where(w => w.Code == code)
            .Select(w => new { w.Id })
            .FirstOrDefaultAsync();

        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        await CheckWorkspaceAccessAsync(workspaceId: workspace.Id, userId: userId);
        return workspace.Id;
    }

    /// <summary>
    /// ワークスペースアクセス権限をチェック（ユーザーがワークスペースにアクセス可能か確認）
    /// </summary>
    public async Task CheckWorkspaceAccessAsync(int workspaceId, int userId)
    {
        var access = await _context.WorkspaceUsers
            .AsNoTracking()
            .Include(wu => wu.User)
            .FirstOrDefaultAsync(wu =>
                wu.WorkspaceId == workspaceId &&
                wu.UserId == userId
            );

        if (access == null || access.User == null || !access.User.IsActive)
        {
            throw new NotFoundException("ワークスペースにアクセスできません。");
        }
    }

    /// <summary>
    /// ワークスペースの編集権限をチェック（Member または Owner のみ許可）
    /// Viewer は更新権限がないため拒否されます。
    /// </summary>
    public async Task CheckWorkspaceMemberOrOwnerAsync(int workspaceId, int userId)
    {
        var workspaceUser = await _context.WorkspaceUsers
            .AsNoTracking()
            .Include(wu => wu.User)
            .FirstOrDefaultAsync(wu =>
                wu.WorkspaceId == workspaceId &&
                wu.UserId == userId
            );

        if (workspaceUser == null || workspaceUser.User == null || !workspaceUser.User.IsActive)
        {
            throw new NotFoundException("ワークスペースにアクセスできません。");
        }

        // Viewer は更新権限なし
        if (workspaceUser.WorkspaceRole == WorkspaceRole.Viewer)
        {
            throw new InvalidOperationException("この操作を実行する権限がありません。Member以上の権限が必要です。");
        }
    }

    /// <summary>
    /// ワークスペースのオーナー権限をチェック（ユーザーがワークスペースのOwnerか確認）
    /// </summary>
    public async Task CheckWorkspaceOwnerAsync(int workspaceId, int userId)
    {
        var workspaceUser = await _context.WorkspaceUsers
            .AsNoTracking()
            .Include(wu => wu.User)
            .FirstOrDefaultAsync(wu =>
                wu.WorkspaceId == workspaceId &&
                wu.UserId == userId
            );

        if (workspaceUser == null || workspaceUser.User == null || !workspaceUser.User.IsActive)
        {
            throw new NotFoundException("ワークスペースにアクセスできません。");
        }

        if (workspaceUser.WorkspaceRole != WorkspaceRole.Owner)
        {
            throw new InvalidOperationException("この操作を実行する権限がありません。Ownerのみが実行できます。");
        }
    }

    /// <summary>
    /// ワークスペース詳細情報を取得（DTO形式で、IdentityIconUrl を含む）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="currentUserId">ログインユーザーID（ロール取得用）</param>
    public async Task<WorkspaceFullDetailResponse> GetWorkspaceDetailAsync(int workspaceId, int? currentUserId = null)
    {
        // ワークスペース基本情報を取得
        var workspace = await _context.Workspaces
            .AsNoTracking()
            .Include(w => w.Genre)
            .Include(w => w.Owner)
            .Include(w => w.WorkspaceUsers)
                .ThenInclude(wu => wu.User)
            .Where(w => w.Id == workspaceId)
            .FirstOrDefaultAsync();

        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // CreatedByUser と UpdatedByUser は別途取得
        User? createdByUser = null;
        User? updatedByUser = null;

        if (workspace.CreatedByUserId.HasValue)
        {
            createdByUser = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == workspace.CreatedByUserId);
        }

        if (workspace.UpdatedByUserId.HasValue)
        {
            updatedByUser = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == workspace.UpdatedByUserId);
        }

        // CreatedBy の構築
        var createdBy = createdByUser != null
            ? new WorkspaceDetailUserResponse
            {
                Id = createdByUser.Id,
                UserName = createdByUser.Username,
                IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                    iconType: createdByUser.AvatarType,
                    userId: createdByUser.Id,
                    username: createdByUser.Username,
                    email: createdByUser.Email,
                    avatarPath: createdByUser.UserAvatarPath
                ),
                IsActive = createdByUser.IsActive,
            }
            : new WorkspaceDetailUserResponse { UserName = "Unknown" };

        // UpdatedBy の構築
        var updatedBy = updatedByUser != null
            ? new WorkspaceDetailUserResponse
            {
                Id = updatedByUser.Id,
                UserName = updatedByUser.Username,
                IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                    iconType: updatedByUser.AvatarType,
                    userId: updatedByUser.Id,
                    username: updatedByUser.Username,
                    email: updatedByUser.Email,
                    avatarPath: updatedByUser.UserAvatarPath
                ),
                IsActive = updatedByUser.IsActive,
            }
            : new WorkspaceDetailUserResponse { UserName = "Unknown" };

        // Members の構築
        var members = workspace.WorkspaceUsers
            .Where(wu => wu.User != null && wu.User.IsActive)
            .Select(wu => new WorkspaceDetailUserResponse
            {
                Id = wu.User!.Id,
                UserName = wu.User.Username,
                Email = wu.User.Email,
                IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                    iconType: wu.User.AvatarType,
                    userId: wu.User.Id,
                    username: wu.User.Username,
                    email: wu.User.Email,
                    avatarPath: wu.User.UserAvatarPath
                ),
                WorkspaceRole = wu.WorkspaceRole,
                IsActive = wu.User.IsActive,
            })
            .ToList();

        // Owner の構築
        var owner = workspace.Owner != null
            ? new WorkspaceDetailUserResponse
            {
                Id = workspace.Owner.Id,
                UserName = workspace.Owner.Username,
                IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                    iconType: workspace.Owner.AvatarType,
                    userId: workspace.Owner.Id,
                    username: workspace.Owner.Username,
                    email: workspace.Owner.Email,
                    avatarPath: workspace.Owner.UserAvatarPath
                ),
                IsActive = workspace.Owner.IsActive,
            }
            : null;

        // ログインユーザーのロールを取得
        WorkspaceRole? currentUserRole = null;
        if (currentUserId.HasValue)
        {
            var currentUserWorkspace = workspace.WorkspaceUsers
                .FirstOrDefault(wu => wu.UserId == currentUserId.Value);
            currentUserRole = currentUserWorkspace?.WorkspaceRole;
        }

        return new WorkspaceFullDetailResponse
        {
            Id = workspace.Id,
            Name = workspace.Name,
            Code = workspace.Code ?? "",
            Description = workspace.Description,
            GenreId = workspace.Genre?.Id,
            GenreName = workspace.Genre?.Name,
            GenreIcon = workspace.Genre?.Icon,
            CreatedAt = workspace.CreatedAt,
            CreatedBy = createdBy,
            UpdatedAt = workspace.UpdatedAt,
            UpdatedBy = updatedBy,
            Members = members,
            Owner = owner,
            IsActive = workspace.IsActive,
            CurrentUserRole = currentUserRole,
            RowVersion = workspace.RowVersion!,
        };
    }
}