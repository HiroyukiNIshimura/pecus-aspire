using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Libs;

/// <summary>
/// ワークスペースへのアクセス権限チェックを行うヘルパークラス
/// </summary>
public class WorkspaceAccessHelper
{
    private readonly ApplicationDbContext _context;

    public WorkspaceAccessHelper(ApplicationDbContext context)
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
            .Users.Where(u => u.Id == userId)
            .Select(u => new { u.OrganizationId })
            .FirstOrDefaultAsync();

        return user?.OrganizationId;
    }

    /// <summary>
    /// ユーザーが指定したワークスペースにアクセス可能かチェック
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <returns>アクセス可能な場合はtrueとワークスペース、不可能な場合はfalseとnull</returns>
    public async Task<(bool hasAccess, Workspace? workspace)> CheckWorkspaceAccessAsync(
        int userId,
        int workspaceId
    )
    {
        var organizationId = await GetUserOrganizationIdAsync(userId);
        if (!organizationId.HasValue)
        {
            return (false, null);
        }

        var workspace = await _context
            .Workspaces.Include(w => w.Organization)
            .FirstOrDefaultAsync(w => w.Id == workspaceId);

        if (workspace == null || workspace.OrganizationId != organizationId.Value)
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
    /// <returns>アクセス可能な場合はtrue、不可能な場合はfalse</returns>
    public async Task<bool> CanAccessWorkspaceAsync(int userId, int workspaceId)
    {
        var (hasAccess, _) = await CheckWorkspaceAccessAsync(userId, workspaceId);
        return hasAccess;
    }
}
