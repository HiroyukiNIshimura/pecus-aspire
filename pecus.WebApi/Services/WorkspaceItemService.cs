using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Config;
using Pecus.Models.Requests.WorkspaceItem;

namespace Pecus.Services;

/// <summary>
/// ワークスペースアイテムサービス
/// </summary>
public class WorkspaceItemService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkspaceItemService> _logger;
    private readonly PecusConfig _config;
    private readonly OrganizationAccessHelper _accessHelper;

    public WorkspaceItemService(
        ApplicationDbContext context,
        ILogger<WorkspaceItemService> logger,
        PecusConfig config,
        OrganizationAccessHelper accessHelper
    )
    {
        _context = context;
        _logger = logger;
        _config = config;
        _accessHelper = accessHelper;
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
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // ワークスペースの存在確認
            var workspace = await _context.Workspaces.FindAsync(workspaceId);
            if (workspace == null)
            {
                throw new NotFoundException("ワークスペースが見つかりません。");
            }

            // Assigneeが指定されている場合、存在確認とメンバーチェック
            if (request.AssigneeId.HasValue)
            {
                var isAssigneeMember = await _accessHelper.IsActiveWorkspaceMemberAsync(
                    request.AssigneeId.Value,
                    workspaceId
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

            await transaction.CommitAsync();
            return item;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
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
            .Include(wi => wi.WorkspaceItemPins)
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
        TaskPriority? priority = null,
        int? pinnedByUserId = null
    )
    {
        var query = _context
            .WorkspaceItems.Include(wi => wi.Workspace)
            .Include(wi => wi.Owner)
            .Include(wi => wi.Assignee)
            .Include(wi => wi.Committer)
            .Include(wi => wi.WorkspaceItemTags)
            .ThenInclude(wit => wit.Tag)
            .Include(wi => wi.WorkspaceItemPins)
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

        if (pinnedByUserId.HasValue)
        {
            query = query.Where(wi =>
                wi.WorkspaceItemPins.Any(wip => wip.UserId == pinnedByUserId.Value)
            );
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
    /// ユーザーがPINしたワークスペースアイテム一覧を取得
    /// </summary>
    public async Task<(List<WorkspaceItem> Items, int TotalCount)> GetPinnedWorkspaceItemsAsync(
        int userId,
        int page = 1,
        int pageSize = 20
    )
    {
        var query = _context
            .WorkspaceItems.Include(wi => wi.Workspace)
            .Include(wi => wi.Owner)
            .Include(wi => wi.Assignee)
            .Include(wi => wi.Committer)
            .Include(wi => wi.WorkspaceItemTags)
            .ThenInclude(wit => wit.Tag)
            .Include(wi => wi.WorkspaceItemPins)
            .Where(wi => wi.WorkspaceItemPins.Any(wip => wip.UserId == userId));

        var totalCount = await query.CountAsync();

        // ページネーション（PIN作成日時の降順）
        var items = await query
            .OrderByDescending(wi =>
                wi.WorkspaceItemPins.Where(wip => wip.UserId == userId)
                    .Select(wip => wip.CreatedAt)
                    .FirstOrDefault()
            )
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
            var isAssigneeMember = await _accessHelper.IsActiveWorkspaceMemberAsync(
                request.AssigneeId.Value,
                workspaceId
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

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // 最新データを取得
            var latestItem = await _context.WorkspaceItems.FindAsync(itemId);
            throw new ConcurrencyException<WorkspaceItem>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                latestItem
            );
        }

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

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // 最新データを取得
            var latestItem = await _context.WorkspaceItems.FindAsync(itemId);
            throw new ConcurrencyException<WorkspaceItem>(
                "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
                latestItem
            );
        }

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
}
