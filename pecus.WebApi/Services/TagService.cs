using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests.Tag;

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
        int organizationId,
        CreateTagRequest request,
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
        };

        _context.Tags.Add(tag);
        await _context.SaveChangesAsync();

        // 作成後、ナビゲーションプロパティを読み込む
        await _context.Entry(tag).Reference(t => t.Organization).LoadAsync();
        await _context.Entry(tag).Reference(t => t.CreatedByUser).LoadAsync();

        _logger.LogInformation(
            "タグを作成しました。TagId: {TagId}, Name: {Name}, OrganizationId: {OrganizationId}",
            tag.Id,
            tag.Name,
            organizationId
        );

        return tag;
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
    /// タグ更新
    /// </summary>
    public async Task<Tag> UpdateTagAsync(int organizationId, int tagId, UpdateTagRequest request)
    {
        var tag = await _context.Tags.FirstOrDefaultAsync(t =>
            t.Id == tagId && t.OrganizationId == organizationId
        );

        if (tag == null)
        {
            throw new NotFoundException("タグが見つかりません。");
        }

        // 同じ組織内で同じタグ名が存在しないか確認（自分自身は除外）
        var existingTag = await _context.Tags.FirstOrDefaultAsync(t =>
            t.OrganizationId == organizationId && t.Name == request.Name && t.Id != tagId
        );
        if (existingTag != null)
        {
            throw new DuplicateException("同じ名前のタグが既に存在します。");
        }

        tag.Name = request.Name;
        tag.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // 更新後、ナビゲーションプロパティを読み込む
        await _context.Entry(tag).Reference(t => t.Organization).LoadAsync();
        await _context.Entry(tag).Reference(t => t.CreatedByUser).LoadAsync();
        await _context.Entry(tag).Collection(t => t.WorkspaceItemTags).LoadAsync();

        _logger.LogInformation(
            "タグを更新しました。TagId: {TagId}, Name: {Name}",
            tag.Id,
            tag.Name
        );

        return tag;
    }

    /// <summary>
    /// タグ削除
    /// </summary>
    public async Task DeleteTagAsync(int organizationId, int tagId)
    {
        var tag = await _context.Tags.FirstOrDefaultAsync(t =>
            t.Id == tagId && t.OrganizationId == organizationId
        );

        if (tag == null)
        {
            throw new NotFoundException("タグが見つかりません。");
        }

        _context.Tags.Remove(tag);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "タグを削除しました。TagId: {TagId}, Name: {Name}",
            tag.Id,
            tag.Name
        );
    }
}
