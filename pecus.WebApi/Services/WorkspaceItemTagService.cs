using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests.WorkspaceItem;

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
    /// <param name="tagRequests">タグ情報のリスト（ID、RowVersion、名前を含む）</param>
    /// <param name="userId">設定するユーザーID</param>
    /// <param name="itemRowVersion">アイテムの楽観的ロック用のRowVersion</param>
    /// <returns>設定されたタグのリスト</returns>
    public async Task<List<Tag>> SetTagsToItemAsync(
        int workspaceId,
        int itemId,
        List<TagItemRequest>? tagRequests,
        int userId,
        byte[]? itemRowVersion = null
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

            // 楽観的ロック：ItemRowVersionが指定されている場合は競合チェック
            if (itemRowVersion != null && (item.RowVersion == null || !item.RowVersion.SequenceEqual(itemRowVersion)))
            {
                throw new ConcurrencyException(
                    "タグは別のユーザーにより更新されています。ページをリロードして再度お試しください。"
                );
            }

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

            // 新しいタグを設定（タグ情報がある場合のみ）
            var resultTags = new List<Tag>();
            if (tagRequests != null && tagRequests.Any())
            {
                foreach (var tagRequest in tagRequests)
                {
                    if (string.IsNullOrWhiteSpace(tagRequest.Name))
                    {
                        continue;
                    }

                    Tag? tag = null;

                    // 既存タグの場合（IDが指定されている）
                    if (tagRequest.Id.HasValue)
                    {
                        tag = await _context.Tags.FirstOrDefaultAsync(t => t.Id == tagRequest.Id.Value);
                        if (tag == null)
                        {
                            throw new NotFoundException(
                                $"タグID {tagRequest.Id.Value} が見つかりません。"
                            );
                        }

                        // 楽観的ロック：タグのRowVersionをチェック
                        if (
                            tagRequest.RowVersion != null
                            && (tag.RowVersion == null || !tag.RowVersion.SequenceEqual(tagRequest.RowVersion))
                        )
                        {
                            throw new ConcurrencyException(
                                $"タグ '{tag.Name}' は別のユーザーにより更新されています。ページをリロードして再度お試しください。"
                            );
                        }

                        // タグが同じ組織に属しているか確認
                        if (tag.OrganizationId != workspace.OrganizationId)
                        {
                            throw new InvalidOperationException(
                                $"タグ '{tag.Name}' はこのワークスペースの組織に属していません。"
                            );
                        }
                    }
                    else
                    {
                        // 新規タグの場合：名前で検索または作成
                        var trimmedName = tagRequest.Name.Trim();
                        tag = await _context.Tags.FirstOrDefaultAsync(t =>
                            t.OrganizationId == workspace.OrganizationId
                            && t.Name == trimmedName
                        );

                        if (tag == null)
                        {
                            tag = new Tag
                            {
                                OrganizationId = workspace.OrganizationId,
                                Name = trimmedName,
                                CreatedByUserId = userId,
                                CreatedAt = DateTime.UtcNow,
                            };
                            _context.Tags.Add(tag);
                            await _context.SaveChangesAsync(); // タグIDを取得するため保存
                        }
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

            // アイテムのUpdatedAtを更新（RowVersionも自動更新される）
            item.UpdatedAt = DateTime.UtcNow;
            _context.WorkspaceItems.Update(item);

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
