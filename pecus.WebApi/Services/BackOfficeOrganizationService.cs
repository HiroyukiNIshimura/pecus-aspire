using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests.BackOffice;
using Pecus.Models.Responses.BackOffice;
using Pecus.Models.Responses.Common;

namespace Pecus.Services;

/// <summary>
/// BackOffice用 組織管理サービス
/// </summary>
public class BackOfficeOrganizationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BackOfficeOrganizationService> _logger;

    public BackOfficeOrganizationService(
        ApplicationDbContext context,
        ILogger<BackOfficeOrganizationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// 組織一覧を取得
    /// </summary>
    public async Task<PagedResponse<BackOfficeOrganizationListItemResponse>> GetOrganizationsAsync(
        BackOfficeGetOrganizationsRequest request)
    {
        var query = _context.Organizations.AsNoTracking();

        var totalCount = await query.CountAsync();

        var organizations = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new BackOfficeOrganizationListItemResponse
            {
                Id = o.Id,
                Name = o.Name,
                Code = o.Code,
                RepresentativeName = o.RepresentativeName,
                PhoneNumber = o.PhoneNumber,
                Email = o.Email,
                IsActive = o.IsActive,
                IsDemo = o.IsDemo,
                CreatedAt = o.CreatedAt,
                UserCount = o.Users.Count,
                RowVersion = o.RowVersion,
            })
            .ToListAsync();

        var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

        return new PagedResponse<BackOfficeOrganizationListItemResponse>
        {
            Data = organizations,
            TotalCount = totalCount,
            CurrentPage = request.Page,
            PageSize = request.PageSize,
            TotalPages = totalPages,
            HasPreviousPage = request.Page > 1,
            HasNextPage = request.Page < totalPages,
        };
    }

    /// <summary>
    /// 組織詳細を取得
    /// </summary>
    public async Task<BackOfficeOrganizationDetailResponse> GetOrganizationAsync(int id)
    {
        var organization = await _context.Organizations
            .AsNoTracking()
            .Where(o => o.Id == id)
            .Select(o => new BackOfficeOrganizationDetailResponse
            {
                Id = o.Id,
                Name = o.Name,
                Code = o.Code,
                Description = o.Description,
                RepresentativeName = o.RepresentativeName,
                PhoneNumber = o.PhoneNumber,
                Email = o.Email,
                IsActive = o.IsActive,
                IsDemo = o.IsDemo,
                CreatedAt = o.CreatedAt,
                UpdatedAt = o.UpdatedAt,
                UserCount = o.Users.Count,
                WorkspaceCount = o.Workspaces.Count,
                RowVersion = o.RowVersion,
            })
            .FirstOrDefaultAsync();

        if (organization == null)
        {
            throw new NotFoundException("組織が見つかりません。");
        }

        return organization;
    }

    /// <summary>
    /// 組織を更新
    /// </summary>
    public async Task<BackOfficeOrganizationDetailResponse> UpdateOrganizationAsync(
        int id,
        BackOfficeUpdateOrganizationRequest request,
        int updatedByUserId)
    {
        var organization = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Id == id);

        if (organization == null)
        {
            throw new NotFoundException("組織が見つかりません。");
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
            throw new BadRequestException("組織は他のユーザーによって更新されました。最新のデータを再取得してください。");
        }

        _logger.LogInformation("組織を更新しました: OrganizationId={OrganizationId}", id);

        return await GetOrganizationAsync(id);
    }

    /// <summary>
    /// 組織を物理削除（関連データすべて削除）
    /// </summary>
    /// <remarks>
    /// 組織に関連するすべてのデータを物理削除します。
    /// 削除順序はFK依存関係を考慮しています。
    /// </remarks>
    public async Task DeleteOrganizationAsync(
        int id,
        BackOfficeDeleteOrganizationRequest request)
    {
        var organization = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Id == id);

        if (organization == null)
        {
            throw new NotFoundException("組織が見つかりません。");
        }

        if (organization.Code != request.ConfirmOrganizationCode)
        {
            throw new BadRequestException("確認用の組織コードが一致しません。");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var workspaceIds = await _context.Workspaces
                .Where(w => w.OrganizationId == id)
                .Select(w => w.Id)
                .ToListAsync();

            var chatRoomIds = await _context.ChatRooms
                .Where(r => r.OrganizationId == id)
                .Select(r => r.Id)
                .ToListAsync();

            var userIds = await _context.Users
                .Where(u => u.OrganizationId == id)
                .Select(u => u.Id)
                .ToListAsync();

            var botIds = await _context.Bots
                .Where(b => b.OrganizationId == id)
                .Select(b => b.Id)
                .ToListAsync();

            if (chatRoomIds.Count > 0)
            {
                await _context.ChatMessages
                    .Where(m => chatRoomIds.Contains(m.ChatRoomId))
                    .ExecuteDeleteAsync();

                await _context.ChatRoomMembers
                    .Where(m => chatRoomIds.Contains(m.ChatRoomId))
                    .ExecuteDeleteAsync();
            }

            await _context.ChatRooms
                .Where(r => r.OrganizationId == id)
                .ExecuteDeleteAsync();

            if (userIds.Count > 0)
            {
                await _context.ChatActors
                    .Where(a => userIds.Contains(a.UserId!.Value))
                    .ExecuteDeleteAsync();
            }

            if (botIds.Count > 0)
            {
                await _context.ChatActors
                    .Where(a => botIds.Contains(a.BotId!.Value))
                    .ExecuteDeleteAsync();
            }

            await _context.Bots
                .Where(b => b.OrganizationId == id)
                .ExecuteDeleteAsync();

            if (workspaceIds.Count > 0)
            {
                await _context.Activities
                    .Where(a => workspaceIds.Contains(a.WorkspaceId))
                    .ExecuteDeleteAsync();

                var taskIds = await _context.WorkspaceTasks
                    .Where(t => workspaceIds.Contains(t.WorkspaceId))
                    .Select(t => t.Id)
                    .ToListAsync();

                if (taskIds.Count > 0)
                {
                    await _context.TaskComments
                        .Where(c => taskIds.Contains(c.WorkspaceTaskId))
                        .ExecuteDeleteAsync();
                }

                await _context.WorkspaceTasks
                    .Where(t => workspaceIds.Contains(t.WorkspaceId))
                    .ExecuteDeleteAsync();

                var itemIds = await _context.WorkspaceItems
                    .Where(i => workspaceIds.Contains(i.WorkspaceId))
                    .Select(i => i.Id)
                    .ToListAsync();

                if (itemIds.Count > 0)
                {
                    await _context.WorkspaceItemAttachments
                        .Where(a => itemIds.Contains(a.WorkspaceItemId))
                        .ExecuteDeleteAsync();

                    await _context.WorkspaceItemRelations
                        .Where(r => itemIds.Contains(r.FromItemId) || itemIds.Contains(r.ToItemId))
                        .ExecuteDeleteAsync();

                    await _context.WorkspaceItemTags
                        .Where(t => itemIds.Contains(t.WorkspaceItemId))
                        .ExecuteDeleteAsync();

                    await _context.WorkspaceItemPins
                        .Where(p => itemIds.Contains(p.WorkspaceItemId))
                        .ExecuteDeleteAsync();
                }

                await _context.WorkspaceItems
                    .Where(i => workspaceIds.Contains(i.WorkspaceId))
                    .ExecuteDeleteAsync();

                await _context.WorkspaceSkills
                    .Where(s => workspaceIds.Contains(s.WorkspaceId))
                    .ExecuteDeleteAsync();

                await _context.WorkspaceUsers
                    .Where(u => workspaceIds.Contains(u.WorkspaceId))
                    .ExecuteDeleteAsync();
            }

            await _context.Workspaces
                .Where(w => w.OrganizationId == id)
                .ExecuteDeleteAsync();

            if (userIds.Count > 0)
            {
                await _context.UserSkills
                    .Where(s => userIds.Contains(s.UserId))
                    .ExecuteDeleteAsync();

                await _context.UserSettings
                    .Where(s => userIds.Contains(s.UserId))
                    .ExecuteDeleteAsync();

                await _context.RefreshTokens
                    .Where(t => userIds.Contains(t.UserId))
                    .ExecuteDeleteAsync();

                await _context.Devices
                    .Where(d => userIds.Contains(d.UserId))
                    .ExecuteDeleteAsync();

                await _context.EmailChangeTokens
                    .Where(t => userIds.Contains(t.UserId))
                    .ExecuteDeleteAsync();
            }

            await _context.Tags
                .Where(t => t.OrganizationId == id)
                .ExecuteDeleteAsync();

            await _context.Skills
                .Where(s => s.OrganizationId == id)
                .ExecuteDeleteAsync();

            // WorkspaceItemRelations は CreatedByUserId で Users を参照しているため、
            // Users 削除前に組織に属するユーザーが作成した全てのリレーションを削除
            if (userIds.Count > 0)
            {
                await _context.WorkspaceItemRelations
                    .Where(r => userIds.Contains(r.CreatedByUserId))
                    .ExecuteDeleteAsync();
            }

            await _context.Users
                .Where(u => u.OrganizationId == id)
                .ExecuteDeleteAsync();

            await _context.OrganizationSettings
                .Where(s => s.OrganizationId == id)
                .ExecuteDeleteAsync();

            _context.Organizations.Remove(organization);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            _logger.LogWarning(
                "組織を物理削除しました: OrganizationId={OrganizationId}, OrganizationName={OrganizationName}",
                id,
                organization.Name);
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync();
            throw new BadRequestException("組織は他のユーザーによって更新されました。");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "組織の削除に失敗しました: OrganizationId={OrganizationId}", id);
            throw;
        }
    }
}
