using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

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

    /// <summary>
    /// ユーザーがワークスペースのアクティブなメンバーかチェック
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <returns>アクティブなメンバーの場合はtrue、それ以外はfalse</returns>
    public async Task<bool> IsActiveWorkspaceMemberAsync(int userId, int workspaceId)
    {
        return await _context.WorkspaceUsers.AnyAsync(wu =>
            wu.WorkspaceId == workspaceId
            && wu.UserId == userId
            && wu.User != null
            && wu.User.IsActive
        );
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
    /// 2つのユーザーが同じ組織に所属しているかチェック
    /// </summary>
    /// <param name="userId1">ユーザーID1</param>
    /// <param name="userId2">ユーザーID2</param>
    /// <returns>同じ組織に所属している場合はtrue、異なる場合またはいずれかのユーザーが見つからない場合はfalse</returns>
    public async Task<bool> AreUsersInSameOrganizationAsync(int userId1, int userId2)
    {
        var org1 = await GetUserOrganizationIdAsync(userId1);
        var org2 = await GetUserOrganizationIdAsync(userId2);

        return org1.HasValue && org2.HasValue && org1.Value == org2.Value;
    }

    /// <summary>
    /// 指定したユーザーが操作対象ユーザーにアクセス可能かチェック（同じ組織の確認）
    /// </summary>
    /// <param name="operatingUserId">操作を行うユーザーID</param>
    /// <param name="targetUserId">操作対象のユーザーID</param>
    /// <returns>アクセス可能な場合はtrue、不可能な場合はfalse</returns>
    public async Task<bool> CanAccessUserAsync(int operatingUserId, int targetUserId)
    {
        // 操作対象ユーザーが存在しない場合はfalse
        if (!await UserExistsAsync(targetUserId))
        {
            return false;
        }

        // 同じ組織に所属しているかチェック
        return await AreUsersInSameOrganizationAsync(operatingUserId, targetUserId);
    }

    /// <summary>
    /// ユーザーが存在するかチェック
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>存在する場合はtrue、存在しない場合はfalse</returns>
    private async Task<bool> UserExistsAsync(int userId)
    {
        return await _context.Users.AnyAsync(u => u.Id == userId && u.IsActive);
    }
}
