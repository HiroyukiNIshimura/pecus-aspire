using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Services;

/// <summary>
/// ワークスペースアイテムのタグ管理サービス
/// </summary>
public class WorkspaceItemTagService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkspaceItemTagService> _logger;
    private readonly OrganizationAccessHelper _accessHelper;

    public WorkspaceItemTagService(
        ApplicationDbContext context,
        ILogger<WorkspaceItemTagService> logger,
        OrganizationAccessHelper accessHelper
    )
    {
        _context = context;
        _logger = logger;
        _accessHelper = accessHelper;
    }

    /// <summary>
    /// ワークスペースアイテムにタグを設定（既存のタグを置き換える）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="tagNames">タグ名のリスト</param>
    /// <param name="userId">設定するユーザーID</param>
    /// <returns>設定されたタグのリスト</returns>
    public async Task<List<Tag>> SetTagsToItemAsync(
        int workspaceId,
        int itemId,
        List<string>? tagNames,
        int userId
    )
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // アイテムの存在確認
            var item = await _context.WorkspaceItems.FirstOrDefaultAsync(wi =>
                wi.WorkspaceId == workspaceId && wi.Id == itemId
            );

            if (item == null)
            {
                throw new NotFoundException("アイテムが見つかりません。");
            }

            // ユーザーがワークスペースのメンバーか確認
            await _accessHelper.EnsureActiveWorkspaceMemberAsync(
                userId,
                workspaceId,
                "ワークスペースのメンバーのみがタグを設定できます。"
            );

            // ワークスペース情報を取得（OrganizationId取得用）
            var workspace = await _context.Workspaces.FindAsync(workspaceId);
            if (workspace == null)
            {
                throw new NotFoundException("ワークスペースが見つかりません。");
            }

            // 既存のタグ関連をすべて削除
            var existingRelations = await _context
                .WorkspaceItemTags.Where(wit => wit.WorkspaceItemId == itemId)
                .ToListAsync();
            _context.WorkspaceItemTags.RemoveRange(existingRelations);
            await _context.SaveChangesAsync();

            // 新しいタグを設定（タグ名がある場合のみ）
            var resultTags = new List<Tag>();
            if (tagNames != null && tagNames.Any())
            {
                // タグ名をクリーンアップ（重複排除、空文字除外、トリミング）
                var cleanedTagNames = tagNames
                    .Where(name => !string.IsNullOrWhiteSpace(name))
                    .Select(name => name.Trim())
                    .Distinct()
                    .ToList();

                foreach (var tagName in cleanedTagNames)
                {
                    // タグを取得または作成
                    var tag = await _context.Tags.FirstOrDefaultAsync(t =>
                        t.OrganizationId == workspace.OrganizationId && t.Name == tagName
                    );

                    if (tag == null)
                    {
                        tag = new Tag
                        {
                            OrganizationId = workspace.OrganizationId,
                            Name = tagName,
                            CreatedByUserId = userId,
                            CreatedAt = DateTime.UtcNow,
                        };
                        _context.Tags.Add(tag);
                        await _context.SaveChangesAsync(); // タグIDを取得するため保存
                    }

                    // WorkspaceItemTagを作成
                    var workspaceItemTag = new WorkspaceItemTag
                    {
                        WorkspaceItemId = itemId,
                        TagId = tag.Id,
                        CreatedByUserId = userId,
                        CreatedAt = DateTime.UtcNow,
                    };

                    _context.WorkspaceItemTags.Add(workspaceItemTag);
                    resultTags.Add(tag);
                }
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return resultTags;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
