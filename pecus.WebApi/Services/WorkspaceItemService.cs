using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests.WorkspaceItem;

namespace Pecus.Services;

/// <summary>
/// ワークスペースアイテムサービス
/// </summary>
public class WorkspaceItemService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkspaceItemService> _logger;

    public WorkspaceItemService(ApplicationDbContext context, ILogger<WorkspaceItemService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// ワークスペースアイテムを作成
    /// </summary>
    public async Task<WorkspaceItem> CreateWorkspaceItemAsync(
        int workspaceId,
        CreateWorkspaceItemRequest request,
        int ownerId
    )
    {
        // ワークスペースの存在確認
        var workspace = await _context.Workspaces.FindAsync(workspaceId);
        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // オーナーがワークスペースのメンバーか確認
        var isOwnerMember = await _context.WorkspaceUsers.AnyAsync(wu =>
            wu.WorkspaceId == workspaceId && wu.UserId == ownerId && wu.IsActive
        );
        if (!isOwnerMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがアイテムを作成できます。"
            );
        }

        // Assigneeが指定されている場合、存在確認とメンバーチェック
        if (request.AssigneeId.HasValue)
        {
            var isAssigneeMember = await _context.WorkspaceUsers.AnyAsync(wu =>
                wu.WorkspaceId == workspaceId
                && wu.UserId == request.AssigneeId.Value
                && wu.IsActive
            );
            if (!isAssigneeMember)
            {
                throw new InvalidOperationException(
                    "作業者はワークスペースのメンバーである必要があります。"
                );
            }
        }

        // ユニークなコードを生成（重複チェック付き）
        string code;
        int maxRetries = 10;
        int retryCount = 0;

        do
        {
            code = CodeGenerator.GenerateWorkspaceItemCode();
            var exists = await _context.WorkspaceItems.AnyAsync(wi =>
                wi.WorkspaceId == workspaceId && wi.Code == code
            );

            if (!exists)
                break;

            retryCount++;
            if (retryCount >= maxRetries)
            {
                throw new InvalidOperationException(
                    "ユニークなコードの生成に失敗しました。しばらくしてから再度お試しください。"
                );
            }
        } while (true);

        // アイテムを作成
        var item = new WorkspaceItem
        {
            WorkspaceId = workspaceId,
            Code = code,
            Subject = request.Subject,
            Body = request.Body,
            OwnerId = ownerId,
            AssigneeId = request.AssigneeId,
            Priority = request.Priority,
            DueDate = request.DueDate,
            IsDraft = request.IsDraft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _context.WorkspaceItems.Add(item);
        await _context.SaveChangesAsync();

        // タグの処理
        if (request.TagNames != null && request.TagNames.Any())
        {
            // ワークスペースの組織IDを取得
            var organizationId = workspace.OrganizationId;

            foreach (var tagName in request.TagNames.Distinct())
            {
                if (string.IsNullOrWhiteSpace(tagName))
                    continue;

                // タグが存在するか確認
                var tag = await _context.Tags.FirstOrDefaultAsync(t =>
                    t.OrganizationId == organizationId && t.Name == tagName
                );

                // タグが存在しない場合は作成
                if (tag == null)
                {
                    tag = new Tag
                    {
                        OrganizationId = organizationId,
                        Name = tagName,
                        CreatedByUserId = ownerId,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    };
                    _context.Tags.Add(tag);
                    await _context.SaveChangesAsync();
                }

                // アイテムとタグを関連付け
                var workspaceItemTag = new WorkspaceItemTag
                {
                    WorkspaceItemId = item.Id,
                    TagId = tag.Id,
                    CreatedByUserId = ownerId,
                    CreatedAt = DateTime.UtcNow,
                };
                _context.WorkspaceItemTags.Add(workspaceItemTag);
            }

            await _context.SaveChangesAsync();
        }

        // ナビゲーションプロパティをロード
        await _context.Entry(item).Reference(wi => wi.Workspace).LoadAsync();
        await _context.Entry(item).Reference(wi => wi.Owner).LoadAsync();
        if (item.AssigneeId.HasValue)
        {
            await _context.Entry(item).Reference(wi => wi.Assignee).LoadAsync();
        }
        await _context.Entry(item).Collection(wi => wi.WorkspaceItemTags).LoadAsync();

        return item;
    }

    /// <summary>
    /// ワークスペースアイテムを取得
    /// </summary>
    public async Task<WorkspaceItem> GetWorkspaceItemAsync(int workspaceId, int itemId)
    {
        var item = await _context
            .WorkspaceItems.Include(wi => wi.Workspace)
            .Include(wi => wi.Owner)
            .Include(wi => wi.Assignee)
            .Include(wi => wi.Committer)
            .Include(wi => wi.WorkspaceItemTags)
            .ThenInclude(wit => wit.Tag)
            .FirstOrDefaultAsync(wi => wi.WorkspaceId == workspaceId && wi.Id == itemId);

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        return item;
    }

    /// <summary>
    /// ワークスペースアイテム一覧を取得
    /// </summary>
    public async Task<(List<WorkspaceItem> Items, int TotalCount)> GetWorkspaceItemsAsync(
        int workspaceId,
        int page = 1,
        int pageSize = 20,
        bool? isDraft = null,
        bool? isArchived = null,
        int? assigneeId = null,
        int? priority = null
    )
    {
        var query = _context
            .WorkspaceItems.Include(wi => wi.Workspace)
            .Include(wi => wi.Owner)
            .Include(wi => wi.Assignee)
            .Include(wi => wi.Committer)
            .Include(wi => wi.WorkspaceItemTags)
            .ThenInclude(wit => wit.Tag)
            .Where(wi => wi.WorkspaceId == workspaceId);

        // フィルタリング
        if (isDraft.HasValue)
        {
            query = query.Where(wi => wi.IsDraft == isDraft.Value);
        }

        if (isArchived.HasValue)
        {
            query = query.Where(wi => wi.IsArchived == isArchived.Value);
        }

        if (assigneeId.HasValue)
        {
            query = query.Where(wi => wi.AssigneeId == assigneeId.Value);
        }

        if (priority.HasValue)
        {
            query = query.Where(wi => wi.Priority == priority.Value);
        }

        var totalCount = await query.CountAsync();

        // ページネーション
        var items = await query
            .OrderByDescending(wi => wi.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    /// <summary>
    /// ワークスペースアイテムを更新
    /// </summary>
    public async Task<WorkspaceItem> UpdateWorkspaceItemAsync(
        int workspaceId,
        int itemId,
        UpdateWorkspaceItemRequest request,
        int userId
    )
    {
        var item = await _context.WorkspaceItems.FirstOrDefaultAsync(wi =>
            wi.WorkspaceId == workspaceId && wi.Id == itemId
        );

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        // アーカイブ済みの場合は更新不可
        if (item.IsArchived)
        {
            throw new InvalidOperationException("アーカイブ済みのアイテムは更新できません。");
        }

        // 更新権限チェック（オーナーまたは作業者のみ）
        if (item.OwnerId != userId && item.AssigneeId != userId)
        {
            throw new InvalidOperationException(
                "オーナーまたは作業者のみがアイテムを更新できます。"
            );
        }

        // プロパティを更新
        if (!string.IsNullOrEmpty(request.Subject))
        {
            item.Subject = request.Subject;
        }

        if (request.Body != null)
        {
            item.Body = request.Body;
        }

        if (request.AssigneeId.HasValue)
        {
            // Assigneeが指定されている場合、メンバーチェック
            var isAssigneeMember = await _context.WorkspaceUsers.AnyAsync(wu =>
                wu.WorkspaceId == workspaceId
                && wu.UserId == request.AssigneeId.Value
                && wu.IsActive
            );
            if (!isAssigneeMember)
            {
                throw new InvalidOperationException(
                    "作業者はワークスペースのメンバーである必要があります。"
                );
            }
            item.AssigneeId = request.AssigneeId.Value;
        }

        if (request.Priority.HasValue)
        {
            item.Priority = request.Priority.Value;
        }

        if (request.DueDate.HasValue)
        {
            item.DueDate = request.DueDate.Value;
        }

        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // ナビゲーションプロパティをロード
        await _context.Entry(item).Reference(wi => wi.Workspace).LoadAsync();
        await _context.Entry(item).Reference(wi => wi.Owner).LoadAsync();
        if (item.AssigneeId.HasValue)
        {
            await _context.Entry(item).Reference(wi => wi.Assignee).LoadAsync();
        }
        if (item.CommitterId.HasValue)
        {
            await _context.Entry(item).Reference(wi => wi.Committer).LoadAsync();
        }

        return item;
    }

    /// <summary>
    /// ワークスペースアイテムのステータスを更新
    /// </summary>
    public async Task<WorkspaceItem> UpdateWorkspaceItemStatusAsync(
        int workspaceId,
        int itemId,
        UpdateWorkspaceItemStatusRequest request,
        int userId
    )
    {
        var item = await _context.WorkspaceItems.FirstOrDefaultAsync(wi =>
            wi.WorkspaceId == workspaceId && wi.Id == itemId
        );

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        // 下書き→公開の場合、オーナーまたは作業者のみ
        if (
            request.IsDraft.HasValue
            && !request.IsDraft.Value
            && item.IsDraft
            && item.OwnerId != userId
            && item.AssigneeId != userId
        )
        {
            throw new InvalidOperationException(
                "オーナーまたは作業者のみがアイテムを公開できます。"
            );
        }

        // アーカイブの場合、オーナーのみ
        if (
            request.IsArchived.HasValue
            && request.IsArchived.Value
            && !item.IsArchived
            && item.OwnerId != userId
        )
        {
            throw new InvalidOperationException("オーナーのみがアイテムをアーカイブできます。");
        }

        // ステータス更新
        if (request.IsDraft.HasValue)
        {
            item.IsDraft = request.IsDraft.Value;

            // 公開時にコミッターを設定
            if (!item.IsDraft && !item.CommitterId.HasValue)
            {
                item.CommitterId = userId;
            }
        }

        if (request.IsArchived.HasValue)
        {
            item.IsArchived = request.IsArchived.Value;
        }

        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // ナビゲーションプロパティをロード
        await _context.Entry(item).Reference(wi => wi.Workspace).LoadAsync();
        await _context.Entry(item).Reference(wi => wi.Owner).LoadAsync();
        if (item.AssigneeId.HasValue)
        {
            await _context.Entry(item).Reference(wi => wi.Assignee).LoadAsync();
        }
        if (item.CommitterId.HasValue)
        {
            await _context.Entry(item).Reference(wi => wi.Committer).LoadAsync();
        }

        return item;
    }

    /// <summary>
    /// ワークスペースアイテムを削除
    /// </summary>
    public async Task DeleteWorkspaceItemAsync(int workspaceId, int itemId, int userId)
    {
        var item = await _context.WorkspaceItems.FirstOrDefaultAsync(wi =>
            wi.WorkspaceId == workspaceId && wi.Id == itemId
        );

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        // 削除権限チェック（オーナーのみ）
        if (item.OwnerId != userId)
        {
            throw new InvalidOperationException("オーナーのみがアイテムを削除できます。");
        }

        // アーカイブ済みの場合のみ削除可能
        if (!item.IsArchived)
        {
            throw new InvalidOperationException(
                "アイテムを削除するには、先にアーカイブする必要があります。"
            );
        }

        _context.WorkspaceItems.Remove(item);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// ワークスペースアイテムのタグを一括設定（既存のタグをすべて置き換える）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="tagNames">設定するタグ名のリスト（空の場合はすべてのタグを削除）</param>
    /// <param name="userId">実行ユーザーID</param>
    /// <returns>更新されたワークスペースアイテム</returns>
    /// <exception cref="NotFoundException">アイテムまたはワークスペースが見つからない場合</exception>
    /// <exception cref="InvalidOperationException">権限がない場合</exception>
    public async Task<WorkspaceItem> SetTagsToItemAsync(
        int workspaceId,
        int itemId,
        List<string>? tagNames,
        int userId
    )
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
        var workspace = await _context
            .Workspaces.Include(w => w.WorkspaceUsers)
            .FirstOrDefaultAsync(w => w.Id == workspaceId);

        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var isMember = workspace.WorkspaceUsers.Any(wu => wu.UserId == userId && wu.IsActive);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがタグを設定できます。"
            );
        }

        // 既存のタグ関連をすべて削除
        var existingTags = await _context
            .WorkspaceItemTags.Where(wit => wit.WorkspaceItemId == itemId)
            .ToListAsync();

        _context.WorkspaceItemTags.RemoveRange(existingTags);

        // 新しいタグを設定（タグ名がある場合のみ）
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
            }
        }

        await _context.SaveChangesAsync();

        // 更新後のアイテムを取得
        return await GetWorkspaceItemAsync(workspaceId, itemId);
    }
}
