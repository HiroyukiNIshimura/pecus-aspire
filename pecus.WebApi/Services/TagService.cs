using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Services;

/// <summary>
/// タグサービス
/// </summary>
public class TagService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TagService> _logger;

    public TagService(ApplicationDbContext context, ILogger<TagService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// タグ作成
    /// </summary>
    public async Task<Tag> CreateTagAsync(
        CreateTagRequest request,
        int organizationId,
        int createdByUserId
    )
    {
        // 組織の存在確認
        var organizationExists = await _context.Organizations.AnyAsync(o => o.Id == organizationId);
        if (!organizationExists)
        {
            throw new NotFoundException("組織が見つかりません。");
        }

        // 同じ組織内で同じタグ名が存在しないか確認
        var existingTag = await _context.Tags.FirstOrDefaultAsync(t =>
            t.OrganizationId == organizationId && t.Name == request.Name
        );
        if (existingTag != null)
        {
            throw new DuplicateException("同じ名前のタグが既に存在します。");
        }

        var tag = new Tag
        {
            OrganizationId = organizationId,
            Name = request.Name,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true,
        };

        _context.Tags.Add(tag);
        await _context.SaveChangesAsync();

        _logger.LogDebug(
            "タグを作成しました。TagId: {TagId}, Name: {Name}, OrganizationId: {OrganizationId}",
            tag.Id,
            tag.Name,
            organizationId
        );

        return tag;
    }

    /// <summary>
    /// タグ取得
    /// </summary>
    public async Task<Tag?> GetTagByIdAsync(int tagId, int organizationId)
    {
        return await _context.Tags
            .Include(t => t.CreatedByUser)
            .Include(t => t.WorkspaceItemTags)
            .FirstOrDefaultAsync(t => t.Id == tagId && t.OrganizationId == organizationId);
    }

    /// <summary>
    /// 組織のタグ一覧取得
    /// </summary>
    public async Task<List<Tag>> GetTagsByOrganizationAsync(int organizationId)
    {
        var tags = await _context
            .Tags.Include(t => t.CreatedByUser)
            .Include(t => t.WorkspaceItemTags)
            .Where(t => t.OrganizationId == organizationId)
            .OrderBy(t => t.Name)
            .ToListAsync();

        return tags;
    }

    /// <summary>
    /// 組織のタグ一覧取得（ページネーション）
    /// </summary>
    public async Task<(List<Tag> tags, int totalCount)> GetTagsByOrganizationPagedAsync(
        int organizationId,
        int page,
        int pageSize,
        bool? isActive = null,
        bool? unusedOnly = null,
        string? name = null
    )
    {
        var query = _context
            .Tags
            .Include(t => t.CreatedByUser)
            .Include(t => t.WorkspaceItemTags)
            .Where(t => t.OrganizationId == organizationId);

        if (isActive.HasValue)
        {
            query = query.Where(t => t.IsActive == isActive.Value);
        }

        if (unusedOnly.HasValue && unusedOnly.Value)
        {
            // 未使用タグ（アイテムが0件）のみを取得
            query = query.Where(t => !t.WorkspaceItemTags.Any());
        }

        if (!string.IsNullOrEmpty(name))
        {
            query = query.Where(t => t.Name.StartsWith(name));
        }

        var totalCount = await query.CountAsync();

        var tags = await query
            .OrderBy(t => t.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (tags, totalCount);
    }

    /// <summary>
    /// タグ更新
    /// </summary>
    public async Task<Tag> UpdateTagAsync(
        int tagId,
        int organizationId,
        UpdateTagRequest request,
        int? updatedByUserId = null
    )
    {
        var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Id == tagId && t.OrganizationId == organizationId);

        if (tag == null)
        {
            throw new NotFoundException("タグが見つかりません。");
        }

        // 同じ組織内で同じタグ名が存在しないか確認（自分自身は除外）
        var existingTag = await _context.Tags.FirstOrDefaultAsync(t =>
            t.OrganizationId == tag.OrganizationId && t.Name == request.Name && t.Id != tagId
        );
        if (existingTag != null)
        {
            throw new DuplicateException("同じ名前のタグが既に存在します。");
        }

        tag.Name = request.Name;
        tag.UpdatedAt = DateTime.UtcNow;
        tag.UpdatedByUserId = updatedByUserId;

        _context.Tags.Update(tag);

        // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
        _context.Entry(tag).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(tagId);
        }

        _logger.LogDebug(
            "タグを更新しました。TagId: {TagId}, Name: {Name}",
            tag.Id,
            tag.Name
        );

        return tag;
    }

    /// <summary>
    /// タグ削除
    /// </summary>
    public async Task<bool> DeleteTagAsync(int tagId, int organizationId)
    {
        var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Id == tagId && t.OrganizationId == organizationId);

        if (tag == null)
        {
            return false;
        }

        _context.Tags.Remove(tag);
        await _context.SaveChangesAsync();

        _logger.LogDebug(
            "タグを削除しました。TagId: {TagId}, Name: {Name}",
            tag.Id,
            tag.Name
        );

        return true;
    }

    /// <summary>
    /// タグ無効化
    /// </summary>
    public async Task<bool> DeactivateTagAsync(int tagId, int organizationId, int? updatedByUserId = null)
    {
        var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Id == tagId && t.OrganizationId == organizationId);
        if (tag == null)
        {
            return false;
        }

        tag.IsActive = false;
        tag.UpdatedAt = DateTime.UtcNow;
        tag.UpdatedByUserId = updatedByUserId;

        _context.Tags.Update(tag);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(tagId);
        }

        _logger.LogDebug(
            "タグを無効化しました。TagId: {TagId}, Name: {Name}",
            tag.Id,
            tag.Name
        );

        return true;
    }

    /// <summary>
    /// タグ有効化
    /// </summary>
    public async Task<bool> ActivateTagAsync(int tagId, int organizationId, int? updatedByUserId = null)
    {
        var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Id == tagId && t.OrganizationId == organizationId);
        if (tag == null)
        {
            return false;
        }

        tag.IsActive = true;
        tag.UpdatedAt = DateTime.UtcNow;
        tag.UpdatedByUserId = updatedByUserId;

        _context.Tags.Update(tag);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(tagId);
        }

        _logger.LogDebug(
            "タグを有効化しました。TagId: {TagId}, Name: {Name}",
            tag.Id,
            tag.Name
        );

        return true;
    }

    /// <summary>
    /// 組織のアクティブなタグ一覧取得
    /// </summary>
    public async Task<List<Tag>> GetActiveTagsByOrganizationAsync(int organizationId)
    {
        return await _context
            .Tags.Where(t => t.OrganizationId == organizationId && t.IsActive)
            .OrderBy(t => t.Name)
            .ToListAsync();
    }

    /// <summary>
    /// 組織内のタグ総数取得
    /// </summary>
    public async Task<int> GetTagCountByOrganizationAsync(int organizationId)
    {
        return await _context.Tags.CountAsync(t => t.OrganizationId == organizationId);
    }

    /// <summary>
    /// 組織のタグ統計情報を取得
    /// </summary>
    public async Task<TagStatistics> GetTagStatisticsByOrganizationAsync(
        int organizationId
    )
    {
        var tags = await _context
            .Tags
            .Where(t => t.OrganizationId == organizationId)
            .Include(t => t.WorkspaceItemTags)
            .ToListAsync();

        var totalTags = tags.Count;
        var activeTags = tags.Count(t => t.IsActive);
        var inactiveTags = totalTags - activeTags;

        // 利用されているタグのトップ５（降順）
        var topUsedTags = tags
            .Where(t => t.WorkspaceItemTags?.Count > 0)
            .OrderByDescending(t => t.WorkspaceItemTags!.Count)
            .Take(5)
            .Select(t => new Models.Responses.Tag.TagUsageItem
            {
                Id = t.Id,
                Name = t.Name,
            })
            .ToList();

        // 利用されていないタグのリスト
        var unusedTags = tags
            .Where(t => t.WorkspaceItemTags?.Count == 0)
            .OrderBy(t => t.Name)
            .Select(t => new Models.Responses.Tag.TagUsageItem
            {
                Id = t.Id,
                Name = t.Name,
            })
            .ToList();

        return new Models.Responses.Tag.TagStatistics
        {
            TotalTags = totalTags,
            ActiveTags = activeTags,
            InactiveTags = inactiveTags,
            TopUsedTags = topUsedTags,
            UnusedTags = unusedTags,
        };
    }

    private async Task RaiseConflictException(int tagId)
    {
        var latestTag = await _context.Tags.FindAsync(tagId);
        if (latestTag == null)
        {
            throw new NotFoundException("タグが見つかりません。");
        }
        throw new ConcurrencyException<TagDetailResponse>(
            "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
            new TagDetailResponse
            {
                Id = latestTag.Id,
                Name = latestTag.Name,
                OrganizationId = latestTag.OrganizationId,
                CreatedAt = latestTag.CreatedAt,
                CreatedByUserId = latestTag.CreatedByUserId,
                UpdatedAt = latestTag.UpdatedAt,
                UpdatedByUserId = latestTag.UpdatedByUserId,
                IsActive = latestTag.IsActive,
                RowVersion = latestTag.RowVersion!,
            }
        );
    }
}