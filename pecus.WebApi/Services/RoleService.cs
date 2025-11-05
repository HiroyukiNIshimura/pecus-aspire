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

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyException(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。"
            );
        }

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

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new ConcurrencyException(
                    "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。"
                );
            }
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

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyException(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。"
            );
        }

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
    /// ロールに権限を設定（既存の権限を置き換える）
    /// </summary>
    public async Task<List<Permission>> SetPermissionsToRoleAsync(
        int roleId,
        List<int>? permissionIds,
        int? updatedByUserId = null
    )
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // ロールの存在確認
            var role = await _context
                .Roles.Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == roleId);

            if (role == null)
            {
                throw new NotFoundException("ロールが見つかりません。");
            }

            // 既存の権限関連をすべて削除
            role.Permissions.Clear();
            role.UpdatedAt = DateTime.UtcNow;
            role.UpdatedByUserId = updatedByUserId;
            await _context.SaveChangesAsync();

            // 新しい権限を設定（権限IDがある場合のみ）
            var resultPermissions = new List<Permission>();
            if (permissionIds != null && permissionIds.Any())
            {
                // 重複を排除
                var distinctPermissionIds = permissionIds.Distinct().ToList();

                foreach (var permissionId in distinctPermissionIds)
                {
                    // 権限の存在確認
                    var permission = await _context.Permissions.FindAsync(permissionId);
                    if (permission == null)
                    {
                        throw new NotFoundException($"権限ID {permissionId} が見つかりません。");
                    }

                    // 権限を追加
                    role.Permissions.Add(permission);
                    resultPermissions.Add(permission);
                }

                role.UpdatedAt = DateTime.UtcNow;
                role.UpdatedByUserId = updatedByUserId;
                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();

            return resultPermissions;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

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