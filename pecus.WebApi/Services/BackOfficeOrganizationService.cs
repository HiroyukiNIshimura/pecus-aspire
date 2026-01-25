using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.DB.Services;
using Pecus.Models.Requests.BackOffice;
using Pecus.Models.Responses.BackOffice;

namespace Pecus.Services;

/// <summary>
/// BackOffice用 組織管理サービス
/// </summary>
public class BackOfficeOrganizationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BackOfficeOrganizationService> _logger;
    private readonly BatchOrganizationDeletionService _organizationDeletionService;

    public BackOfficeOrganizationService(
        ApplicationDbContext context,
        ILogger<BackOfficeOrganizationService> logger,
        BatchOrganizationDeletionService organizationDeletionService)
    {
        _context = context;
        _logger = logger;
        _organizationDeletionService = organizationDeletionService;
    }

    /// <summary>
    /// 組織に紐づくボット一覧を取得
    /// Bot はグローバルに存在するため、全てのグローバル Bot を返す
    /// </summary>
    public async Task<List<BackOfficeBotResponse>> GetBotsByOrganizationIdAsync(int organizationId)
    {
        var organization = await _context.Organizations
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (organization == null)
        {
            throw new NotFoundException("組織が見つかりません。");
        }

        // Bot はグローバルに存在するため、全ての Bot を返す
        var bots = await _context.Bots
            .AsNoTracking()
            .OrderBy(b => b.Type)
            .ThenBy(b => b.Name)
            .Select(b => new BackOfficeBotResponse
            {
                Id = b.Id,
                Name = b.Name,
                Type = b.Type,
                Persona = b.Persona,
                Constraint = b.Constraint,
                IconUrl = b.IconUrl,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt,
                RowVersion = b.RowVersion,
            })
            .ToListAsync();

        return bots;
    }

    /// <summary>
    /// ボットのPersona/Constraintを更新
    /// </summary>
    public async Task<BackOfficeBotResponse> UpdateBotPersonaAsync(
        int botId,
        BackOfficeUpdateBotPersonaRequest request)
    {
        var bot = await _context.Bots
            .FirstOrDefaultAsync(b => b.Id == botId);

        if (bot == null)
        {
            throw new NotFoundException("ボットが見つかりません。");
        }

        bot.Persona = request.Persona;
        bot.Constraint = request.Constraint;
        bot.UpdatedAt = DateTimeOffset.UtcNow;

        _context.Entry(bot).Property(b => b.RowVersion).OriginalValue = request.RowVersion;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            var latestBot = await _context.Bots.FindAsync(botId);
            var conflictedResponse = latestBot != null
                ? new BackOfficeBotResponse
                {
                    Id = latestBot.Id,
                    Name = latestBot.Name,
                    Type = latestBot.Type,
                    Persona = latestBot.Persona,
                    Constraint = latestBot.Constraint,
                    IconUrl = latestBot.IconUrl,
                    CreatedAt = latestBot.CreatedAt,
                    UpdatedAt = latestBot.UpdatedAt,
                    RowVersion = latestBot.RowVersion,
                }
                : null;
            throw new ConcurrencyException<BackOfficeBotResponse>(
                "ボットは他のユーザーによって更新されました。最新のデータを再取得してください。",
                conflictedResponse
            );
        }

        _logger.LogInformation("ボットのPersona/Constraintを更新しました: BotId={BotId}", botId);

        return new BackOfficeBotResponse
        {
            Id = bot.Id,
            Name = bot.Name,
            Type = bot.Type,
            Persona = bot.Persona,
            Constraint = bot.Constraint,
            IconUrl = bot.IconUrl,
            CreatedAt = bot.CreatedAt,
            UpdatedAt = bot.UpdatedAt,
            RowVersion = bot.RowVersion,
        };
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

        // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
        _context.Entry(organization).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

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

        try
        {
            await _organizationDeletionService.DeleteOrganizationWithRelatedDataAsync(id);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new BadRequestException("組織は他のユーザーによって更新されました。");
        }
    }

    /// <summary>
    /// 組織の管理者ユーザーを取得（Adminロールを持つ最初のユーザー）
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <returns>管理者ユーザー（見つからない場合はnull）</returns>
    public async Task<User?> GetOrganizationAdminUserAsync(int organizationId)
    {
        return await _context.Users
            .Include(u => u.Roles)
            .Where(u => u.OrganizationId == organizationId && u.IsActive)
            .Where(u => u.Roles.Any(r => r.Name == SystemRole.Admin))
            .OrderBy(u => u.CreatedAt)
            .FirstOrDefaultAsync();
    }
}