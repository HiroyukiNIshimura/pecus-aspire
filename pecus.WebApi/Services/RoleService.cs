using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests;

namespace Pecus.Services;

/// <summary>
/// ロール管理サービス
/// </summary>
public class RoleService
{
    private readonly ApplicationDbContext _context;

    public RoleService(ApplicationDbContext context) => _context = context;

    /// <summary>
    /// ロールを作成
    /// </summary>
    public async Task<Role> CreateRoleAsync(CreateRoleRequest request, int? createdByUserId = null)
    {
        // 既存ロールチェック
        if (await _context.Roles.AnyAsync(r => r.Name == request.Name))
        {
            throw new DuplicateException("ロール名は既に使用されています。");
        }

        var role = new Role
        {
            Name = request.Name,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = createdByUserId,
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync();

        return role;
    }

    /// <summary>
    /// ロールに権限を追加
    /// </summary>
    public async Task<bool> AddPermissionToRoleAsync(
        int roleId,
        int permissionId,
        int? updatedByUserId = null
    )
    {
        var role = await _context
            .Roles.Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Id == roleId);

        if (role == null)
        {
            return false;
        }

        var permission = await _context.Permissions.FindAsync(permissionId);
        if (permission == null)
        {
            return false;
        }

        if (!role.Permissions.Contains(permission))
        {
            role.Permissions.Add(permission);
            role.UpdatedAt = DateTime.UtcNow;
            role.UpdatedByUserId = updatedByUserId;
            await _context.SaveChangesAsync();
        }

        return true;
    }

    /// <summary>
    /// ロールから権限を削除
    /// </summary>
    public async Task<bool> RemovePermissionFromRoleAsync(
        int roleId,
        int permissionId,
        int? updatedByUserId = null
    )
    {
        var role = await _context
            .Roles.Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Id == roleId);

        if (role == null)
        {
            return false;
        }

        var permission = role.Permissions.FirstOrDefault(p => p.Id == permissionId);
        if (permission == null)
        {
            return false;
        }

        role.Permissions.Remove(permission);
        role.UpdatedAt = DateTime.UtcNow;
        role.UpdatedByUserId = updatedByUserId;
        await _context.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// ロールIDで取得（権限を含む）
    /// </summary>
    public async Task<Role?> GetRoleByIdAsync(int roleId) =>
        await _context.Roles.Include(r => r.Permissions).FirstOrDefaultAsync(r => r.Id == roleId);

    /// <summary>
    /// ロール名で取得（権限を含む）
    /// </summary>
    public async Task<Role?> GetRoleByNameAsync(string name) =>
        await _context.Roles.Include(r => r.Permissions).FirstOrDefaultAsync(r => r.Name == name);

    /// <summary>
    /// 全ロールを取得（権限を含む）
    /// </summary>
    public async Task<List<Role>> GetAllRolesAsync() =>
        await _context.Roles.Include(r => r.Permissions).ToListAsync();

    /// <summary>
    /// ロールを削除
    /// </summary>
    public async Task<bool> DeleteRoleAsync(int roleId)
    {
        var role = await _context.Roles.FindAsync(roleId);
        if (role == null)
        {
            return false;
        }

        _context.Roles.Remove(role);
        await _context.SaveChangesAsync();
        return true;
    }
}
