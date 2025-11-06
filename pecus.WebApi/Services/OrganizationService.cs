using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
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
    public async Task<(Organization organization, User adminUser)> CreateOrganizationWithUserAsync(
        CreateOrganizationRequest request
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
                CreatedByUserId = null,
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

            // 組織の作成者を管理者ユーザーに設定
            organization.CreatedByUserId = adminUser.Id;
            await _context.SaveChangesAsync();

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
    /// 組織を更新（管理者用）
    /// </summary>
    public async Task<Organization> AdminUpdateOrganizationAsync(
        int organizationId,
        AdminUpdateOrganizationRequest request,
        int? updatedByUserId = null
    )
    {
        var organization = await _context.Organizations.FindAsync(organizationId);
        if (organization == null)
        {
            throw new NotFoundException("組織が見つかりません。");
        }

        if (request.Name != null)
        {
            organization.Name = request.Name;
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

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // 最新データを取得
            var latestOrganization = await _context.Organizations.FindAsync(organizationId);
            throw new ConcurrencyException<Organization>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                latestOrganization
            );
        }

        return organization;
    }
    public async Task<Organization> BackendUpdateOrganizationAsync(
        int organizationId,
        BackendUpdateOrganizationRequest request,
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

        if (request.IsActive.HasValue)
        {
            organization.IsActive = request.IsActive.Value;
        }

        organization.UpdatedAt = DateTime.UtcNow;
        organization.UpdatedByUserId = updatedByUserId;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // 最新データを取得
            var latestOrganization = await _context.Organizations.FindAsync(organizationId);
            throw new ConcurrencyException<Organization>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                latestOrganization
            );
        }

        return organization;
    }

    /// <summary>
    /// 組織を削除
    /// </summary>
    public async Task<bool> DeleteOrganizationAsync(
        int organizationId,
        DeleteOrganizationRequest request
    )
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
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
    /// 組織のアクティブ状態を設定
    /// </summary>
    public async Task<bool> SetOrganizationActiveStatusAsync(
        int organizationId,
        SetOrganizationActiveStatusRequest request,
        int? updatedByUserId = null
    )
    {
        var organization = await _context.Organizations.FindAsync(organizationId);
        if (organization == null)
        {
            return false;
        }

        // 楽観的ロック：RowVersion を検証
        organization.IsActive = request.IsActive;
        organization.UpdatedAt = DateTime.UtcNow;
        organization.UpdatedByUserId = updatedByUserId;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // 最新データを取得
            var latestOrganization = await _context.Organizations.FindAsync(organizationId);
            throw new ConcurrencyException<Organization>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                latestOrganization
            );
        }

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
