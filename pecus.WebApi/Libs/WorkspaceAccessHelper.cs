using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs;

/// <summary>
/// 組織へのアクセス権限チェックを行うヘルパークラス
/// ワークスペース、ユーザーなど、組織レベルでのアクセス制御を一元管理します。
/// </summary>
public class OrganizationAccessHelper
{
    private readonly ApplicationDbContext _context;

    public OrganizationAccessHelper(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// ユーザーの組織IDを取得（組織に所属していない場合はnullを返す）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>組織ID（所属していない場合はnull）</returns>
    public async Task<int?> GetUserOrganizationIdAsync(int userId)
    {
        var user = await _context
            .Users.Where(u => u.Id == userId && u.IsActive)
            .Select(u => new { u.OrganizationId })
            .FirstOrDefaultAsync();

        return user?.OrganizationId;
    }

    /// <summary>
    ///  ユーザーが指定した組織に所属しているかチェック
    /// </summary>
    /// <param name="userId"></param>
    /// <param name="organizationId"></param>
    /// <returns></returns>
    public async Task<User> CheckIncludeOrganizationAsync(int userId, int? organizationId)
    {
        if (!organizationId.HasValue)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        var user = await _context
            .Users.Where(u => u.Id == userId && u.IsActive && u.OrganizationId == organizationId)
            .FirstOrDefaultAsync();

        if (user == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        return user;
    }

    /// <summary>
    /// ユーザーが指定した組織にアクセス可能かチェック（所属しているか）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="organizationId">組織ID</param>
    /// <returns>アクセス可能な場合はtrue</returns>
    public async Task<bool> CanAccessOrganizationAsync(int userId, int organizationId)
    {
        var userOrgId = await GetUserOrganizationIdAsync(userId);
        return userOrgId.HasValue && userOrgId.Value == organizationId;
    }

    /// <summary>
    /// ユーザーが指定したワークスペースにアクセス可能かチェック
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="includeMembers">メンバー情報を含めるかどうか（デフォルト: false）</param>
    /// <param name="includeInactive">非アクティブなワークスペースも含めるか（デフォルト: false、Admin用にtrue）</param>
    /// <returns>アクセス可能な場合はtrueとワークスペース、不可能な場合はfalseとnull</returns>
    public async Task<(bool hasAccess, Workspace? workspace)> CheckWorkspaceAccessAsync(
        int userId,
        int workspaceId,
        bool includeMembers = false,
        bool includeInactive = false
    )
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return (false, null);
        }

        var query = _context.Workspaces
            .Include(w => w.Organization)
            .Include(w => w.Genre)
            .AsQueryable();

        if (includeMembers)
        {
            query = query
                .Include(w => w.WorkspaceUsers)
                    .ThenInclude(wu => wu.User);
        }

        var workspace = await query.FirstOrDefaultAsync(w => w.Id == workspaceId);

        if (workspace == null || workspace.OrganizationId != organizationId.Value)
        {
            return (false, null);
        }

        // 非アクティブチェック（includeInactive = false の場合のみ）
        if (!includeInactive && !workspace.IsActive)
        {
            return (false, null);
        }

        return (true, workspace);
    }

    /// <summary>
    /// ユーザーが指定したワークスペースにアクセス可能かチェック（ワークスペース情報なし）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="includeInactive">非アクティブなワークスペースも含めるか（デフォルト: false、Admin用にtrue）</param>
    /// <returns>アクセス可能な場合はtrue、不可能な場合はfalse</returns>
    public async Task<bool> CanAccessWorkspaceAsync(int userId, int workspaceId, bool includeInactive = false)
    {
        var (hasAccess, _) = await CheckWorkspaceAccessAsync(userId, workspaceId, includeInactive: includeInactive);
        return hasAccess;
    }

    /// <summary>
    /// ユーザーがワークスペースのアクティブなメンバーかチェック
    /// ログインユーザーのチェックには利用してはいけない（CheckWorkspaceAccessAndMembershipAsyncを使用すること）
    /// 担当者やコミッターなど、第三者のメンバーシップ確認に使用する
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="includeInactive">非アクティブなワークスペースも含めるか（デフォルト: false、Admin用にtrue）</param>
    /// <returns>アクティブなメンバーの場合はtrue、それ以外はfalse</returns>
    public async Task<bool> IsActiveWorkspaceMemberAsync(int userId, int workspaceId, bool includeInactive = false)
    {
        // まずワークスペースのアクティブ状態をチェック
        if (!includeInactive)
        {
            var workspace = await _context.Workspaces
                .AsNoTracking()
                .FirstOrDefaultAsync(w => w.Id == workspaceId);
            if (workspace == null || !workspace.IsActive)
            {
                return false;
            }
        }

        return await _context.WorkspaceUsers.AnyAsync(wu =>
            wu.WorkspaceId == workspaceId
            && wu.UserId == userId
            && wu.User != null
            && wu.User.IsActive
        );
    }

    /// <summary>
    /// ユーザーがワークスペースにアクセス可能かつメンバーであるかをチェック
    /// 1回のクエリでアクセスチェックとメンバーチェックを行い、重複検索を防ぐ
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="includeInactive">非アクティブなワークスペースも含めるか（デフォルト: false、Admin用にtrue）</param>
    /// <returns>アクセス可能フラグ、メンバーフラグ、ワークスペース情報</returns>
    public async Task<(bool hasAccess, bool isMember, Workspace? workspace)> CheckWorkspaceAccessAndMembershipAsync(
        int userId,
        int workspaceId,
        bool includeInactive = false
    )
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return (false, false, null);
        }

        var workspace = await _context.Workspaces
            .Include(w => w.Organization)
            .Include(w => w.Genre)
            .FirstOrDefaultAsync(w => w.Id == workspaceId);

        if (workspace == null || workspace.OrganizationId != organizationId.Value)
        {
            return (false, false, null);
        }

        // 非アクティブチェック（includeInactive = false の場合のみ）
        if (!includeInactive && !workspace.IsActive)
        {
            return (false, false, null);
        }

        // メンバーチェック
        var isMember = await _context.WorkspaceUsers.AnyAsync(wu =>
            wu.WorkspaceId == workspaceId
            && wu.UserId == userId
            && wu.User != null
            && wu.User.IsActive
        );

        return (true, isMember, workspace);
    }

    /// <summary>
    /// ユーザーがワークスペースのアクティブなメンバーでない場合に例外をスロー
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="errorMessage">エラーメッセージ（省略時はデフォルトメッセージ）</param>
    /// <exception cref="InvalidOperationException">メンバーでない場合</exception>
    public async Task EnsureActiveWorkspaceMemberAsync(
        int userId,
        int workspaceId,
        string? errorMessage = null
    )
    {
        var isMember = await IsActiveWorkspaceMemberAsync(userId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                errorMessage ?? "ワークスペースのメンバーのみがこの操作を実行できます。"
            );
        }
    }

    /// <summary>
    /// ユーザーが指定したワークスペースにアクセス可能かチェックし、不可の場合は例外をスロー
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="userId">ユーザーID</param>
    /// <param name="includeInactive">非アクティブなワークスペースも含めるか（デフォルト: false、Admin用にtrue）</param>
    /// <exception cref="Exceptions.NotFoundException">アクセス権がない場合</exception>
    public async Task EnsureWorkspaceAccessAsync(int workspaceId, int userId, bool includeInactive = false)
    {
        var hasAccess = await CanAccessWorkspaceAsync(userId, workspaceId, includeInactive);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }
    }

    /// <summary>
    /// ユーザーがワークスペースにアクセス可能かつ編集権限（Member以上）を持つかをチェック
    /// Viewer権限の場合は canEdit=false となる
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="includeInactive">非アクティブなワークスペースも含めるか</param>
    /// <returns>アクセス可能フラグ、編集可能フラグ、ワークスペースロール、ワークスペース情報</returns>
    public async Task<(bool hasAccess, bool canEdit, WorkspaceRole? role, Workspace? workspace)> CheckWorkspaceEditPermissionAsync(
        int userId,
        int workspaceId,
        bool includeInactive = false
    )
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return (false, false, null, null);
        }

        var workspace = await _context.Workspaces
            .Include(w => w.Organization)
            .Include(w => w.Genre)
            .FirstOrDefaultAsync(w => w.Id == workspaceId);

        if (workspace == null || workspace.OrganizationId != organizationId.Value)
        {
            return (false, false, null, null);
        }

        // 非アクティブチェック
        if (!includeInactive && !workspace.IsActive)
        {
            return (false, false, null, null);
        }

        // ワークスペースメンバーとロールを取得
        var workspaceUser = await _context.WorkspaceUsers
            .Where(wu =>
                wu.WorkspaceId == workspaceId
                && wu.UserId == userId
                && wu.User != null
                && wu.User.IsActive
            )
            .Select(wu => new { wu.WorkspaceRole })
            .FirstOrDefaultAsync();

        if (workspaceUser == null)
        {
            // メンバーではないがアクセス可能（組織内）
            return (true, false, null, workspace);
        }

        // Viewer権限の場合は編集不可
        var canEdit = workspaceUser.WorkspaceRole != WorkspaceRole.Viewer;

        return (true, canEdit, workspaceUser.WorkspaceRole, workspace);
    }

    /// <summary>
    /// ワークスペースの編集権限（Member以上）がない場合に ForbiddenException をスロー
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="errorMessage">カスタムエラーメッセージ（省略可）</param>
    /// <exception cref="NotFoundException">ワークスペースが見つからない/アクセス権がない場合</exception>
    /// <exception cref="ForbiddenException">Viewer権限の場合</exception>
    public async Task<Workspace> RequireWorkspaceEditPermissionAsync(
        int userId,
        int workspaceId,
        string? errorMessage = null
    )
    {
        var (hasAccess, canEdit, role, workspace) = await CheckWorkspaceEditPermissionAsync(userId, workspaceId);

        if (!hasAccess || workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        if (!canEdit)
        {
            throw new ForbiddenException(
                errorMessage ?? "この操作を実行する権限がありません。閲覧専用ユーザーは変更操作を行えません。"
            );
        }

        return workspace;
    }
}