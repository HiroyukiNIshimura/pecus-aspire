using Microsoft.EntityFrameworkCore;
using Pecus.DB;
using Pecus.DB.Models;
using Pecus.Exceptions;
using Pecus.Models.Requests;

namespace Pecus.Services;

/// <summary>
/// 組織管理サービス
/// </summary>
public class OrganizationService
{
    private readonly ApplicationDbContext _context;
    private readonly UserService _userService;

    public OrganizationService(ApplicationDbContext context, UserService userService)
    {
        _context = context;
        _userService = userService;
    }

    /// <summary>
    /// 組織を作成（管理者ユーザーも同時作成）
    /// </summary>
    public async Task<(Organization organization, User adminUser)> CreateOrganizationAsync(
        CreateOrganizationRequest request,
        int? createdByUserId = null
    )
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 組織コードの重複チェック
            if (
                !string.IsNullOrEmpty(request.Code)
                && await _context.Organizations.AnyAsync(o => o.Code == request.Code)
            )
            {
                throw new DuplicateException("組織コードは既に使用されています。");
            }

            // 組織を作成
            var organization = new Organization
            {
                Name = request.Name,
                Code = request.Code,
                Description = request.Description,
                RepresentativeName = request.RepresentativeName,
                PhoneNumber = request.PhoneNumber,
                Email = request.Email,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = createdByUserId,
                IsActive = true,
            };

            _context.Organizations.Add(organization);
            await _context.SaveChangesAsync();

            // 管理者ユーザーを作成
            var adminUserRequest = new CreateUserRequest
            {
                Username = request.AdminUsername,
                Email = request.AdminEmail,
                Password = request.AdminPassword,
                OrganizationId = organization.Id,
            };

            var adminUser = await _userService.CreateUserAsync(adminUserRequest, null);

            await transaction.CommitAsync();
            return (organization, adminUser);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// 組織IDで取得
    /// </summary>
    public async Task<Organization?> GetOrganizationByIdAsync(int organizationId) =>
        await _context
            .Organizations.Include(o => o.Users)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

    /// <summary>
    /// 組織コードで取得
    /// </summary>
    public async Task<Organization?> GetOrganizationByCodeAsync(string code) =>
        await _context.Organizations.Include(o => o.Users).FirstOrDefaultAsync(o => o.Code == code);

    /// <summary>
    /// 組織をページネーション付きで取得
    /// </summary>
    public async Task<(
        List<Organization> organizations,
        int totalCount
    )> GetOrganizationsPagedAsync(int page, int pageSize, bool? activeOnly = null)
    {
        var query = _context.Organizations.Include(o => o.Users).AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(o => o.IsActive);
        }

        query = query.OrderBy(o => o.Id);

        var totalCount = await query.CountAsync();
        var organizations = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return (organizations, totalCount);
    }

    /// <summary>
    /// 組織を更新
    /// </summary>
    public async Task<Organization> UpdateOrganizationAsync(
        int organizationId,
        UpdateOrganizationRequest request,
        int? updatedByUserId = null
    )
    {
        var organization = await _context.Organizations.FindAsync(organizationId);
        if (organization == null)
        {
            throw new NotFoundException("組織が見つかりません。");
        }

        // 組織コードの重複チェック（自分以外）
        if (!string.IsNullOrEmpty(request.Code) && request.Code != organization.Code)
        {
            if (
                await _context.Organizations.AnyAsync(o =>
                    o.Code == request.Code && o.Id != organizationId
                )
            )
            {
                throw new DuplicateException("組織コードは既に使用されています。");
            }
        }

        if (request.Name != null)
        {
            organization.Name = request.Name;
        }

        if (request.Code != null)
        {
            organization.Code = request.Code;
        }

        if (request.Description != null)
        {
            organization.Description = request.Description;
        }

        if (request.RepresentativeName != null)
        {
            organization.RepresentativeName = request.RepresentativeName;
        }

        if (request.PhoneNumber != null)
        {
            organization.PhoneNumber = request.PhoneNumber;
        }

        if (request.Email != null)
        {
            organization.Email = request.Email;
        }

        organization.UpdatedAt = DateTime.UtcNow;
        organization.UpdatedByUserId = updatedByUserId;

        await _context.SaveChangesAsync();
        return organization;
    }

    /// <summary>
    /// 組織を削除
    /// </summary>
    public async Task<bool> DeleteOrganizationAsync(int organizationId)
    {
        var organization = await _context
            .Organizations.Include(o => o.Users)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            return false;
        }

        // 所属ユーザーも一緒に削除
        if (organization.Users.Any())
        {
            _context.Users.RemoveRange(organization.Users);
        }

        _context.Organizations.Remove(organization);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// 組織を無効化
    /// </summary>
    public async Task<bool> DeactivateOrganizationAsync(
        int organizationId,
        int? updatedByUserId = null
    )
    {
        var organization = await _context.Organizations.FindAsync(organizationId);
        if (organization == null)
        {
            return false;
        }

        organization.IsActive = false;
        organization.UpdatedAt = DateTime.UtcNow;
        organization.UpdatedByUserId = updatedByUserId;
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// 組織を有効化
    /// </summary>
    public async Task<bool> ActivateOrganizationAsync(
        int organizationId,
        int? updatedByUserId = null
    )
    {
        var organization = await _context.Organizations.FindAsync(organizationId);
        if (organization == null)
        {
            return false;
        }

        organization.IsActive = true;
        organization.UpdatedAt = DateTime.UtcNow;
        organization.UpdatedByUserId = updatedByUserId;
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// 組織の所属ユーザーを取得
    /// </summary>
    public async Task<List<User>> GetOrganizationUsersAsync(int organizationId) =>
        await _context
            .Users.Include(u => u.Roles)
            .Where(u => u.OrganizationId == organizationId)
            .ToListAsync();
}
