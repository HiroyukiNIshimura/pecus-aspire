using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests;

namespace Pecus.Services;

/// <summary>
/// 権限管理サービス
/// </summary>
public class PermissionService
{
    private readonly ApplicationDbContext _context;

    public PermissionService(ApplicationDbContext context) => _context = context;

    /// <summary>
    /// 権限を作成
    /// </summary>
    public async Task<Permission> CreatePermissionAsync(
        CreatePermissionRequest request,
        int? createdByUserId = null
    )
    {
        // 既存権限チェック
        if (await _context.Permissions.AnyAsync(p => p.Name == request.Name))
        {
            throw new DuplicateException("権限名は既に使用されています。");
        }

        var permission = new Permission
        {
            Name = request.Name,
            Description = request.Description,
            Category = request.Category,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = createdByUserId,
        };

        _context.Permissions.Add(permission);
        await _context.SaveChangesAsync();

        return permission;
    }

    /// <summary>
    /// 権限IDで取得（ロールを含む）
    /// </summary>
    public async Task<Permission?> GetPermissionByIdAsync(int permissionId) =>
        await _context
            .Permissions.Include(p => p.Roles)
            .FirstOrDefaultAsync(p => p.Id == permissionId);

    /// <summary>
    /// 権限名で取得（ロールを含む）
    /// </summary>
    public async Task<Permission?> GetPermissionByNameAsync(string name) =>
        await _context.Permissions.Include(p => p.Roles).FirstOrDefaultAsync(p => p.Name == name);

    /// <summary>
    /// カテゴリで権限を取得（ロールを含む）
    /// </summary>
    public async Task<List<Permission>> GetPermissionsByCategoryAsync(string category) =>
        await _context
            .Permissions.Include(p => p.Roles)
            .Where(p => p.Category == category)
            .ToListAsync();

    /// <summary>
    /// 全権限を取得（ロールを含む）
    /// </summary>
    public async Task<List<Permission>> GetAllPermissionsAsync() =>
        await _context.Permissions.Include(p => p.Roles).ToListAsync();

    /// <summary>
    /// 権限を削除
    /// </summary>
    public async Task<bool> DeletePermissionAsync(int permissionId)
    {
        var permission = await _context.Permissions.FindAsync(permissionId);
        if (permission == null)
        {
            return false;
        }

        _context.Permissions.Remove(permission);
        await _context.SaveChangesAsync();

        return true;
    }
}
