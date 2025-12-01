using Hangfire;
using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Utils;
using Pecus.Models.Config;
using Pecus.Models.Requests.WorkspaceItem;
using Pecus.Models.Responses.WorkspaceItem;

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
    private readonly WorkspaceItemTempAttachmentService _tempAttachmentService;
    private readonly IBackgroundJobClient _backgroundJobClient;

    public WorkspaceItemService(
        ApplicationDbContext context,
        ILogger<WorkspaceItemService> logger,
        PecusConfig config,
        OrganizationAccessHelper accessHelper,
        WorkspaceItemTempAttachmentService tempAttachmentService,
        IBackgroundJobClient backgroundJobClient
    )
    {
        _context = context;
        _logger = logger;
        _config = config;
        _accessHelper = accessHelper;
        _tempAttachmentService = tempAttachmentService;
        _backgroundJobClient = backgroundJobClient;
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
                        "担当者はワークスペースのメンバーである必要があります。"
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
                RawBody = string.Empty, // Hangfire ジョブで非同期更新
                OwnerId = ownerId,
                AssigneeId = request.AssigneeId,
                Priority = request.Priority,
                DueDate = request.DueDate,
                IsDraft = request.IsDraft,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true,
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

            // 一時添付ファイルの正式化処理
            if (
                !string.IsNullOrEmpty(request.TempSessionId)
                && request.TempAttachmentIds != null
                && request.TempAttachmentIds.Count != 0
            )
            {
                var urlReplacements = new Dictionary<string, string>();

                foreach (var tempFileId in request.TempAttachmentIds)
                {
                    try
                    {
                        // 一時ファイルを正式な場所に移動
                        var promotedInfo = await _tempAttachmentService.PromoteTempFileAsync(
                            workspaceId: workspaceId,
                            sessionId: request.TempSessionId,
                            tempFileId: tempFileId,
                            workspaceItemId: item.Id
                        );

                        // 一時ファイル情報を取得してMIMEタイプを判定
                        var extension = Path.GetExtension(promotedInfo.NewFilePath).ToLowerInvariant();
                        var mimeType = GetMimeTypeFromExtension(extension);

                        // WorkspaceItemAttachmentレコードを作成
                        var attachment = new WorkspaceItemAttachment
                        {
                            WorkspaceItemId = item.Id,
                            FileName = Path.GetFileName(promotedInfo.NewFilePath),
                            FileSize = promotedInfo.FileSize,
                            MimeType = mimeType,
                            FilePath = promotedInfo.NewFilePath,
                            DownloadUrl = promotedInfo.DownloadUrl,
                            ThumbnailMediumPath = promotedInfo.ThumbnailMediumPath,
                            ThumbnailSmallPath = promotedInfo.ThumbnailSmallPath,
                            UploadedAt = DateTime.UtcNow,
                            UploadedByUserId = ownerId,
                        };
                        _context.WorkspaceItemAttachments.Add(attachment);

                        // 一時URLから正式URLへの置換マップを作成
                        // 一時URL形式: /api/workspaces/{workspaceId}/temp-attachments/{sessionId}/{tempFileId}.ext
                        var tempUrlPattern = $"/api/workspaces/{workspaceId}/temp-attachments/{request.TempSessionId}/{tempFileId}";
                        urlReplacements[tempUrlPattern] = promotedInfo.DownloadUrl;

                        _logger.LogInformation(
                            "Promoted temp file {TempFileId} to attachment for item {ItemId}",
                            tempFileId,
                            item.Id
                        );
                    }
                    catch (FileNotFoundException ex)
                    {
                        _logger.LogWarning(
                            ex,
                            "Temp file not found during promotion: {TempFileId}",
                            tempFileId
                        );
                        // 一時ファイルが見つからない場合は無視して続行
                    }
                }

                await _context.SaveChangesAsync();

                // コンテンツ内のURLを置換
                if (urlReplacements.Count != 0 && !string.IsNullOrEmpty(item.Body))
                {
                    var updatedBody = item.Body;
                    foreach (var (tempUrl, permanentUrl) in urlReplacements)
                    {
                        // 部分一致で置換（拡張子付きのURLも置換対象）
                        updatedBody = ReplaceUrlInContent(updatedBody, tempUrl, permanentUrl);
                    }

                    if (updatedBody != item.Body)
                    {
                        item.Body = updatedBody;
                        await _context.SaveChangesAsync();
                    }
                }

                // 一時ファイルセッションをクリーンアップ
                _tempAttachmentService.CleanupSessionFiles(workspaceId, request.TempSessionId);
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

            // RawBody 更新ジョブをエンキュー
            _backgroundJobClient.Enqueue<WorkspaceItemTasks>(x =>
                x.UpdateRawBodyAsync(item.Id, item.RowVersion)
            );

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
            .Include(wi => wi.RelationsFrom)
            .ThenInclude(r => r.ToItem)
            .ThenInclude(ti => ti!.Owner)
            .Include(wi => wi.RelationsTo)
            .ThenInclude(r => r.FromItem)
            .ThenInclude(fi => fi!.Owner)
            .AsSplitQuery()
            .FirstOrDefaultAsync(wi => wi.WorkspaceId == workspaceId && wi.Id == itemId);

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        return item;
    }

    /// <summary>
    /// ワークスペースアイテムをコードで取得
    /// </summary>
    public async Task<WorkspaceItem> GetWorkspaceItemByCodeAsync(int workspaceId, string code)
    {
        var item = await _context
            .WorkspaceItems.Include(wi => wi.Workspace)
            .Include(wi => wi.Owner)
            .Include(wi => wi.Assignee)
            .Include(wi => wi.Committer)
            .Include(wi => wi.WorkspaceItemTags)
            .ThenInclude(wit => wit.Tag)
            .Include(wi => wi.WorkspaceItemPins)
            .Include(wi => wi.RelationsFrom)
            .ThenInclude(r => r.ToItem)
            .ThenInclude(ti => ti!.Owner)
            .Include(wi => wi.RelationsTo)
            .ThenInclude(r => r.FromItem)
            .ThenInclude(fi => fi!.Owner)
            .AsSplitQuery()
            .FirstOrDefaultAsync(wi => wi.WorkspaceId == workspaceId && wi.Code == code);

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        return item;
    }

    /// <summary>
    /// ワークスペースアイテム一覧を取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="page">ページ番号（1から開始）</param>
    /// <param name="pageSize">ページサイズ</param>
    /// <param name="isDraft">下書きフィルタ</param>
    /// <param name="isArchived">アーカイブフィルタ</param>
    /// <param name="assigneeId">担当者IDフィルタ</param>
    /// <param name="priority">優先度フィルタ</param>
    /// <param name="pinnedByUserId">PINしているユーザーIDフィルタ</param>
    /// <param name="searchQuery">あいまい検索クエリ（Subject, RawBody を対象、pgroonga 使用）</param>
    public async Task<(List<WorkspaceItem> Items, int TotalCount)> GetWorkspaceItemsAsync(
        int workspaceId,
        int page = 1,
        int pageSize = 20,
        bool? isDraft = null,
        bool? isArchived = null,
        int? assigneeId = null,
        TaskPriority? priority = null,
        int? pinnedByUserId = null,
        string? searchQuery = null
    )
    {
        // あいまい検索が指定されている場合は pgroonga を使用
        if (!string.IsNullOrWhiteSpace(searchQuery))
        {
            return await GetWorkspaceItemsWithPgroongaAsync(
                workspaceId: workspaceId,
                page: page,
                pageSize: pageSize,
                isDraft: isDraft,
                isArchived: isArchived,
                assigneeId: assigneeId,
                priority: priority,
                pinnedByUserId: pinnedByUserId,
                searchQuery: searchQuery
            );
        }

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
            .AsSplitQuery()
            .OrderByDescending(wi => wi.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    /// <summary>
    /// pgroonga を使用してワークスペースアイテムをあいまい検索
    /// Subject と RawBody を対象に日本語のゆらぎやタイポにも対応した検索を行う
    /// </summary>
    private async Task<(List<WorkspaceItem> Items, int TotalCount)> GetWorkspaceItemsWithPgroongaAsync(
        int workspaceId,
        int page,
        int pageSize,
        bool? isDraft,
        bool? isArchived,
        int? assigneeId,
        TaskPriority? priority,
        int? pinnedByUserId,
        string searchQuery
    )
    {
        // 動的にWHERE句を構築
        var whereClauses = new List<string>
        {
            @"""WorkspaceId"" = {0}",
            @"ARRAY[""Subject"", ""RawBody""] &@~ {1}"
        };
        var parameters = new List<object> { workspaceId, searchQuery };
        var paramIndex = 2;

        if (isDraft.HasValue)
        {
            whereClauses.Add($@"""IsDraft"" = {{{paramIndex}}}");
            parameters.Add(isDraft.Value);
            paramIndex++;
        }

        if (isArchived.HasValue)
        {
            whereClauses.Add($@"""IsArchived"" = {{{paramIndex}}}");
            parameters.Add(isArchived.Value);
            paramIndex++;
        }

        if (assigneeId.HasValue)
        {
            whereClauses.Add($@"""AssigneeId"" = {{{paramIndex}}}");
            parameters.Add(assigneeId.Value);
            paramIndex++;
        }

        if (priority.HasValue)
        {
            whereClauses.Add($@"""Priority"" = {{{paramIndex}}}");
            parameters.Add((int)priority.Value);
            paramIndex++;
        }

        var whereClause = string.Join(" AND ", whereClauses);

        // カウント用クエリを実行（SqlQueryRaw<int> は "Value" カラムを期待する）
        var countSql = $@"SELECT COUNT(*)::int AS ""Value"" FROM ""WorkspaceItems"" WHERE {whereClause}";
        var totalCount = await _context.Database
            .SqlQueryRaw<int>(countSql, parameters.ToArray())
            .FirstOrDefaultAsync();

        // PIN フィルタがある場合は別途処理（サブクエリが必要）
        IQueryable<WorkspaceItem> query;

        if (pinnedByUserId.HasValue)
        {
            // PIN フィルタがある場合、まず pgroonga で検索してから PIN フィルタを適用
            var offset = (page - 1) * pageSize;
            // xmin はシステムカラムなので SELECT * では含まれない。明示的に指定する必要がある
            var mainSql = $@"
                SELECT wi.*, wi.xmin FROM ""WorkspaceItems"" wi
                INNER JOIN ""WorkspaceItemPins"" wip ON wi.""Id"" = wip.""WorkspaceItemId""
                WHERE {whereClause} AND wip.""UserId"" = {{{paramIndex}}}
                ORDER BY pgroonga_score(wi.tableoid, wi.ctid) DESC
                LIMIT {{{paramIndex + 1}}} OFFSET {{{paramIndex + 2}}}";

            parameters.Add(pinnedByUserId.Value);
            parameters.Add(pageSize);
            parameters.Add(offset);

            query = _context.WorkspaceItems
                .FromSqlRaw(mainSql, parameters.ToArray());

            // PIN フィルタ適用時のカウントを再計算（SqlQueryRaw<int> は "Value" カラムを期待する）
            var countWithPinSql = $@"
                SELECT COUNT(*)::int AS ""Value"" FROM ""WorkspaceItems"" wi
                INNER JOIN ""WorkspaceItemPins"" wip ON wi.""Id"" = wip.""WorkspaceItemId""
                WHERE {whereClause} AND wip.""UserId"" = {{{paramIndex - 3}}}";
            var countParams = parameters.Take(paramIndex - 2).Append(pinnedByUserId.Value).ToArray();
            totalCount = await _context.Database
                .SqlQueryRaw<int>(countWithPinSql, countParams)
                .FirstOrDefaultAsync();
        }
        else
        {
            var offset = (page - 1) * pageSize;
            // xmin はシステムカラムなので SELECT * では含まれない。明示的に指定する必要がある
            var mainSql = $@"
                SELECT *, xmin FROM ""WorkspaceItems""
                WHERE {whereClause}
                ORDER BY pgroonga_score(tableoid, ctid) DESC
                LIMIT {{{paramIndex}}} OFFSET {{{paramIndex + 1}}}";

            parameters.Add(pageSize);
            parameters.Add(offset);

            query = _context.WorkspaceItems
                .FromSqlRaw(mainSql, parameters.ToArray());
        }

        // ナビゲーションプロパティをロード
        var items = await query
            .Include(wi => wi.Workspace)
            .Include(wi => wi.Owner)
            .Include(wi => wi.Assignee)
            .Include(wi => wi.Committer)
            .Include(wi => wi.WorkspaceItemTags)
            .ThenInclude(wit => wit.Tag)
            .Include(wi => wi.WorkspaceItemPins)
            .AsSplitQuery()
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

        // 更新権限チェック（オーナーまたは担当者のみ）
        if (item.OwnerId != userId && item.AssigneeId != userId)
        {
            throw new InvalidOperationException(
                "オーナーまたは担当者のみがアイテムを更新できます。"
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
            // RawBody は Hangfire ジョブで非同期更新（SaveChanges 後にエンキュー）
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
                    "担当者はワークスペースのメンバーである必要があります。"
                );
            }
            item.AssigneeId = request.AssigneeId.Value;
        }

        if (request.Priority.HasValue)
        {
            item.Priority = request.Priority.Value;
        }

        if (request.IsDraft.HasValue)
        {
            item.IsDraft = request.IsDraft.Value;
        }

        if (request.IsArchived.HasValue)
        {
            item.IsArchived = request.IsArchived.Value;
        }

        if (request.DueDate.HasValue)
        {
            item.DueDate = request.DueDate.Value;
        }

        if (request.IsActive.HasValue)
        {
            item.IsActive = request.IsActive.Value;
        }

        // タグの処理（TagNames が null でなければ更新、null の場合は変更なし）
        if (request.TagNames != null)
        {
            // ワークスペースの組織IDを取得
            var workspace = await _context.Workspaces.FirstOrDefaultAsync(w => w.Id == workspaceId);
            if (workspace == null)
            {
                throw new NotFoundException("ワークスペースが見つかりません。");
            }
            var organizationId = workspace.OrganizationId;

            // 既存のタグを削除
            var existingTags = await _context.WorkspaceItemTags
                .Where(wit => wit.WorkspaceItemId == itemId)
                .ToListAsync();
            _context.WorkspaceItemTags.RemoveRange(existingTags);

            // 新しいタグを追加
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
                        CreatedByUserId = userId,
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
                    CreatedByUserId = userId,
                    CreatedAt = DateTime.UtcNow,
                };
                _context.WorkspaceItemTags.Add(workspaceItemTag);
            }
        }

        item.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(itemId);
        }

        // Body が更新された場合、RawBody 更新ジョブをエンキュー
        if (request.Body != null)
        {
            _backgroundJobClient.Enqueue<WorkspaceItemTasks>(x =>
                x.UpdateRawBodyAsync(item.Id, item.RowVersion)
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

        // 下書き→公開の場合、オーナーまたは担当者のみ
        if (
            request.IsDraft.HasValue
            && !request.IsDraft.Value
            && item.IsDraft
            && item.OwnerId != userId
            && item.AssigneeId != userId
        )
        {
            throw new InvalidOperationException(
                "オーナーまたは担当者のみがアイテムを公開できます。"
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
            await RaiseConflictException(itemId);
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
    /// ワークスペースアイテムの担当者を更新
    /// </summary>
    public async Task<WorkspaceItem> UpdateWorkspaceItemAssigneeAsync(
        int workspaceId,
        int itemId,
        UpdateWorkspaceItemAssigneeRequest request,
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

        // 担当者が指定されている場合、ワークスペースメンバーであることを確認
        if (request.AssigneeId.HasValue)
        {
            var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(
                request.AssigneeId.Value,
                workspaceId
            );

            if (!isMember)
            {
                throw new InvalidOperationException(
                    "指定されたユーザーはワークスペースのメンバーではありません。"
                );
            }
        }

        try
        {
            item.AssigneeId = request.AssigneeId;
            item.RowVersion = request.RowVersion;
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(itemId);
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

    private async Task RaiseConflictException(int itemId)
    {
        // 最新データを取得
        var latestItem = await _context.WorkspaceItems.FindAsync(itemId);
        if (latestItem == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }
        throw new ConcurrencyException<WorkspaceItemDetailResponse>(
            "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
            new WorkspaceItemDetailResponse
            {
                Id = latestItem.Id,
                WorkspaceId = latestItem.WorkspaceId,
                Code = latestItem.Code,
                Subject = latestItem.Subject,
                Body = latestItem.Body,
                OwnerId = latestItem.OwnerId,
                AssigneeId = latestItem.AssigneeId,
                Priority = latestItem.Priority,
                DueDate = latestItem.DueDate,
                IsDraft = latestItem.IsDraft,
                IsArchived = latestItem.IsArchived,
                CreatedAt = latestItem.CreatedAt,
                UpdatedAt = latestItem.UpdatedAt,
                RowVersion = latestItem.RowVersion!,
            }
        );
    }

    /// <summary>
    /// 拡張子からMIMEタイプを取得
    /// </summary>
    private static string GetMimeTypeFromExtension(string extension)
    {
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            _ => "application/octet-stream"
        };
    }

    /// <summary>
    /// コンテンツ内のURLを置換（部分一致で拡張子付きURLも対応）
    /// </summary>
    private static string ReplaceUrlInContent(string content, string tempUrlPrefix, string permanentUrl)
    {
        // JSONコンテンツ内のURLを置換
        // 一時URLは "/api/workspaces/{id}/temp-attachments/{session}/{fileId}" の形式
        // 実際のURLは拡張子が付いている: "/api/workspaces/{id}/temp-attachments/{session}/{fileId}.jpg"

        // 正規表現で一時URLプレフィックスにマッチするすべてのURLを置換
        var pattern = System.Text.RegularExpressions.Regex.Escape(tempUrlPrefix) + @"[^""'\s]*";
        return System.Text.RegularExpressions.Regex.Replace(content, pattern, permanentUrl);
    }
}