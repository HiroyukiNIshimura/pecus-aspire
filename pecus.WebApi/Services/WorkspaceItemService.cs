using Hangfire;
using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Hangfire.Tasks.Bot;
using Pecus.Libs.Utils;
using Pecus.Models.Config;
using Pecus.Models.Enums;
using Pecus.WebApi.Models.Requests;

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

            var organizationSettings = await _context.OrganizationSettings.FindAsync(workspace.OrganizationId) ?? throw new NotFoundException("組織設定が見つかりません。");

            var limits = LimitsHelper.GetLimitsSettingsForPlan(
                     _config.Limits,
                     organizationSettings.Plan
                 );

            // ドキュメントモードの場合、アイテム数の上限チェック
            if (workspace.Mode == WorkspaceMode.Document)
            {
                var currentItemCount = await _context.WorkspaceItems
                    .Where(wi => wi.WorkspaceId == workspaceId && !wi.IsArchived)
                    .CountAsync();

                if (currentItemCount >= limits.MaxDocumentsPerWorkspace)
                {
                    throw new InvalidOperationException(
                        $"ドキュメントモードのワークスペースはアイテム数が上限（{limits.MaxDocumentsPerWorkspace}件）に達しています。");
                }
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

            // シーケンス名を取得（ワークスペース作成時に作成済み）
            if (string.IsNullOrEmpty(workspace.ItemNumberSequenceName))
            {
                throw new InvalidOperationException(
                    "ワークスペースのアイテム連番シーケンスが設定されていません。"
                );
            }

            // シーケンスから次の連番を取得（アトミック操作）
            // シーケンス名はワークスペース作成時に内部生成されるため、SQLインジェクションのリスクなし
#pragma warning disable EF1002
            var itemNumber = await _context.Database
                .SqlQueryRaw<int>($@"SELECT nextval('""{workspace.ItemNumberSequenceName}""')::int AS ""Value""")
                .FirstAsync();
#pragma warning restore EF1002

            var now = DateTime.UtcNow;
            var item = new WorkspaceItem
            {
                WorkspaceId = workspaceId,
                ItemNumber = itemNumber,
                Code = itemNumber.ToString(),
                Subject = request.Subject,
                Body = request.Body,
                OwnerId = ownerId,
                AssigneeId = request.AssigneeId,
                Priority = request.Priority,
                DueDate = request.DueDate,
                IsDraft = request.IsDraft,
                IsArchived = false,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
                UpdatedByUserId = ownerId,
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

                        _logger.LogDebug(
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

            // 検索インデックス更新ジョブをエンキュー
            _backgroundJobClient.Enqueue<WorkspaceItemTasks>(x =>
                x.UpdateSearchIndexAsync(item.Id)
            );

            // Activity 記録ジョブをエンキュー（Created は details が null でも記録）
            _backgroundJobClient.Enqueue<ActivityTasks>(x =>
                x.RecordActivityAsync(workspaceId, item.Id, ownerId, ActivityActionType.Created, null)
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
        // コードを ItemNumber に変換
        if (!int.TryParse(code, out var itemNumber))
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

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
            .FirstOrDefaultAsync(wi => wi.WorkspaceId == workspaceId && wi.ItemNumber == itemNumber);

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
    /// <param name="ownerId">オーナーIDフィルタ</param>
    /// <param name="committerId">コミッターIDフィルタ</param>
    /// <param name="priority">優先度フィルタ</param>
    /// <param name="pinnedByUserId">PINしているユーザーIDフィルタ</param>
    /// <param name="hasDueDate">期限が設定されているかどうか</param>
    /// <param name="searchQuery">あいまい検索クエリ（Subject, RawBody を対象、pgroonga 使用）</param>
    public async Task<(List<WorkspaceItem> Items, int TotalCount)> GetWorkspaceItemsAsync(
        int workspaceId,
        int page = 1,
        int pageSize = 20,
        bool? isDraft = null,
        bool? isArchived = null,
        int? assigneeId = null,
        int? ownerId = null,
        int? committerId = null,
        TaskPriority? priority = null,
        int? pinnedByUserId = null,
        bool? hasDueDate = null,
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
                ownerId: ownerId,
                committerId: committerId,
                priority: priority,
                pinnedByUserId: pinnedByUserId,
                hasDueDate: hasDueDate,
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

        if (ownerId.HasValue)
        {
            query = query.Where(wi => wi.OwnerId == ownerId.Value);
        }

        if (committerId.HasValue)
        {
            query = query.Where(wi => wi.CommitterId == committerId.Value);
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

        if (hasDueDate.HasValue)
        {
            query = hasDueDate.Value
                ? query.Where(wi => wi.DueDate != null)
                : query.Where(wi => wi.DueDate == null);
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
    /// Subject, RawBody, Code, 関連タグ名を対象に日本語のゆらぎやタイポにも対応した検索を行う
    /// <para>
    /// 検索クエリの書式:
    /// - スペース区切り → AND検索（例: "aaa bbb" → aaa AND bbb）
    /// - パイプ(|)区切り → OR検索（例: "aaa|bbb" → aaa OR bbb）
    /// - 混合 → AND + OR（例: "aaa bbb|ccc" → aaa AND (bbb OR ccc)）
    /// - #数字 → アイテムコード前方一致検索（例: "#123 猫" → Code が 123 で始まる AND 猫を含む）
    /// - 複数#数字は OR として扱う（例: "#123 #456" → Code が 123 OR 456 で始まる）
    /// </para>
    /// </summary>
    private async Task<(List<WorkspaceItem> Items, int TotalCount)> GetWorkspaceItemsWithPgroongaAsync(
        int workspaceId,
        int page,
        int pageSize,
        bool? isDraft,
        bool? isArchived,
        int? assigneeId,
        int? ownerId,
        int? committerId,
        TaskPriority? priority,
        int? pinnedByUserId,
        bool? hasDueDate,
        string searchQuery
    )
    {
        // ユーザー入力を pgroonga クエリに変換（SQLインジェクション対策済み）
        var pgroongaQuery = PgroongaQueryBuilder.BuildQuery(searchQuery);

        // 動的にフィルタ条件を構築（検索条件は別途構築）
        var filterClauses = new List<string> { @"wi.""WorkspaceId"" = {0}" };
        var parameters = new List<object> { workspaceId, pgroongaQuery };
        var paramIndex = 2;

        if (isDraft.HasValue)
        {
            filterClauses.Add($@"wi.""IsDraft"" = {{{paramIndex}}}");
            parameters.Add(isDraft.Value);
            paramIndex++;
        }

        if (isArchived.HasValue)
        {
            filterClauses.Add($@"wi.""IsArchived"" = {{{paramIndex}}}");
            parameters.Add(isArchived.Value);
            paramIndex++;
        }

        if (assigneeId.HasValue)
        {
            filterClauses.Add($@"wi.""AssigneeId"" = {{{paramIndex}}}");
            parameters.Add(assigneeId.Value);
            paramIndex++;
        }

        if (ownerId.HasValue)
        {
            filterClauses.Add($@"wi.""OwnerId"" = {{{paramIndex}}}");
            parameters.Add(ownerId.Value);
            paramIndex++;
        }

        if (committerId.HasValue)
        {
            filterClauses.Add($@"wi.""CommitterId"" = {{{paramIndex}}}");
            parameters.Add(committerId.Value);
            paramIndex++;
        }

        if (priority.HasValue)
        {
            filterClauses.Add($@"wi.""Priority"" = {{{paramIndex}}}");
            parameters.Add((int)priority.Value);
            paramIndex++;
        }

        if (hasDueDate.HasValue)
        {
            filterClauses.Add(hasDueDate.Value
                ? @"wi.""DueDate"" IS NOT NULL"
                : @"wi.""DueDate"" IS NULL");
        }

        var filterClause = string.Join(" AND ", filterClauses);

        // 検索条件（Subject, Code, タグ名, SearchIndex.RawBody を対象）
        // Code を追加することで #123 形式のアイテムコード検索に対応
        // タグ名検索のために LEFT JOIN で Tags テーブルを結合
        // RawBody は別テーブル（WorkspaceItemSearchIndices）に分離されているため JOIN
        // DISTINCT ON で重複排除（1アイテムに複数タグがある場合の対策）
        // ※ 配列 + COALESCE は pgroonga インデックスが効かないため、個別カラムで OR 検索
        var searchCondition = @"(ARRAY[wi.""Subject"", wi.""Code""] &@~ {1} OR (si.""RawBody"" IS NOT NULL AND si.""RawBody"" &@~ {1}) OR t.""Name"" &@~ {1})";

        // ID とスコアのみ取得することで、WorkspaceItem Entity へのカラム追加時に SQL 修正が不要になる
        var offset = (page - 1) * pageSize;
        string idSql;
        string countSql;
        object[] countParams;

        if (pinnedByUserId.HasValue)
        {
            // PIN フィルタがある場合
            // DISTINCT と ORDER BY pgroonga_score() の併用は PostgreSQL の制約でエラーになるため
            // サブクエリで重複排除してから外側でスコア順にソート
            idSql = $@"
                SELECT sub.""Id"", sub.score AS ""Score""
                FROM (
                    SELECT DISTINCT ON (wi.""Id"") wi.""Id"", pgroonga_score(wi.tableoid, wi.ctid) AS score
                    FROM ""WorkspaceItems"" wi
                    LEFT JOIN ""WorkspaceItemSearchIndices"" si ON wi.""Id"" = si.""WorkspaceItemId""
                    LEFT JOIN ""WorkspaceItemTags"" wit ON wi.""Id"" = wit.""WorkspaceItemId""
                    LEFT JOIN ""Tags"" t ON wit.""TagId"" = t.""Id"" AND t.""IsActive"" = true
                    INNER JOIN ""WorkspaceItemPins"" wip ON wi.""Id"" = wip.""WorkspaceItemId""
                    WHERE {filterClause} AND {searchCondition} AND wip.""UserId"" = {{{paramIndex}}}
                    ORDER BY wi.""Id"", pgroonga_score(wi.tableoid, wi.ctid) DESC
                ) sub
                ORDER BY sub.score DESC
                LIMIT {{{paramIndex + 1}}} OFFSET {{{paramIndex + 2}}}";

            parameters.Add(pinnedByUserId.Value);
            parameters.Add(pageSize);
            parameters.Add(offset);

            // PIN フィルタ適用時のカウントクエリ
            countSql = $@"
                SELECT COUNT(DISTINCT wi.""Id"")::int AS ""Value""
                FROM ""WorkspaceItems"" wi
                LEFT JOIN ""WorkspaceItemSearchIndices"" si ON wi.""Id"" = si.""WorkspaceItemId""
                LEFT JOIN ""WorkspaceItemTags"" wit ON wi.""Id"" = wit.""WorkspaceItemId""
                LEFT JOIN ""Tags"" t ON wit.""TagId"" = t.""Id"" AND t.""IsActive"" = true
                INNER JOIN ""WorkspaceItemPins"" wip ON wi.""Id"" = wip.""WorkspaceItemId""
                WHERE {filterClause} AND {searchCondition} AND wip.""UserId"" = {{{paramIndex - 3}}}";
            countParams = parameters.Take(paramIndex - 2).Append(pinnedByUserId.Value).ToArray();
        }
        else
        {
            // PIN フィルタなしの場合
            // DISTINCT と ORDER BY pgroonga_score() の併用は PostgreSQL の制約でエラーになるため
            // サブクエリで重複排除してから外側でスコア順にソート
            idSql = $@"
                SELECT sub.""Id"", sub.score AS ""Score""
                FROM (
                    SELECT DISTINCT ON (wi.""Id"") wi.""Id"", pgroonga_score(wi.tableoid, wi.ctid) AS score
                    FROM ""WorkspaceItems"" wi
                    LEFT JOIN ""WorkspaceItemSearchIndices"" si ON wi.""Id"" = si.""WorkspaceItemId""
                    LEFT JOIN ""WorkspaceItemTags"" wit ON wi.""Id"" = wit.""WorkspaceItemId""
                    LEFT JOIN ""Tags"" t ON wit.""TagId"" = t.""Id"" AND t.""IsActive"" = true
                    WHERE {filterClause} AND {searchCondition}
                    ORDER BY wi.""Id"", pgroonga_score(wi.tableoid, wi.ctid) DESC
                ) sub
                ORDER BY sub.score DESC
                LIMIT {{{paramIndex}}} OFFSET {{{paramIndex + 1}}}";

            parameters.Add(pageSize);
            parameters.Add(offset);

            // カウント用クエリ
            countSql = $@"
                SELECT COUNT(DISTINCT wi.""Id"")::int AS ""Value""
                FROM ""WorkspaceItems"" wi
                LEFT JOIN ""WorkspaceItemSearchIndices"" si ON wi.""Id"" = si.""WorkspaceItemId""
                LEFT JOIN ""WorkspaceItemTags"" wit ON wi.""Id"" = wit.""WorkspaceItemId""
                LEFT JOIN ""Tags"" t ON wit.""TagId"" = t.""Id"" AND t.""IsActive"" = true
                WHERE {filterClause} AND {searchCondition}";
            countParams = parameters.Take(paramIndex).ToArray();
        }

        // カウントクエリと検索クエリを順次実行
        // ※ DbContext はスレッドセーフではないため並列実行不可
        var totalCount = await _context.Database
            .SqlQueryRaw<int>(countSql, countParams)
            .FirstOrDefaultAsync();

        var searchResults = await _context.Database
            .SqlQueryRaw<PgroongaItemSearchResult>(idSql, parameters.ToArray())
            .ToListAsync();

        if (!searchResults.Any())
        {
            return (new List<WorkspaceItem>(), totalCount);
        }

        var itemIds = searchResults.Select(r => r.Id).ToList();

        // EF Core で Entity を取得（Include 自由、カラム追加の影響なし）
        var items = await _context.WorkspaceItems
            .Where(wi => itemIds.Contains(wi.Id))
            .Include(wi => wi.Workspace)
            .Include(wi => wi.Owner)
            .Include(wi => wi.Assignee)
            .Include(wi => wi.Committer)
            .Include(wi => wi.WorkspaceItemTags)
                .ThenInclude(wit => wit.Tag)
            .Include(wi => wi.WorkspaceItemPins)
            .AsSplitQuery()
            .ToListAsync();

        // pgroonga スコア順を維持
        var itemDict = items.ToDictionary(i => i.Id);
        var orderedItems = searchResults
            .Where(r => itemDict.ContainsKey(r.Id))
            .Select(r => itemDict[r.Id])
            .ToList();

        return (orderedItems, totalCount);
    }

    /// <summary>
    /// pgroonga 検索結果用の軽量モデル
    /// </summary>
    private sealed record PgroongaItemSearchResult(int Id, double Score);

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
    /// ログインユーザーに関連するワークスペースアイテム一覧を取得（ワークスペース横断）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="relation">関連タイプ（All, Owner, Assignee, Committer, Pinned）</param>
    /// <param name="page">ページ番号（1から開始）</param>
    /// <param name="pageSize">ページサイズ</param>
    /// <param name="includeArchived">アーカイブ済みアイテムを含めるかどうか（trueの場合はアーカイブ済みのみ表示、デフォルト: null = アーカイブ除外）</param>
    /// <param name="workspaceIds">ワークスペースIDの配列（フィルタリング用）</param>
    /// <param name="sortBy">ソート項目（デフォルト: UpdatedAt）</param>
    /// <param name="order">ソート順序（デフォルト: Desc）</param>
    public async Task<(List<WorkspaceItem> Items, int TotalCount, List<Workspace> Workspaces)> GetMyItemsAsync(
        int userId,
        MyItemRelationType? relation = null,
        int page = 1,
        int pageSize = 20,
        bool? includeArchived = null,
        int[]? workspaceIds = null,
        ItemSortBy? sortBy = null,
        SortOrder? order = null
    )
    {
        var relationType = relation ?? MyItemRelationType.All;

        var query = _context
            .WorkspaceItems.Include(wi => wi.Workspace)
            .ThenInclude(w => w!.Genre)
            .Include(wi => wi.Owner)
            .Include(wi => wi.Assignee)
            .Include(wi => wi.Committer)
            .Include(wi => wi.WorkspaceItemTags)
            .ThenInclude(wit => wit.Tag)
            .Include(wi => wi.WorkspaceItemPins)
            .AsQueryable();

        // 関連タイプに応じたフィルタリング
        query = relationType switch
        {
            MyItemRelationType.Owner => query.Where(wi => wi.OwnerId == userId),
            MyItemRelationType.Assignee => query.Where(wi => wi.AssigneeId == userId),
            MyItemRelationType.Committer => query.Where(wi => wi.CommitterId == userId),
            MyItemRelationType.Pinned => query.Where(wi => wi.WorkspaceItemPins.Any(wip => wip.UserId == userId)),
            // All: オーナー OR 担当者 OR コミッター OR PIN済み
            _ => query.Where(wi =>
                wi.OwnerId == userId ||
                wi.AssigneeId == userId ||
                wi.CommitterId == userId ||
                wi.WorkspaceItemPins.Any(wip => wip.UserId == userId)
            ),
        };

        // 下書きは除外（自分がオーナーの下書きのみ表示）
        //query = query.Where(wi => !wi.IsDraft || wi.OwnerId == userId);

        // アーカイブフィルタ
        // includeArchived = true の場合、アーカイブ済みのみ表示
        // includeArchived = false または null の場合、アーカイブ済みを除外
        if (includeArchived == true)
        {
            query = query.Where(wi => wi.IsArchived);
        }
        else
        {
            query = query.Where(wi => !wi.IsArchived);
        }

        // ワークスペースIDフィルタ
        if (workspaceIds != null && workspaceIds.Length > 0)
        {
            query = query.Where(wi => workspaceIds.Contains(wi.WorkspaceId));
        }

        var totalCount = await query.CountAsync();

        // 総検索結果に含まれるワークスペースのリストを取得（重複排除）
        var resultWorkspaceIds = await query
            .Select(wi => wi.WorkspaceId)
            .Distinct()
            .ToListAsync();
        var workspaces = await _context.Workspaces
            .Include(w => w.Genre)
            .Where(w => resultWorkspaceIds.Contains(w.Id))
            .ToListAsync();

        // ソート
        var sortByField = sortBy ?? ItemSortBy.UpdatedAt;
        var sortOrder = order ?? SortOrder.Desc;

        query = sortByField switch
        {
            ItemSortBy.CreatedAt => sortOrder == SortOrder.Asc
                ? query.OrderBy(wi => wi.CreatedAt)
                : query.OrderByDescending(wi => wi.CreatedAt),
            ItemSortBy.Priority => sortOrder == SortOrder.Asc
                ? query.OrderBy(wi => wi.Priority == null).ThenBy(wi => wi.Priority).ThenByDescending(wi => wi.UpdatedAt)
                : query.OrderBy(wi => wi.Priority == null).ThenByDescending(wi => wi.Priority).ThenByDescending(wi => wi.UpdatedAt),
            ItemSortBy.DueDate => sortOrder == SortOrder.Asc
                ? query.OrderBy(wi => wi.DueDate == null).ThenBy(wi => wi.DueDate).ThenByDescending(wi => wi.UpdatedAt)
                : query.OrderBy(wi => wi.DueDate == null).ThenByDescending(wi => wi.DueDate).ThenByDescending(wi => wi.UpdatedAt),
            _ => sortOrder == SortOrder.Asc
                ? query.OrderBy(wi => wi.UpdatedAt)
                : query.OrderByDescending(wi => wi.UpdatedAt),
        };

        // ページネーション
        var items = await query
            .AsSplitQuery()
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount, workspaces);
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
        // ユーザー名を取得するため Include でロード
        var item = await _context.WorkspaceItems
            .Include(wi => wi.Assignee)
            .Include(wi => wi.Committer)
            .FirstOrDefaultAsync(wi => wi.WorkspaceId == workspaceId && wi.Id == itemId);

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        // アーカイブ済みの場合は、アーカイブ解除以外の更新は不可
        if (item.IsArchived && request.IsArchived != false)
        {
            throw new InvalidOperationException("アーカイブ済みのアイテムは更新できません。アーカイブを解除してから更新してください。");
        }

        // 更新権限チェック（オーナーまたは担当者のみ）
        if (item.OwnerId != userId && item.AssigneeId != userId)
        {
            throw new InvalidOperationException(
                "オーナーまたは担当者のみがアイテムを更新できます。"
            );
        }

        // 変更前のスナップショットを作成（ユーザー名を含む）
        var snapshot = new
        {
            Subject = item.Subject,
            Body = item.Body,
            AssigneeId = item.AssigneeId,
            AssigneeName = item.Assignee?.Username,
            Priority = item.Priority,
            CommitterId = item.CommitterId,
            CommitterName = item.Committer?.Username,
            IsDraft = item.IsDraft,
            IsArchived = item.IsArchived,
            DueDate = item.DueDate
        };

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

        if (request.CommitterId.HasValue)
        {
            // Committerが指定されている場合、メンバーチェック
            var isCommitterMember = await _accessHelper.IsActiveWorkspaceMemberAsync(
                request.CommitterId.Value,
                workspaceId
            );
            if (!isCommitterMember)
            {
                throw new InvalidOperationException(
                    "コミッターはワークスペースのメンバーである必要があります。"
                );
            }
            item.CommitterId = request.CommitterId.Value;
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
        item.UpdatedByUserId = userId;

        // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
        _context.Entry(item).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(itemId);
        }

        // Body が更新された場合、検索インデックス更新ジョブをエンキュー
        if (request.Body != null)
        {
            _backgroundJobClient.Enqueue<WorkspaceItemTasks>(x =>
                x.UpdateSearchIndexAsync(item.Id)
            );
        }

        // AI機能が有効かチェック（Bot通知のエンキュー判定用）
        var userOrgId = await _accessHelper.GetUserOrganizationIdAsync(userId);

        // Activity記録（変更があった場合のみ、型安全なビルダーを使用）
        // 本文更新は別途処理（oldのみ保存してデータサイズ削減）
        EnqueueActivityIfChanged(workspaceId, itemId, userId,
            ActivityActionType.BodyUpdated,
            ActivityDetailsBuilder.BuildBodyChangeDetails(snapshot.Body, item.Body));

        EnqueueActivityIfChanged(workspaceId, itemId, userId,
            ActivityActionType.SubjectUpdated,
            ActivityDetailsBuilder.BuildStringChangeDetails(snapshot.Subject, item.Subject));

        // 担当者・コミッター変更: ユーザー名を取得してから記録
        string? newAssigneeName = null;
        string? newCommitterName = null;

        if (snapshot.AssigneeId != item.AssigneeId && item.AssigneeId.HasValue)
        {
            var assignee = await _context.Users.FindAsync(item.AssigneeId.Value);
            newAssigneeName = assignee?.Username;
        }
        else
        {
            newAssigneeName = snapshot.AssigneeName;
        }

        if (snapshot.CommitterId != item.CommitterId && item.CommitterId.HasValue)
        {
            var committer = await _context.Users.FindAsync(item.CommitterId.Value);
            newCommitterName = committer?.Username;
        }
        else
        {
            newCommitterName = snapshot.CommitterName;
        }

        EnqueueActivityIfChanged(workspaceId, itemId, userId,
            ActivityActionType.AssigneeChanged,
            ActivityDetailsBuilder.BuildUserChangeDetails(snapshot.AssigneeName, newAssigneeName));

        EnqueueActivityIfChanged(workspaceId, itemId, userId,
            ActivityActionType.CommitterChanged,
            ActivityDetailsBuilder.BuildUserChangeDetails(snapshot.CommitterName, newCommitterName));

        EnqueueActivityIfChanged(workspaceId, itemId, userId,
            ActivityActionType.PriorityChanged,
            ActivityDetailsBuilder.BuildPriorityChangeDetails(snapshot.Priority, item.Priority));

        EnqueueActivityIfChanged(workspaceId, itemId, userId,
            ActivityActionType.DraftChanged,
            ActivityDetailsBuilder.BuildBoolChangeDetails(snapshot.IsDraft, item.IsDraft));

        EnqueueActivityIfChanged(workspaceId, itemId, userId,
            ActivityActionType.ArchivedChanged,
            ActivityDetailsBuilder.BuildBoolChangeDetails(snapshot.IsArchived, item.IsArchived));

        EnqueueActivityIfChanged(workspaceId, itemId, userId,
            ActivityActionType.DueDateChanged,
            ActivityDetailsBuilder.BuildDateTimeChangeDetails(snapshot.DueDate, item.DueDate));

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

        // 変更前のスナップショットを作成
        var snapshot = new
        {
            IsDraft = item.IsDraft,
            IsArchived = item.IsArchived,
            CommitterId = item.CommitterId,
            CommitterName = item.Committer?.Username
        };

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

            // アーカイブ時に子アイテムの処理（ドキュメントモード用）
            if (request.IsArchived.Value && request.KeepChildrenRelation.HasValue)
            {
                await ProcessChildrenOnArchiveAsync(workspaceId, itemId, request.KeepChildrenRelation.Value, userId);
            }
        }

        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedByUserId = userId;

        // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
        _context.Entry(item).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(itemId);
        }

        // Activity記録（変更があった場合のみ）
        EnqueueActivityIfChanged(workspaceId, itemId, userId,
            ActivityActionType.DraftChanged,
            ActivityDetailsBuilder.BuildBoolChangeDetails(snapshot.IsDraft, item.IsDraft));

        EnqueueActivityIfChanged(workspaceId, itemId, userId,
            ActivityActionType.ArchivedChanged,
            ActivityDetailsBuilder.BuildBoolChangeDetails(snapshot.IsArchived, item.IsArchived));

        // コミッター変更: 新しいユーザー名を取得
        if (snapshot.CommitterId != item.CommitterId)
        {
            string? newCommitterName = null;
            if (item.CommitterId.HasValue)
            {
                var committer = await _context.Users.FindAsync(item.CommitterId.Value);
                newCommitterName = committer?.Username;
            }
            EnqueueActivityIfChanged(workspaceId, itemId, userId,
                ActivityActionType.CommitterChanged,
                ActivityDetailsBuilder.BuildUserChangeDetails(snapshot.CommitterName, newCommitterName));
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
    /// アーカイブ時の子アイテム処理
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="parentItemId">アーカイブする親アイテムID</param>
    /// <param name="keepChildrenRelation">true: 親子関係を維持（子はツリーから除外されるがアーカイブ解除で復活）、false: 子供はルートに移動</param>
    /// <param name="userId">操作ユーザーID</param>
    private async Task ProcessChildrenOnArchiveAsync(int workspaceId, int parentItemId, bool keepChildrenRelation, int userId)
    {
        // keepChildrenRelation = true の場合は何もしない（親子関係を維持）
        // 子アイテムは親がアーカイブされているためツリー表示から除外されるが、
        // 親のアーカイブ解除時に自動的に復活する
        if (keepChildrenRelation)
        {
            _logger.LogDebug(
                "ProcessChildrenOnArchiveAsync: keepChildrenRelation=true, no action needed. workspaceId={WorkspaceId}, parentItemId={ParentItemId}",
                workspaceId, parentItemId);
            return;
        }

        _logger.LogDebug(
            "ProcessChildrenOnArchiveAsync: workspaceId={WorkspaceId}, parentItemId={ParentItemId}, keepChildrenRelation={KeepChildrenRelation}",
            workspaceId, parentItemId, keepChildrenRelation);

        // この親アイテムの直接の子供を取得（ParentOf: From=Parent, To=Child）
        var childRelations = await _context.WorkspaceItemRelations
            .Where(r => r.FromItemId == parentItemId && r.RelationType == RelationType.ParentOf)
            .Include(r => r.ToItem)
            .ToListAsync();

        _logger.LogDebug(
            "Found {Count} child relations for parentItemId={ParentItemId}",
            childRelations.Count, parentItemId);

        if (!childRelations.Any())
        {
            return;
        }

        foreach (var relation in childRelations)
        {
            var childItem = relation.ToItem;
            if (childItem == null || childItem.IsArchived)
            {
                continue;
            }

            // 子供はルートに移動（親子関係を解除）
            _context.WorkspaceItemRelations.Remove(relation);

            // 親子関係解除のActivity記録
            EnqueueActivityIfChanged(workspaceId, childItem.Id, userId,
                ActivityActionType.RelationRemoved,
                ActivityDetailsBuilder.BuildRelationRemovedDetails(parentItemId.ToString(), "ParentOf"));
        }

        await _context.SaveChangesAsync();
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

        // 変更前のスナップショットを作成
        var snapshot = new
        {
            AssigneeId = item.AssigneeId,
            AssigneeName = item.Assignee?.Username
        };

        try
        {
            item.AssigneeId = request.AssigneeId;
            item.UpdatedAt = DateTime.UtcNow;
            item.UpdatedByUserId = userId;

            // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
            _context.Entry(item).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(itemId);
        }

        // Activity記録（変更があった場合のみ）
        if (snapshot.AssigneeId != item.AssigneeId)
        {
            string? newAssigneeName = null;
            if (item.AssigneeId.HasValue)
            {
                var assignee = await _context.Users.FindAsync(item.AssigneeId.Value);
                newAssigneeName = assignee?.Username;
            }
            EnqueueActivityIfChanged(workspaceId, itemId, userId,
                ActivityActionType.AssigneeChanged,
                ActivityDetailsBuilder.BuildUserChangeDetails(snapshot.AssigneeName, newAssigneeName));
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
                Owner = UserIdentityResponseBuilder.FromUser(latestItem.Owner)!,
                Assignee = UserIdentityResponseBuilder.FromUser(latestItem.Assignee),
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

    /// <summary>
    /// ワークスペースアイテムの属性を更新
    /// </summary>
    public async Task<WorkspaceItem> UpdateWorkspaceItemAttributeAsync(
        int workspaceId,
        int itemId,
        WorkspaceItemAttribute attribute,
        UpdateWorkspaceItemAttributeRequest request,
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

        // 変更前のスナップショットを作成
        var snapshot = new
        {
            AssigneeId = item.AssigneeId,
            AssigneeName = item.Assignee?.Username,
            CommitterId = item.CommitterId,
            CommitterName = item.Committer?.Username,
            Priority = item.Priority,
            DueDate = item.DueDate,
            IsArchived = item.IsArchived
        };

        // 属性に応じて値を更新
        switch (attribute)
        {
            case WorkspaceItemAttribute.Assignee:
                await UpdateAssigneeAttribute(item, workspaceId, request.Value);
                break;

            case WorkspaceItemAttribute.Committer:
                await UpdateCommitterAttribute(item, workspaceId, request.Value);
                break;

            case WorkspaceItemAttribute.Priority:
                UpdatePriorityAttribute(item, request.Value);
                break;

            case WorkspaceItemAttribute.Duedate:
                UpdateDuedateAttribute(item, request.Value);
                break;

            case WorkspaceItemAttribute.Archive:
                UpdateArchiveAttribute(item, request.Value);
                break;

            default:
                throw new InvalidOperationException($"未対応の属性です: {attribute}");
        }

        try
        {
            item.UpdatedAt = DateTime.UtcNow;
            item.UpdatedByUserId = userId;

            // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
            _context.Entry(item).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(itemId);
        }

        // Activity記録（変更があった場合のみ、属性に応じて記録）
        switch (attribute)
        {
            case WorkspaceItemAttribute.Assignee:
                if (snapshot.AssigneeId != item.AssigneeId)
                {
                    string? newAssigneeName = null;
                    if (item.AssigneeId.HasValue)
                    {
                        var assignee = await _context.Users.FindAsync(item.AssigneeId.Value);
                        newAssigneeName = assignee?.Username;
                    }
                    EnqueueActivityIfChanged(workspaceId, itemId, userId,
                        ActivityActionType.AssigneeChanged,
                        ActivityDetailsBuilder.BuildUserChangeDetails(snapshot.AssigneeName, newAssigneeName));
                }
                break;

            case WorkspaceItemAttribute.Committer:
                if (snapshot.CommitterId != item.CommitterId)
                {
                    string? newCommitterName = null;
                    if (item.CommitterId.HasValue)
                    {
                        var committer = await _context.Users.FindAsync(item.CommitterId.Value);
                        newCommitterName = committer?.Username;
                    }
                    EnqueueActivityIfChanged(workspaceId, itemId, userId,
                        ActivityActionType.CommitterChanged,
                        ActivityDetailsBuilder.BuildUserChangeDetails(snapshot.CommitterName, newCommitterName));
                }
                break;

            case WorkspaceItemAttribute.Priority:
                EnqueueActivityIfChanged(workspaceId, itemId, userId,
                    ActivityActionType.PriorityChanged,
                    ActivityDetailsBuilder.BuildPriorityChangeDetails(snapshot.Priority, item.Priority));
                break;

            case WorkspaceItemAttribute.Duedate:
                EnqueueActivityIfChanged(workspaceId, itemId, userId,
                    ActivityActionType.DueDateChanged,
                    ActivityDetailsBuilder.BuildDateTimeChangeDetails(snapshot.DueDate, item.DueDate));
                break;

            case WorkspaceItemAttribute.Archive:
                EnqueueActivityIfChanged(workspaceId, itemId, userId,
                    ActivityActionType.ArchivedChanged,
                    ActivityDetailsBuilder.BuildBoolChangeDetails(snapshot.IsArchived, item.IsArchived));
                break;
        }

        // ナビゲーションプロパティをロード
        await LoadWorkspaceItemNavigations(item);

        return item;
    }

    /// <summary>
    /// 担当者属性を更新
    /// </summary>
    private async Task UpdateAssigneeAttribute(WorkspaceItem item, int workspaceId, System.Text.Json.JsonElement? value)
    {
        int? assigneeId = null;

        if (value.HasValue && value.Value.ValueKind != System.Text.Json.JsonValueKind.Null)
        {
            assigneeId = value.Value.GetInt32();

            // ワークスペースメンバーであることを確認
            var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(
                assigneeId.Value,
                workspaceId
            );

            if (!isMember)
            {
                throw new InvalidOperationException(
                    "指定されたユーザーはワークスペースのメンバーではありません。"
                );
            }
        }

        item.AssigneeId = assigneeId;
    }

    /// <summary>
    /// コミッター属性を更新
    /// </summary>
    private async Task UpdateCommitterAttribute(WorkspaceItem item, int workspaceId, System.Text.Json.JsonElement? value)
    {
        int? committerId = null;

        if (value.HasValue && value.Value.ValueKind != System.Text.Json.JsonValueKind.Null)
        {
            committerId = value.Value.GetInt32();

            // ワークスペースメンバーであることを確認
            var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(
                committerId.Value,
                workspaceId
            );

            if (!isMember)
            {
                throw new InvalidOperationException(
                    "指定されたユーザーはワークスペースのメンバーではありません。"
                );
            }
        }

        item.CommitterId = committerId;
    }

    /// <summary>
    /// 優先度属性を更新
    /// </summary>
    private static void UpdatePriorityAttribute(WorkspaceItem item, System.Text.Json.JsonElement? value)
    {
        if (value.HasValue && value.Value.ValueKind != System.Text.Json.JsonValueKind.Null)
        {
            var priorityValue = value.Value.GetInt32();
            if (!Enum.IsDefined(typeof(TaskPriority), priorityValue))
            {
                throw new InvalidOperationException($"無効な優先度です: {priorityValue}");
            }
            item.Priority = (TaskPriority)priorityValue;
        }
        else
        {
            item.Priority = null;
        }
    }

    /// <summary>
    /// 期限日属性を更新
    /// </summary>
    private static void UpdateDuedateAttribute(WorkspaceItem item, System.Text.Json.JsonElement? value)
    {
        if (value.HasValue && value.Value.ValueKind != System.Text.Json.JsonValueKind.Null)
        {
            // DateTimeOffset で直接取得（タイムゾーン情報を保持）
            item.DueDate = value.Value.GetDateTimeOffset();
        }
        else
        {
            item.DueDate = null;
        }
    }

    /// <summary>
    /// アーカイブ属性を更新
    /// </summary>
    private static void UpdateArchiveAttribute(WorkspaceItem item, System.Text.Json.JsonElement? value)
    {
        if (value.HasValue && value.Value.ValueKind != System.Text.Json.JsonValueKind.Null)
        {
            item.IsArchived = value.Value.GetBoolean();
        }
        else
        {
            // アーカイブは null 不可のため、明示的な値が必要
            throw new InvalidOperationException("アーカイブ状態の値は必須です。");
        }
    }

    /// <summary>
    /// ワークスペースアイテムのナビゲーションプロパティをロード
    /// </summary>
    private async Task LoadWorkspaceItemNavigations(WorkspaceItem item)
    {
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
    }

    /// <summary>
    /// アイテムの子アイテム数を取得（直接の子と全子孫）
    /// </summary>
    public async Task<(int DirectCount, int TotalCount)> GetChildrenCountAsync(int workspaceId, int itemId, int userId)
    {
        // 権限チェック
        await _accessHelper.EnsureWorkspaceAccessAsync(workspaceId, userId);

        // アイテムの存在確認
        var item = await _context.WorkspaceItems.FirstOrDefaultAsync(wi =>
            wi.WorkspaceId == workspaceId && wi.Id == itemId && !wi.IsArchived);

        if (item == null)
        {
            throw new NotFoundException("アイテムが見つかりません。");
        }

        // 直接の子アイテムを取得（ParentOf: From=Parent, To=Child）
        var directChildIds = await _context.WorkspaceItemRelations
            .Where(r => r.FromItemId == itemId && r.RelationType == RelationType.ParentOf)
            .Join(_context.WorkspaceItems.Where(wi => !wi.IsArchived),
                r => r.ToItemId,
                wi => wi.Id,
                (r, wi) => wi.Id)
            .ToListAsync();

        var directCount = directChildIds.Count;

        if (directCount == 0)
        {
            return (0, 0);
        }

        // 全子孫を再帰的にカウント
        var allDescendants = new HashSet<int>(directChildIds);
        var queue = new Queue<int>(directChildIds);

        while (queue.Count > 0)
        {
            var currentId = queue.Dequeue();

            var children = await _context.WorkspaceItemRelations
                .Where(r => r.FromItemId == currentId && r.RelationType == RelationType.ParentOf)
                .Join(_context.WorkspaceItems.Where(wi => !wi.IsArchived),
                    r => r.ToItemId,
                    wi => wi.Id,
                    (r, wi) => wi.Id)
                .ToListAsync();

            foreach (var childId in children)
            {
                if (allDescendants.Add(childId))
                {
                    queue.Enqueue(childId);
                }
            }
        }

        return (directCount, allDescendants.Count);
    }

    /// <summary>
    /// 変更がある場合のみActivityをエンキュー
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="userId">操作ユーザーID</param>
    /// <param name="actionType">アクションタイプ</param>
    /// <param name="details">ActivityDetailsBuilder で生成されたJSON（nullなら変更なし）</param>
    private void EnqueueActivityIfChanged(
        int workspaceId,
        int itemId,
        int userId,
        ActivityActionType actionType,
        string? details)
    {
        if (details == null) return;

        _backgroundJobClient.Enqueue<ActivityTasks>(x =>
            x.RecordActivityAsync(workspaceId, itemId, userId, actionType, details)
        );

        // AI機能が有効な場合のみBot通知タスクをエンキュー
        if (actionType == ActivityActionType.BodyUpdated || actionType == ActivityActionType.SubjectUpdated)
        {
            _backgroundJobClient.Enqueue<UpdateItemTask>(x =>
                x.NotifyItemUpdatedAsync(
                    itemId,
                    actionType,
                    details
                )
            );
        }
    }

    /// <summary>
    /// ワークスペース内の全アイテムリレーションを取得
    /// </summary>
    public async Task<List<WorkspaceItemRelation>> GetWorkspaceRelationsAsync(int workspaceId, int userId)
    {
        // 権限チェック
        await _accessHelper.EnsureWorkspaceAccessAsync(workspaceId, userId);

        // ワークスペース内のアイテムIDを取得
        var itemIds = await _context.WorkspaceItems
            .Where(wi => wi.WorkspaceId == workspaceId)
            .Select(wi => wi.Id)
            .ToListAsync();

        if (!itemIds.Any())
        {
            return new List<WorkspaceItemRelation>();
        }

        // 関連元または関連先がワークスペース内のアイテムであるリレーションを取得
        // 親子関係(ParentOf)のみに絞ることも検討できるが、汎用的に全リレーションを返す
        var relations = await _context.WorkspaceItemRelations
            .Where(r => itemIds.Contains(r.FromItemId) && itemIds.Contains(r.ToItemId))
            .ToListAsync();

        return relations;
    }

    /// <summary>
    /// アイテムの親を変更（移動）
    /// </summary>
    public async Task UpdateItemParentAsync(int workspaceId, UpdateItemParentRequest request, int userId)
    {
        // 権限チェック
        await _accessHelper.EnsureWorkspaceAccessAsync(workspaceId, userId);

        // トランザクション開始
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            WorkspaceItem? newParent = null;

            // 対象アイテムの取得
            var item = await _context.WorkspaceItems
                .FirstOrDefaultAsync(wi => wi.Id == request.ItemId && wi.WorkspaceId == workspaceId);

            if (item == null)
            {
                throw new NotFoundException("指定されたアイテムが見つかりません。");
            }

            // 楽観的ロックチェック
            if (item.RowVersion != request.RowVersion)
            {
                throw new ConcurrencyException<WorkspaceItemDetailResponse>(
                    "アイテムが他のユーザーによって更新されています。",
                    null // ここでは詳細な競合モデルは返さない（必要なら実装）
                );
            }

            // 新しい親アイテムの検証（指定がある場合）
            if (request.NewParentItemId.HasValue)
            {
                newParent = await _context.WorkspaceItems
                    .FirstOrDefaultAsync(wi => wi.Id == request.NewParentItemId.Value && wi.WorkspaceId == workspaceId);

                if (newParent == null)
                {
                    throw new NotFoundException("新しい親アイテムが見つかりません。");
                }

                // 循環参照チェック
                // 自分自身を親にはできない
                if (request.ItemId == request.NewParentItemId.Value)
                {
                    throw new InvalidOperationException("自分自身を親にすることはできません。");
                }

                // 新しい親が、自分の子孫であってはならない
                if (await IsDescendantAsync(request.ItemId, request.NewParentItemId.Value))
                {
                    throw new InvalidOperationException("自分の子孫を親にすることはできません（循環参照）。");
                }
            }

            // 既存の親リレーション（自分が子である ParentOf リレーション）を削除
            // ParentOf: From=Parent, To=Child
            // 自分が子なので ToItemId = item.Id の ParentOf を探す
            var existingParentRelations = await _context.WorkspaceItemRelations
                .Where(r => r.ToItemId == item.Id && r.RelationType == RelationType.ParentOf)
                .ToListAsync();

            // Activity用に旧親のCodeを取得
            var oldParentIds = existingParentRelations.Select(r => r.FromItemId).ToList();
            var oldParents = await _context.WorkspaceItems
                .Where(wi => oldParentIds.Contains(wi.Id))
                .ToDictionaryAsync(wi => wi.Id, wi => wi.Code);

            _context.WorkspaceItemRelations.RemoveRange(existingParentRelations);

            // 新しい親リレーションを作成（指定がある場合）
            if (request.NewParentItemId.HasValue && newParent != null)
            {
                var newRelation = new WorkspaceItemRelation
                {
                    FromItemId = request.NewParentItemId.Value,
                    ToItemId = item.Id,
                    RelationType = RelationType.ParentOf,
                    CreatedByUserId = userId,
                    CreatedAt = DateTimeOffset.UtcNow
                };
                _context.WorkspaceItemRelations.Add(newRelation);
            }

            // アイテム自体の更新（RowVersion更新のため）
            // 実質的な変更はないが、EntityState.ModifiedにしてRowVersionを進める
            // またはUpdatedBy/UpdatedAtを更新する
            item.UpdatedByUserId = userId;
            item.UpdatedAt = DateTimeOffset.UtcNow;

            // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
            _context.Entry(item).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Activity記録（親削除）
            foreach (var relation in existingParentRelations)
            {
                if (oldParents.TryGetValue(relation.FromItemId, out var oldParentCode))
                {
                    var details = ActivityDetailsBuilder.BuildRelationRemovedDetails(oldParentCode, RelationType.ParentOf.ToString());
                    EnqueueActivityIfChanged(workspaceId, item.Id, userId, ActivityActionType.RelationRemoved, details);
                }
            }

            // Activity記録（親追加）
            if (newParent != null)
            {
                var details = ActivityDetailsBuilder.BuildRelationAddedDetails(newParent.Code, RelationType.ParentOf.ToString());
                EnqueueActivityIfChanged(workspaceId, item.Id, userId, ActivityActionType.RelationAdded, details);
            }
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync();
            // 再取得して例外を投げる処理は共通化されている前提だが、ここではシンプルに
            throw new ConcurrencyException<WorkspaceItemDetailResponse>("同時実行制御エラーが発生しました。", null);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// targetItemId が sourceItemId の子孫かどうかを判定
    /// </summary>
    private async Task<bool> IsDescendantAsync(int sourceItemId, int targetItemId)
    {
        // 再帰的にチェックする必要があるが、CTE (Common Table Expression) を使うのが効率的
        // EF Core 8.0 以降なら再帰クエリがサポートされているが、ここでは簡易的に実装するか、
        // または全リレーションをメモリにロードしてチェックする（アイテム数が少なければ）

        // ここでは安全のため、深さ制限付きの探索を行う
        // ParentOf: From=Parent, To=Child

        var currentChildren = await _context.WorkspaceItemRelations
            .Where(r => r.FromItemId == sourceItemId && r.RelationType == RelationType.ParentOf)
            .Select(r => r.ToItemId)
            .ToListAsync();

        if (currentChildren.Contains(targetItemId))
        {
            return true;
        }

        // 幅優先探索
        var queue = new Queue<int>(currentChildren);
        var visited = new HashSet<int>(currentChildren);

        // 無限ループ防止のための安全装置（深さ制限など）
        int safetyCounter = 0;
        const int MaxChecks = 1000;

        while (queue.Count > 0 && safetyCounter++ < MaxChecks)
        {
            var currentId = queue.Dequeue();

            var children = await _context.WorkspaceItemRelations
                .Where(r => r.FromItemId == currentId && r.RelationType == RelationType.ParentOf)
                .Select(r => r.ToItemId)
                .ToListAsync();

            foreach (var childId in children)
            {
                if (childId == targetItemId)
                {
                    return true;
                }

                if (!visited.Contains(childId))
                {
                    visited.Add(childId);
                    queue.Enqueue(childId);
                }
            }
        }

        return false;
    }

    /// <summary>
    /// ドキュメントツリー用のアイテム一覧を取得
    /// ワークスペース内の全アイテムと親子関係を解決して返す
    /// </summary>
    public async Task<DocumentTreeResponse> GetDocumentTreeAsync(int workspaceId, int userId)
    {
        // 権限チェック
        await _accessHelper.EnsureWorkspaceAccessAsync(workspaceId, userId);

        // ワークスペースの存在確認とモードチェック
        var workspace = await _context.Workspaces.FindAsync(workspaceId);
        if (workspace == null)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        if (workspace.Mode != WorkspaceMode.Document)
        {
            throw new InvalidOperationException("このエンドポイントはドキュメントモードのワークスペースでのみ使用できます。");
        }

        var limits = await GetLimitsSettingsAsync(workspace.OrganizationId);

        // ワークスペース内の全アイテムを取得（アーカイブ済みは除外）
        var items = await _context.WorkspaceItems
            .Where(wi => wi.WorkspaceId == workspaceId && !wi.IsArchived)
            .Take(limits.MaxDocumentsPerWorkspace)
            .OrderBy(wi => wi.ItemNumber)
            .Select(wi => new
            {
                wi.Id,
                wi.Code,
                wi.Subject,
                wi.IsDraft,
                wi.ItemNumber,
                wi.RowVersion
            })
            .ToListAsync();

        if (!items.Any())
        {
            return new DocumentTreeResponse
            {
                Items = [],
                TotalCount = 0
            };
        }

        var itemIds = items.Select(i => i.Id).ToList();

        // ParentOf リレーションを取得して親子関係のマッピングを作成
        // ParentOf: From=Parent, To=Child なので、ToItemId をキーに FromItemId(親) を取得
        var parentRelations = await _context.WorkspaceItemRelations
            .Where(r => itemIds.Contains(r.ToItemId) && r.RelationType == RelationType.ParentOf)
            .ToDictionaryAsync(r => r.ToItemId, r => r.FromItemId);

        // アーカイブされた親を持つアイテムを再帰的に除外
        // 親がアーカイブ済み＝parentRelationsに親IDがあるが、itemIdsに含まれていない
        var validItemIds = new HashSet<int>(itemIds);
        var itemsToExclude = new HashSet<int>();

        // 再帰的に除外対象を特定
        void MarkDescendantsForExclusion(int excludedParentId)
        {
            // この親を持つ子供を探す
            var children = parentRelations
                .Where(pr => pr.Value == excludedParentId)
                .Select(pr => pr.Key)
                .ToList();

            foreach (var childId in children)
            {
                if (itemsToExclude.Add(childId))
                {
                    // 子供の子供も再帰的に除外
                    MarkDescendantsForExclusion(childId);
                }
            }
        }

        // 親がアーカイブ済み（取得対象に含まれていない）アイテムを特定して除外
        foreach (var relation in parentRelations)
        {
            var childId = relation.Key;
            var parentId = relation.Value;

            // 親が取得対象に含まれていない＝親がアーカイブ済み
            if (!validItemIds.Contains(parentId))
            {
                if (itemsToExclude.Add(childId))
                {
                    // この子供の子孫も除外
                    MarkDescendantsForExclusion(childId);
                }
            }
        }

        // 除外対象を取り除く
        var filteredItems = items.Where(i => !itemsToExclude.Contains(i.Id)).ToList();

        // レスポンス構築
        var treeItems = filteredItems.Select((item, index) => new DocumentTreeItemResponse
        {
            Id = item.Id,
            Code = item.Code,
            Subject = item.Subject ?? "（件名なし）",
            ParentId = parentRelations.TryGetValue(item.Id, out var parentId) ? parentId : null,
            IsDraft = item.IsDraft,
            SortOrder = index, // 現状はItemNumber順をそのまま使用
            RowVersion = item.RowVersion
        }).ToList();

        return new DocumentTreeResponse
        {
            Items = treeItems,
            TotalCount = treeItems.Count
        };
    }

    /// <summary>
    /// ワークスペース内のアクティブなメンバー一覧を取得（メール送信用）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="excludeUserId">除外するユーザーID（作成者など）</param>
    /// <returns>ワークスペース内のアクティブなメンバー一覧（メールアドレスを持つユーザーのみ）</returns>
    public async Task<List<User>> GetWorkspaceActiveMembersAsync(int workspaceId, int? excludeUserId = null)
    {
        var query = _context.WorkspaceUsers
            .Include(wu => wu.User)
            .Where(wu =>
                wu.WorkspaceId == workspaceId &&
                wu.User != null &&
                wu.User.IsActive &&
                !string.IsNullOrEmpty(wu.User.Email)
            );

        if (excludeUserId.HasValue)
        {
            query = query.Where(wu => wu.UserId != excludeUserId.Value);
        }

        return await query
            .Select(wu => wu.User!)
            .ToListAsync();
    }

    /// <summary>
    /// ワークスペース情報をメール送信用に取得
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <returns>ワークスペース情報（コード、名前を含む）</returns>
    public async Task<Workspace?> GetWorkspaceForEmailAsync(int workspaceId)
    {
        return await _context.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == workspaceId);
    }

    /// <summary>
    /// 組織の制限設定を取得
    /// </summary>
    private async Task<LimitsSettings> GetLimitsSettingsAsync(int organizationId)
    {
        var organizationSettings = await _context.OrganizationSettings.FindAsync(organizationId) ?? throw new NotFoundException("組織設定が見つかりません。");

        var limits = LimitsHelper.GetLimitsSettingsForPlan(
                 _config.Limits,
                 organizationSettings.Plan
        );
        return limits;
    }
}