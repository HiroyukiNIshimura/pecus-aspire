using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Statistics;
using Pecus.Libs.Utils;
using Pecus.Models.Responses.Dashboard;
using Pecus.Models.Responses.Workspace;

namespace Pecus.Services;

/// <summary>
/// ワークスペース管理サービス
/// </summary>
public class WorkspaceService
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly ChatRoomService _chatRoomService;

    public WorkspaceService(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        ChatRoomService chatRoomService
    )
    {
        _context = context;
        _environment = environment;
        _chatRoomService = chatRoomService;
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
                Mode = request.Mode ?? WorkspaceMode.Normal,
                OrganizationId = organizationId,
                OwnerId = createdByUserId,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = createdByUserId,
                IsActive = true,
            };

            _context.Workspaces.Add(workspace);
            await _context.SaveChangesAsync();

            // ワークスペースアイテム連番用シーケンスを作成
            // シーケンス名はシステム生成（workspace_{id}_item_seq）のため安全
            var sequenceName = $"workspace_{workspace.Id}_item_seq";
#pragma warning disable EF1002 // シーケンス名は識別子のためパラメータ化不可、値はシステム生成で安全
            await _context.Database.ExecuteSqlRawAsync(
                $@"CREATE SEQUENCE IF NOT EXISTS ""{sequenceName}"" START WITH 1 INCREMENT BY 1"
            );
#pragma warning restore EF1002
            workspace.ItemNumberSequenceName = sequenceName;
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

                // ワークスペースのグループチャットルームを作成
                await _chatRoomService.GetOrCreateWorkspaceGroupRoomAsync(
                    workspace.Id,
                    createdByUserId.Value
                );
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
    public async Task<Workspace?> GetWorkspaceByIdAsync(int workspaceId, int organizationId) =>
        await _context
            .Workspaces.Include(w => w.Organization)
            .FirstOrDefaultAsync(w => w.Id == workspaceId && w.OrganizationId == organizationId);

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

        // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
        _context.Entry(workspace).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

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

        // ワークスペースアイテム連番シーケンスを削除
        if (!string.IsNullOrEmpty(workspace.ItemNumberSequenceName))
        {
#pragma warning disable EF1002 // シーケンス名は識別子のためパラメータ化不可、値はシステム生成で安全
            await _context.Database.ExecuteSqlRawAsync(
                $@"DROP SEQUENCE IF EXISTS ""{workspace.ItemNumberSequenceName}"""
            );
#pragma warning restore EF1002
        }

        //カスケードで関連テーブルのレコードも消える
        _context.Workspaces.Remove(workspace);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// ワークスペースを無効化
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="rowVersion">楽観的ロック用のバージョン番号</param>
    /// <param name="updatedByUserId">更新者のユーザーID</param>
    /// <param name="verifiedWorkspace">権限チェック済みのワークスペース（省略時は再取得）</param>
    public async Task<bool> DeactivateWorkspaceAsync(
        int workspaceId,
        uint rowVersion,
        int? updatedByUserId = null,
        Workspace? verifiedWorkspace = null
    )
    {
        // 権限チェック済みの場合はトラッキングして再利用、そうでなければ再取得
        Workspace? workspace;
        if (verifiedWorkspace != null)
        {
            workspace = await _context.Workspaces.FindAsync(verifiedWorkspace.Id);
        }
        else
        {
            workspace = await _context.Workspaces.FindAsync(workspaceId);
        }
        if (workspace == null)
        {
            return false;
        }

        workspace.IsActive = false;
        workspace.UpdatedAt = DateTime.UtcNow;
        workspace.UpdatedByUserId = updatedByUserId;

        // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
        _context.Entry(workspace).Property(e => e.RowVersion).OriginalValue = rowVersion;

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
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="rowVersion">楽観的ロック用のバージョン番号</param>
    /// <param name="updatedByUserId">更新者のユーザーID</param>
    /// <param name="verifiedWorkspace">権限チェック済みのワークスペース（省略時は再取得）</param>
    public async Task<bool> ActivateWorkspaceAsync(
        int workspaceId,
        uint rowVersion,
        int? updatedByUserId = null,
        Workspace? verifiedWorkspace = null
    )
    {
        // 権限チェック済みの場合はトラッキングして再利用、そうでなければ再取得
        Workspace? workspace;
        if (verifiedWorkspace != null)
        {
            workspace = await _context.Workspaces.FindAsync(verifiedWorkspace.Id);
        }
        else
        {
            workspace = await _context.Workspaces.FindAsync(workspaceId);
        }
        if (workspace == null)
        {
            return false;
        }

        workspace.IsActive = true;
        workspace.UpdatedAt = DateTime.UtcNow;
        workspace.UpdatedByUserId = updatedByUserId;

        // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
        _context.Entry(workspace).Property(e => e.RowVersion).OriginalValue = rowVersion;

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
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="request">メンバー追加リクエスト</param>
    /// <param name="verifiedWorkspace">権限チェック済みのワークスペース（省略時は再取得）</param>
    public async Task<(WorkspaceUser, Workspace)> AddUserToWorkspaceAsync(
        int workspaceId,
        AddUserToWorkspaceRequest request,
        Workspace? verifiedWorkspace = null
    )
    {
        // ワークスペースの存在確認（権限チェック済みの場合はスキップ）
        var workspace = verifiedWorkspace ?? await _context
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

        // ワークスペースのチャットルームにメンバーを追加
        await _chatRoomService.AddUserToWorkspaceRoomAsync(request.UserId, workspaceId);

        // ユーザー情報を含めて再ロード
        await _context.Entry(workspaceUser).Reference(wu => wu.User).LoadAsync();

        return (workspaceUser, workspace);
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

        // ワークスペースのチャットルームからメンバーを削除
        await _chatRoomService.RemoveUserFromWorkspaceRoomAsync(userId, workspaceId);

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
    /// <param name="verifiedWorkspace">権限チェック済みのワークスペース（省略時は再取得）</param>
    /// <returns>更新後のワークスペースユーザー情報</returns>
    public async Task<WorkspaceUser> UpdateWorkspaceUserRoleAsync(
        int workspaceId,
        int userId,
        WorkspaceRole newRole,
        Workspace? verifiedWorkspace = null
    )
    {
        // ワークスペースの存在確認とオーナー情報取得（権限チェック済みの場合はスキップ）
        var workspace = verifiedWorkspace ?? await _context.Workspaces.FindAsync(workspaceId);
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
        var query = _context.WorkspaceUsers
            .Include(wu => wu.User)
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
        // アクティブ/非アクティブのワークスペース数を取得
        var workspaceCounts = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId)
            .GroupBy(w => w.IsActive)
            .Select(g => new { IsActive = g.Key, Count = g.Count() })
            .ToListAsync();

        var activeCount = workspaceCounts.FirstOrDefault(w => w.IsActive)?.Count ?? 0;
        var inactiveCount = workspaceCounts.FirstOrDefault(w => !w.IsActive)?.Count ?? 0;
        var totalCount = activeCount + inactiveCount;

        // ユニークなメンバーの総数を取得（同じユーザーが複数のワークスペースに属する場合も1人とカウント）
        var uniqueMemberCount = await _context.WorkspaceUsers
            .Where(wu => wu.Workspace.OrganizationId == organizationId && wu.User != null && wu.User.IsActive)
            .Select(wu => wu.UserId)
            .Distinct()
            .CountAsync();

        // ジャンルごとのワークスペース数を取得
        var workspaceCountByGenre = await _context.Workspaces
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
        var recentWorkspaceCount = await _context.Workspaces
            .Where(w => w.OrganizationId == organizationId && w.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            .CountAsync();

        return new WorkspaceStatistics
        {
            ActiveWorkspaceCount = activeCount,
            InactiveWorkspaceCount = inactiveCount,
            TotalWorkspaceCount = totalCount,
            UniqueMemberCount = uniqueMemberCount,
            AverageMembersPerWorkspace = totalCount > 0 ? (double)uniqueMemberCount / totalCount : 0,
            RecentWorkspaceCount = recentWorkspaceCount,
            WorkspaceCountByGenre = workspaceCountByGenre
        };
    }

    /// <summary>
    /// ユーザーがアクセス可能なワークスペースをページネーション付きで取得
    /// 一般ユーザー向け：常にアクティブなワークスペースのみを返す
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="page">ページ番号</param>
    /// <param name="pageSize">ページサイズ</param>
    /// <param name="genreId">ジャンルIDフィルター</param>
    /// <param name="name">名前フィルター（前方一致）</param>
    /// <param name="mode">ワークスペースモードフィルター</param>
    public async Task<(
        List<WorkspaceListItemResponse> workspaces,
        int totalCount
    )> GetAccessibleWorkspacesByUserPagedAsync(
        int userId,
        int page,
        int pageSize,
        int? genreId = null,
        string? name = null,
        WorkspaceMode? mode = null
    )
    {
        // ユーザーが参加しているワークスペースIDをサブクエリとして使用
        var accessibleWorkspaceIdsQuery = _context
            .WorkspaceUsers
            .Where(wu => wu.UserId == userId)
            .Select(wu => wu.WorkspaceId);

        var baseQuery = _context
            .Workspaces
            .AsNoTracking()
            .Where(w => accessibleWorkspaceIdsQuery.Contains(w.Id) && w.IsActive);

        if (genreId.HasValue)
        {
            baseQuery = baseQuery.Where(w => w.GenreId == genreId.Value);
        }

        if (!string.IsNullOrEmpty(name))
        {
            baseQuery = baseQuery.Where(w => w.Name.StartsWith(name));
        }

        if (mode.HasValue)
        {
            baseQuery = baseQuery.Where(w => w.Mode == mode.Value);
        }

        // 総件数はシンプルにカウント
        var totalCount = await baseQuery.CountAsync();

        // DTOへの射影（カウントはDB側で計算）
        var workspaces = await baseQuery
            .OrderByDescending(w => w.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(w => new WorkspaceListItemResponse
            {
                Id = w.Id,
                Name = w.Name,
                Code = w.Code,
                Description = w.Description,
                OrganizationId = w.OrganizationId,
                OrganizationName = w.Organization != null ? w.Organization.Name : null,
                GenreId = w.GenreId,
                GenreName = w.Genre != null ? w.Genre.Name : null,
                GenreIcon = w.Genre != null ? w.Genre.Icon : null,
                Mode = w.Mode,
                // DB側でCOUNT（全件メモリロードしない）
                ActiveItemCount = w.WorkspaceItems.Count(wi => wi.IsActive),
                MemberCount = w.WorkspaceUsers.Count(wu => wu.User != null && wu.User.IsActive),
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt,
                IsActive = w.IsActive,
                // Owner情報
                Owner = w.Owner != null
                    ? new WorkspaceUserItem
                    {
                        Id = w.Owner.Id,
                        Username = w.Owner.Username,
                        Email = w.Owner.Email,
                        IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                            w.Owner.AvatarType,
                            w.Owner.Id,
                            w.Owner.Username,
                            w.Owner.Email,
                            w.Owner.UserAvatarPath,
                            200
                        ),
                        IsActive = w.Owner.IsActive,
                        LastLoginAt = w.Owner.LastLoginAt,
                    }
                    : null,
            })
            .ToListAsync();

        return (workspaces, totalCount);
    }

    /// <summary>
    /// ユーザーがアクセス可能なワークスペースの統計情報を取得
    /// </summary>
    public async Task<WorkspaceStatistics> GetAccessibleWorkspaceStatisticsAsync(int userId)
    {
        // ユーザーが参加しているワークスペースIDをサブクエリとして使用
        var accessibleWorkspaceIdsQuery = _context
            .WorkspaceUsers
            .Where(wu => wu.UserId == userId)
            .Select(wu => wu.WorkspaceId);

        // アクティブ/非アクティブのワークスペース数を取得
        var workspaceCounts = await _context.Workspaces
            .Where(w => accessibleWorkspaceIdsQuery.Contains(w.Id))
            .GroupBy(w => w.IsActive)
            .Select(g => new { IsActive = g.Key, Count = g.Count() })
            .ToListAsync();

        var activeCount = workspaceCounts.FirstOrDefault(w => w.IsActive)?.Count ?? 0;
        var inactiveCount = workspaceCounts.FirstOrDefault(w => !w.IsActive)?.Count ?? 0;
        var totalCount = activeCount + inactiveCount;

        // アクセス可能なワークスペース全体のユニークなメンバー数を取得
        var uniqueMemberCount = await _context.WorkspaceUsers
            .Where(wu => accessibleWorkspaceIdsQuery.Contains(wu.WorkspaceId) && wu.User != null && wu.User.IsActive)
            .Select(wu => wu.UserId)
            .Distinct()
            .CountAsync();

        // ジャンルごとのワークスペース数を取得
        var workspaceCountByGenre = await _context.Workspaces
            .Where(w => accessibleWorkspaceIdsQuery.Contains(w.Id))
            .GroupBy(w => new { w.GenreId, GenreName = w.Genre != null ? w.Genre.Name : "未設定" })
            .Select(g => new GenreCount
            {
                GenreId = g.Key.GenreId!.Value,
                GenreName = g.Key.GenreName,
                Count = g.Count()
            })
            .ToListAsync();

        // 最近作成されたワークスペース数（過去30日）
        var recentWorkspaceCount = await _context.Workspaces
            .Where(w => accessibleWorkspaceIdsQuery.Contains(w.Id) && w.CreatedAt >= DateTime.UtcNow.AddDays(-30))
            .CountAsync();

        return new WorkspaceStatistics
        {
            ActiveWorkspaceCount = activeCount,
            InactiveWorkspaceCount = inactiveCount,
            TotalWorkspaceCount = totalCount,
            UniqueMemberCount = uniqueMemberCount,
            AverageMembersPerWorkspace = totalCount > 0 ? (double)uniqueMemberCount / totalCount : 0,
            RecentWorkspaceCount = recentWorkspaceCount,
            WorkspaceCountByGenre = workspaceCountByGenre
        };
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
                Mode = latestWorkspace.Mode,
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
        var access = await GetWorkspaceUserAsync(workspaceId, userId);
        if (access == null || access.User == null || !access.User.IsActive)
        {
            throw new NotFoundException("ワークスペースにアクセスできません。");
        }
    }

    /// <summary>
    /// ワークスペースユーザー情報を取得
    /// </summary>
    public async Task<WorkspaceUser?> GetWorkspaceUserAsync(int workspaceId, int userId)
    {
        return await _context.WorkspaceUsers
            .AsNoTracking()
            .Include(wu => wu.User)
            .FirstOrDefaultAsync(wu =>
                wu.WorkspaceId == workspaceId &&
                wu.UserId == userId
            );
    }

    /// <summary>
    /// ワークスペースのオーナー情報を取得
    /// </summary>
    public async Task<List<WorkspaceUser>> GetWorkspaceOwnersAsync(int workspaceId)
    {
        return await _context.WorkspaceUsers
            .AsNoTracking()
            .Include(wu => wu.User)
            .Where(wu =>
                wu.WorkspaceId == workspaceId &&
                wu.WorkspaceRole == WorkspaceRole.Owner
            )
            .ToListAsync();
    }

    /// <summary>
    /// ワークスペースの編集権限をチェック（Member または Owner のみ許可）
    /// Viewer は更新権限がないため拒否されます。
    /// </summary>
    public async Task CheckWorkspaceMemberOrOwnerAsync(int workspaceId, int userId)
    {
        var workspaceUser = await GetWorkspaceUserAsync(workspaceId, userId);
        if (workspaceUser == null || workspaceUser.User == null || !workspaceUser.User.IsActive)
        {
            throw new NotFoundException("ワークスペースにアクセスできません。");
        }

        // Viewer は更新権限なし（403 Forbidden）
        if (workspaceUser.WorkspaceRole == WorkspaceRole.Viewer)
        {
            throw new ForbiddenException("この操作を実行する権限がありません。閲覧専用ユーザーは変更操作を行えません。");
        }
    }

    /// <summary>
    /// ワークスペースのオーナー権限をチェック（ユーザーがワークスペースのOwnerか確認）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="userId">ユーザーID</param>
    /// <returns>検証済みのワークスペース情報</returns>
    public async Task<Workspace> CheckWorkspaceOwnerAsync(int workspaceId, int userId)
    {
        var workspaceUser = await _context.WorkspaceUsers
            .AsNoTracking()
            .Include(wu => wu.User)
            .Include(wu => wu.Workspace)
                .ThenInclude(w => w!.Organization)
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

        return workspaceUser.Workspace!;
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
            .Include(w => w.WorkspaceSkills)
                .ThenInclude(ws => ws.Skill)
            .Where(w => w.Id == workspaceId)
            .AsSplitQuery() // デカルト爆発防止
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
                LastLoginAt = createdByUser.LastLoginAt,
            }
            : new WorkspaceDetailUserResponse { UserName = "" };

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
                LastLoginAt = updatedByUser.LastLoginAt,
            }
            : new WorkspaceDetailUserResponse { UserName = "" };

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
                LastLoginAt = wu.User.LastLoginAt,
                IsMe = currentUserId.HasValue && wu.User.Id == currentUserId.Value,
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
                LastLoginAt = workspace.Owner.LastLoginAt,
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

        // スキル一覧の構築（アクティブなスキルのみ）
        var skills = workspace.WorkspaceSkills
            .Where(ws => ws.Skill != null && ws.Skill.IsActive)
            .Select(ws => new WorkspaceSkillResponse
            {
                Id = ws.Skill!.Id,
                Name = ws.Skill.Name,
            })
            .OrderBy(s => s.Name)
            .ToList();

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
            Mode = workspace.Mode,
            CurrentUserRole = currentUserRole,
            Skills = skills,
            RowVersion = workspace.RowVersion!,
        };
    }

    /// <summary>
    /// ワークスペースのスキルを設定（洗い替え、楽観的ロック対応）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="skillIds">スキルIDのリスト</param>
    /// <param name="rowVersion">ワークスペースの楽観的ロック用RowVersion</param>
    /// <param name="updatedByUserId">更新者のユーザーID</param>
    /// <returns>スキル更新の成功フラグ</returns>
    public async Task<bool> SetWorkspaceSkillsAsync(
        int workspaceId,
        List<int>? skillIds,
        uint rowVersion,
        int? updatedByUserId = null
    )
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var workspace = await _context
                .Workspaces.Include(w => w.WorkspaceSkills)
                .FirstOrDefaultAsync(w => w.Id == workspaceId);

            if (workspace == null)
            {
                return false;
            }

            // 楽観的ロック：RowVersionが一致しない場合は競合エラー
            if (workspace.RowVersion != rowVersion)
            {
                await RaiseConflictException(workspaceId);
            }

            // 既存のスキルをすべて削除
            _context.WorkspaceSkills.RemoveRange(workspace.WorkspaceSkills);
            await _context.SaveChangesAsync();

            // 新しいスキルを追加
            if (skillIds != null && skillIds.Any())
            {
                foreach (var skillId in skillIds)
                {
                    var workspaceSkill = new WorkspaceSkill
                    {
                        WorkspaceId = workspaceId,
                        SkillId = skillId,
                        AddedAt = DateTime.UtcNow,
                        AddedByUserId = updatedByUserId,
                    };
                    _context.WorkspaceSkills.Add(workspaceSkill);
                }
            }

            // 更新時刻を設定
            workspace.UpdatedAt = DateTime.UtcNow;
            workspace.UpdatedByUserId = updatedByUserId;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// ワークスペース作成通知の送信先ユーザー一覧を取得
    /// （組織内で有効なユーザー、作成者を除外）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="excludeUserId">除外するユーザーID（ワークスペース作成者）</param>
    /// <returns>通知先ユーザー一覧（メールアドレスを持つ有効なユーザーのみ）</returns>
    public async Task<List<User>> GetWorkspaceCreationNotificationTargetsAsync(int organizationId, int excludeUserId)
    {
        return await _context.Users
            .Where(u =>
                u.OrganizationId == organizationId &&
                u.IsActive &&
                !string.IsNullOrEmpty(u.Email) &&
                u.Id != excludeUserId
            )
            .ToListAsync();
    }

    /// <summary>
    /// 組織内の全アクティブユーザー一覧を取得（削除通知用）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>組織内の全アクティブユーザー一覧（メールアドレスを持つユーザーのみ）</returns>
    public async Task<List<User>> GetOrganizationActiveUsersAsync(int organizationId)
    {
        return await _context.Users
            .Where(u =>
                u.OrganizationId == organizationId &&
                u.IsActive &&
                !string.IsNullOrEmpty(u.Email)
            )
            .ToListAsync();
    }

    /// <summary>
    /// メール送信用にワークスペース情報を詳細取得（組織情報を含む）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <returns>ワークスペース情報（存在しない場合はnull）</returns>
    public async Task<Workspace?> GetWorkspaceWithOrganizationForEmailAsync(int workspaceId)
    {
        return await _context.Workspaces
            .Include(w => w.Organization)
            .Include(w => w.Genre)
            .FirstOrDefaultAsync(w => w.Id == workspaceId);
    }

    /// <summary>
    /// ジャンル名を取得
    /// </summary>
    /// <param name="genreId">ジャンルID</param>
    /// <returns>ジャンル名（存在しない場合はnull）</returns>
    public async Task<string?> GetGenreNameAsync(int genreId)
    {
        var genre = await _context.Genres.FindAsync(genreId);
        return genre?.Name;
    }

    /// <summary>
    /// ユーザーがワークスペース内で担当しているタスク/アイテムを取得
    /// Viewer変更前のチェック用
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="userId">対象ユーザーID</param>
    /// <returns>担当タスク/アイテム情報</returns>
    public async Task<WorkspaceMemberAssignmentsResponse> GetMemberAssignmentsAsync(int workspaceId, int userId)
    {
        var workspace = await _context.Workspaces.FindAsync(workspaceId);
        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var workspaceCode = workspace.Code ?? "";

        // 未完了タスク担当
        var assignedTasks = await _context
            .WorkspaceTasks.Include(t => t.WorkspaceItem)
            .Where(t =>
                t.WorkspaceItem!.WorkspaceId == workspaceId
                && t.AssignedUserId == userId
                && !t.IsCompleted
                && !t.IsDiscarded
            )
            .Select(t => new AssignedTaskInfo
            {
                TaskId = t.Id,
                TaskSequence = t.Sequence,
                TaskContent =
                    t.Content.Length > 50 ? t.Content.Substring(0, 50) + "..." : t.Content,
                ItemId = t.WorkspaceItemId,
                ItemNumber = t.WorkspaceItem!.ItemNumber,
                ItemSubject = t.WorkspaceItem.Subject,
                WorkspaceCode = workspaceCode,
            })
            .ToListAsync();

        // アイテム担当者（アーカイブされていないもの）
        var assignedItems = await _context
            .WorkspaceItems.Where(i =>
                i.WorkspaceId == workspaceId && i.AssigneeId == userId && !i.IsArchived
            )
            .Select(i => new AssignedItemInfo
            {
                ItemId = i.Id,
                ItemNumber = i.ItemNumber,
                ItemSubject = i.Subject,
                WorkspaceCode = workspaceCode,
            })
            .ToListAsync();

        // コミッター（アーカイブされていないもの）
        var committerItems = await _context
            .WorkspaceItems.Where(i =>
                i.WorkspaceId == workspaceId && i.CommitterId == userId && !i.IsArchived
            )
            .Select(i => new AssignedItemInfo
            {
                ItemId = i.Id,
                ItemNumber = i.ItemNumber,
                ItemSubject = i.Subject,
                WorkspaceCode = workspaceCode,
            })
            .ToListAsync();

        // オーナー（アーカイブされていないもの）
        var ownerItems = await _context
            .WorkspaceItems.Where(i =>
                i.WorkspaceId == workspaceId && i.OwnerId == userId && !i.IsArchived
            )
            .Select(i => new AssignedItemInfo
            {
                ItemId = i.Id,
                ItemNumber = i.ItemNumber,
                ItemSubject = i.Subject,
                WorkspaceCode = workspaceCode,
            })
            .ToListAsync();

        return new WorkspaceMemberAssignmentsResponse
        {
            AssignedTasks = assignedTasks,
            AssignedItems = assignedItems,
            CommitterItems = committerItems,
            OwnerItems = ownerItems,
        };
    }

    /// <summary>
    /// ワークスペース単位の週次タスクトレンドを取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="weeks">取得する週数（デフォルト8週）</param>
    /// <returns>週次タスクトレンド</returns>
    public async Task<DashboardTaskTrendResponse> GetWorkspaceTaskTrendAsync(int workspaceId, int weeks = 8)
    {
        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Date, TimeSpan.Zero);
        var currentWeekStart = StatisticsDateHelper.GetStartOfWeek(todayStart);
        var startDate = currentWeekStart.AddDays(-7 * (weeks - 1));

        // 期間内のタスクを取得
        var tasksInPeriod = await _context.WorkspaceTasks
            .Where(t => t.WorkspaceId == workspaceId)
            .Where(t =>
                (t.CreatedAt >= startDate) ||
                (t.CompletedAt != null && t.CompletedAt >= startDate)
            )
            .Select(t => new { t.CreatedAt, t.CompletedAt })
            .ToListAsync();

        // 期間内のアイテムを取得
        var itemsInPeriod = await _context.WorkspaceItems
            .Where(i => i.WorkspaceId == workspaceId)
            .Where(i => i.CreatedAt >= startDate)
            .Select(i => new { i.CreatedAt })
            .ToListAsync();

        // 週ごとに集計
        var weeklyTrends = new List<WeeklyTaskTrend>();
        for (int i = 0; i < weeks; i++)
        {
            var weekStart = startDate.AddDays(7 * i);
            var weekEnd = weekStart.AddDays(7);

            var createdCount = tasksInPeriod.Count(t => t.CreatedAt >= weekStart && t.CreatedAt < weekEnd);
            var completedCount = tasksInPeriod.Count(t => t.CompletedAt != null && t.CompletedAt >= weekStart && t.CompletedAt < weekEnd);
            var itemCreatedCount = itemsInPeriod.Count(i => i.CreatedAt >= weekStart && i.CreatedAt < weekEnd);

            weeklyTrends.Add(new WeeklyTaskTrend
            {
                WeekStart = weekStart,
                WeekNumber = StatisticsDateHelper.GetIsoWeekNumber(weekStart),
                Label = $"{weekStart:M/d}〜{weekStart.AddDays(6):M/d}",
                CreatedCount = createdCount,
                CompletedCount = completedCount,
                ItemCreatedCount = itemCreatedCount,
            });
        }

        return new DashboardTaskTrendResponse
        {
            WeeklyTrends = weeklyTrends,
            StartDate = startDate,
            EndDate = currentWeekStart.AddDays(7).AddTicks(-1),
        };
    }

    /// <summary>
    /// ワークスペース進捗レポートを取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="organizationId">組織ID</param>
    /// <param name="from">開始日</param>
    /// <param name="to">終了日</param>
    /// <param name="includeArchived">アーカイブ済みアイテムを含むか</param>
    /// <returns>進捗レポート</returns>
    public async Task<WorkspaceProgressReportResponse> GetProgressReportAsync(
        int workspaceId,
        int organizationId,
        DateOnly from,
        DateOnly to,
        bool includeArchived = false)
    {

        // 期間の検証
        if (from > to)
        {
            throw new NotFoundException("開始日は終了日以前である必要があります。");
        }

        // 最大期間を1年に制限
        if (to.DayNumber - from.DayNumber > 365)
        {
            throw new NotFoundException("レポート期間は最大1年間です。");
        }

        // ワークスペースメンバーであることを確認（Viewer含む全ロールがアクセス可能）
        var workspace = await GetWorkspaceByIdAsync(workspaceId, organizationId);
        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // 期間の変換（UTCとして扱う）
        var fromDate = new DateTimeOffset(from.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        var toDate = new DateTimeOffset(to.ToDateTime(TimeOnly.MaxValue), TimeSpan.Zero);

        // アイテムを取得
        var itemsQuery = _context.WorkspaceItems
            .Where(i => i.WorkspaceId == workspaceId)
            .Where(i => !i.IsDraft); // 下書きは除外

        if (!includeArchived)
        {
            itemsQuery = itemsQuery.Where(i => !i.IsArchived);
        }

        var items = await itemsQuery
            .Include(i => i.Owner)
            .Include(i => i.Assignee)
            .Include(i => i.Committer)
            .OrderBy(i => i.ItemNumber)
            .ToListAsync();

        var itemIds = items.Select(i => i.Id).ToList();

        // タスクを別途取得（期間フィルタ適用）
        var tasks = await _context.WorkspaceTasks
            .Where(t => itemIds.Contains(t.WorkspaceItemId))
            .Where(t =>
                t.CreatedAt <= toDate &&
                (t.CompletedAt == null || t.CompletedAt >= fromDate) &&
                (t.DiscardedAt == null || t.DiscardedAt >= fromDate)
            )
            .Include(t => t.TaskType)
            .Include(t => t.AssignedUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.CompletedByUser)
            .OrderBy(t => t.WorkspaceItemId)
            .ThenBy(t => t.Sequence)
            .ToListAsync();

        // アイテムIDごとにタスクをグループ化
        var tasksByItemId = tasks.GroupBy(t => t.WorkspaceItemId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // サマリー集計
        var completedTasks = tasks.Count(t => t.IsCompleted);
        var discardedTasks = tasks.Count(t => t.IsDiscarded);
        var inProgressTasks = tasks.Count(t => !t.IsCompleted && !t.IsDiscarded && t.ProgressPercentage > 0);
        var openTasks = tasks.Count(t => !t.IsCompleted && !t.IsDiscarded && t.ProgressPercentage == 0);
        var totalTasks = tasks.Count;
        var completionRate = totalTasks > 0 ? Math.Round((decimal)completedTasks / totalTasks * 100, 1) : 0;

        var response = new WorkspaceProgressReportResponse
        {
            Workspace = new ProgressReportWorkspaceInfo
            {
                Code = workspace.Code ?? "",
                Name = workspace.Name,
                Mode = workspace.Mode.ToString(),
            },
            Period = new ProgressReportPeriod
            {
                From = from.ToString("yyyy-MM-dd"),
                To = to.ToString("yyyy-MM-dd"),
            },
            GeneratedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(9)).ToString("yyyy-MM-dd HH:mm"),
            Summary = new ProgressReportSummary
            {
                TotalItems = items.Count,
                ArchivedItems = items.Count(i => i.IsArchived),
                TotalTasks = totalTasks,
                TasksByStatus = new ProgressReportTasksByStatus
                {
                    Completed = completedTasks,
                    Discarded = discardedTasks,
                    InProgress = inProgressTasks,
                    Open = openTasks,
                },
                CompletionRate = completionRate,
                TotalEstimatedHours = tasks.Sum(t => t.EstimatedHours ?? 0),
                TotalActualHours = tasks.Sum(t => t.ActualHours ?? 0),
            },
            Items = items.Select(i => MapToProgressReportItem(i, tasksByItemId.GetValueOrDefault(i.Id, []))).ToList(),
        };

        return response;
    }

    /// <summary>
    /// WorkspaceItem を ProgressReportItem にマッピング
    /// </summary>
    private static ProgressReportItem MapToProgressReportItem(WorkspaceItem item, List<WorkspaceTask> tasks)
    {
        var orderedTasks = tasks.OrderBy(t => t.Sequence).ToList();
        var completedTasks = tasks.Count(t => t.IsCompleted);
        var discardedTasks = tasks.Count(t => t.IsDiscarded);
        var inProgressTasks = tasks.Count(t => !t.IsCompleted && !t.IsDiscarded && t.ProgressPercentage > 0);
        var openTasks = tasks.Count(t => !t.IsCompleted && !t.IsDiscarded && t.ProgressPercentage == 0);
        var totalTasks = tasks.Count;
        var completionRate = totalTasks > 0 ? Math.Round((decimal)completedTasks / totalTasks * 100, 1) : 0;

        return new ProgressReportItem
        {
            Code = item.ItemNumber.ToString(),
            Subject = item.Subject ?? "",
            IsArchived = item.IsArchived,
            IsDraft = item.IsDraft,
            Priority = item.Priority?.ToString() ?? "",
            DueDate = item.DueDate?.ToString("yyyy-MM-dd") ?? "",
            Owner = item.Owner?.Username ?? "",
            Assignee = item.Assignee?.Username ?? "",
            Committer = item.Committer?.Username ?? "",
            CreatedAt = item.CreatedAt.ToOffset(TimeSpan.FromHours(9)).ToString("yyyy-MM-dd"),
            UpdatedAt = item.UpdatedAt.ToOffset(TimeSpan.FromHours(9)).ToString("yyyy-MM-dd"),
            TaskSummary = new ProgressReportItemTaskSummary
            {
                Total = totalTasks,
                Completed = completedTasks,
                Discarded = discardedTasks,
                InProgress = inProgressTasks,
                Open = openTasks,
                CompletionRate = completionRate,
                EstimatedHours = orderedTasks.Sum(t => t.EstimatedHours ?? 0),
                ActualHours = orderedTasks.Sum(t => t.ActualHours ?? 0),
            },
            Tasks = orderedTasks.Select(t => MapToProgressReportTask(t)).ToList(),
        };
    }

    /// <summary>
    /// WorkspaceTask を ProgressReportTask にマッピング
    /// </summary>
    private static ProgressReportTask MapToProgressReportTask(WorkspaceTask task)
    {
        // ステータスを導出
        string status;
        if (task.IsCompleted)
        {
            status = "Completed";
        }
        else if (task.IsDiscarded)
        {
            status = "Discarded";
        }
        else if (task.ProgressPercentage > 0)
        {
            status = "InProgress";
        }
        else
        {
            status = "Open";
        }

        return new ProgressReportTask
        {
            Sequence = task.Sequence,
            Content = task.Content,
            Status = status,
            IsCompleted = task.IsCompleted,
            IsDiscarded = task.IsDiscarded,
            Priority = task.Priority?.ToString() ?? "",
            TaskType = task.TaskType?.Name ?? "",
            TaskTypeIcon = task.TaskType?.Icon ?? "",
            Assignee = task.AssignedUser?.Username ?? "",
            CreatedBy = task.CreatedByUser?.Username ?? "",
            CompletedBy = task.CompletedByUser?.Username ?? "",
            StartDate = task.StartDate?.ToString("yyyy-MM-dd") ?? "",
            DueDate = task.DueDate.ToString("yyyy-MM-dd"),
            CompletedAt = task.CompletedAt?.ToOffset(TimeSpan.FromHours(9)).ToString("yyyy-MM-dd") ?? "",
            DiscardedAt = task.DiscardedAt?.ToOffset(TimeSpan.FromHours(9)).ToString("yyyy-MM-dd") ?? "",
            DiscardReason = task.DiscardReason ?? "",
            EstimatedHours = task.EstimatedHours ?? 0,
            ActualHours = task.ActualHours ?? 0,
            ProgressPercentage = task.ProgressPercentage,
            CreatedAt = task.CreatedAt.ToOffset(TimeSpan.FromHours(9)).ToString("yyyy-MM-dd"),
            UpdatedAt = task.UpdatedAt.ToOffset(TimeSpan.FromHours(9)).ToString("yyyy-MM-dd"),
        };
    }
}