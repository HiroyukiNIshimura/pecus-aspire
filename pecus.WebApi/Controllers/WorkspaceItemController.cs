using Hangfire;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Libs.Security;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/workspaces/{workspaceId}/items")]
[Produces("application/json")]
[Tags("WorkspaceItem")]
public class WorkspaceItemController : BaseSecureController
{
    private readonly WorkspaceItemService _workspaceItemService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly ILogger<WorkspaceItemController> _logger;
    private readonly PecusConfig _config;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly FrontendUrlResolver _frontendUrlResolver;

    public WorkspaceItemController(
        WorkspaceItemService workspaceItemService,
        OrganizationAccessHelper accessHelper,
        ProfileService profileService,
        ILogger<WorkspaceItemController> logger,
        PecusConfig config,
        IBackgroundJobClient backgroundJobClient,
        FrontendUrlResolver frontendUrlResolver
    ) : base(profileService, logger)
    {
        _workspaceItemService = workspaceItemService;
        _accessHelper = accessHelper;
        _logger = logger;
        _config = config;
        _backgroundJobClient = backgroundJobClient;
        _frontendUrlResolver = frontendUrlResolver;
    }

    /// <summary>
    /// ワークスペースアイテム作成
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemResponse>> CreateWorkspaceItem(
        int workspaceId,
        [FromBody] CreateWorkspaceItemRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがアイテムを作成できます。"
            );
        }

        var item = await _workspaceItemService.CreateWorkspaceItemAsync(
            workspaceId,
            request,
            CurrentUserId
        );

        // 下書きでない場合はアイテム作成通知メールを送信
        if (!item.IsDraft)
        {
            await SendItemCreatedEmailAsync(workspaceId, item);
        }

        var response = new WorkspaceItemResponse
        {
            Success = true,
            Message = "ワークスペースアイテムを作成しました。",
            WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテム取得
    /// </summary>
    [HttpGet("{itemId}")]
    [ProducesResponseType(typeof(WorkspaceItemDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemDetailResponse>> GetWorkspaceItem(
        int workspaceId,
        int itemId
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        var item = await _workspaceItemService.GetWorkspaceItemAsync(workspaceId, itemId);

        var response = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテムをコードで取得
    /// </summary>
    [HttpGet("code/{code}")]
    [ProducesResponseType(typeof(WorkspaceItemDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemDetailResponse>> GetWorkspaceItemByCode(
        int workspaceId,
        string code
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        var item = await _workspaceItemService.GetWorkspaceItemByCodeAsync(workspaceId, code);

        var response = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId);

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテム一覧取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<WorkspaceItemDetailResponse>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<WorkspaceItemDetailResponse>>> GetWorkspaceItems(
        int workspaceId,
        [FromQuery] GetWorkspaceItemsRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            // 空の結果を返す
            var emptyResponse = PaginationHelper.CreatePagedResponse(
                data: new List<WorkspaceItemDetailResponse>(),
                totalCount: 0,
                page: request.Page,
                pageSize: _config.Pagination.DefaultPageSize
            );
            return TypedResults.Ok(emptyResponse);
        }

        // pinnedフィルタを使用する場合は認証が必要
        int? pinnedByUserId = null;
        if (request.Pinned.HasValue && request.Pinned.Value)
        {
            pinnedByUserId = CurrentUserId;
        }

        var pageSize = request.PageSize ?? _config.Pagination.DefaultPageSize;
        var (items, totalCount) = await _workspaceItemService.GetWorkspaceItemsAsync(
            workspaceId: workspaceId,
            page: request.Page,
            pageSize: pageSize,
            isDraft: request.IsDraft,
            isArchived: request.IsArchived,
            assigneeId: request.AssigneeId,
            ownerId: request.OwnerId,
            committerId: request.CommitterId,
            priority: request.Priority,
            pinnedByUserId: pinnedByUserId,
            hasDueDate: request.HasDueDate,
            searchQuery: request.SearchQuery
        );

        var itemResponses = items
            .Select(item => WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId))
            .ToList();

        var response = PaginationHelper.CreatePagedResponse(
            data: itemResponses,
            totalCount: totalCount,
            page: request.Page,
            pageSize: pageSize
        );

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテム更新
    /// </summary>
    [HttpPatch("{itemId}")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceItemDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemResponse>> UpdateWorkspaceItem(
        int workspaceId,
        int itemId,
        [FromBody] UpdateWorkspaceItemRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがアイテムを更新できます。"
            );
        }

        var item = await _workspaceItemService.UpdateWorkspaceItemAsync(
            workspaceId,
            itemId,
            request,
            CurrentUserId
        );

        var response = new WorkspaceItemResponse
        {
            Success = true,
            Message = "ワークスペースアイテムを更新しました。",
            WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテムステータス更新
    /// </summary>
    [HttpPatch("{itemId}/status")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceItemDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemResponse>> UpdateWorkspaceItemStatus(
        int workspaceId,
        int itemId,
        [FromBody] UpdateWorkspaceItemStatusRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがアイテムのステータスを更新できます。"
            );
        }

        var item = await _workspaceItemService.UpdateWorkspaceItemStatusAsync(
            workspaceId,
            itemId,
            request,
            CurrentUserId
        );

        var response = new WorkspaceItemResponse
        {
            Success = true,
            Message = "ワークスペースアイテムのステータスを更新しました。",
            WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテム担当者設定
    /// </summary>
    [HttpPatch("{itemId}/assignee")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceItemDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemResponse>> UpdateWorkspaceItemAssignee(
        int workspaceId,
        int itemId,
        [FromBody] UpdateWorkspaceItemAssigneeRequest request
    )
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがアイテムの担当者を変更できます。"
            );
        }

        var item = await _workspaceItemService.UpdateWorkspaceItemAssigneeAsync(
            workspaceId,
            itemId,
            request,
            CurrentUserId
        );

        var response = new WorkspaceItemResponse
        {
            Success = true,
            Message = "ワークスペースアイテムの担当者を更新しました。",
            WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテム削除
    /// </summary>
    [HttpDelete("{itemId}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> DeleteWorkspaceItem(int workspaceId, int itemId)
    {
        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがアイテムを削除できます。"
            );
        }

        await _workspaceItemService.DeleteWorkspaceItemAsync(workspaceId, itemId, CurrentUserId);

        var response = new SuccessResponse
        {
            StatusCode = StatusCodes.Status200OK,
            Message = "ワークスペースアイテムを削除しました。",
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテム属性更新
    /// </summary>
    /// <remarks>
    /// 属性ごとに値を個別に更新します。サポートされる属性:
    /// - assignee: 担当者ID (int? / null で割り当て解除)
    /// - committer: コミッターID (int? / null で割り当て解除)
    /// - priority: 優先度 (TaskPriority enum / null でクリア)
    /// - duedate: 期限日 (DateTime / null でクリア)
    /// - archive: アーカイブ状態 (bool / 必須)
    /// </remarks>
    [HttpPatch("{itemId}/{attr}")]
    [ProducesResponseType(typeof(WorkspaceItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<WorkspaceItemDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemResponse>> UpdateWorkspaceItemAttribute(
        int workspaceId,
        int itemId,
        string attr,
        [FromBody] UpdateWorkspaceItemAttributeRequest request
    )
    {
        // 属性名を Enum に変換（case-insensitive）
        if (!Enum.TryParse<WorkspaceItemAttribute>(attr, ignoreCase: true, out var attribute))
        {
            throw new InvalidOperationException($"無効な属性です: {attr}。使用可能な属性: assignee, committer, priority, duedate, archive");
        }

        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        // ユーザーがワークスペースのメンバーか確認
        var isMember = await _accessHelper.IsActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);
        if (!isMember)
        {
            throw new InvalidOperationException(
                "ワークスペースのメンバーのみがアイテムの属性を変更できます。"
            );
        }

        var item = await _workspaceItemService.UpdateWorkspaceItemAttributeAsync(
            workspaceId,
            itemId,
            attribute,
            request,
            CurrentUserId
        );

        var response = new WorkspaceItemResponse
        {
            Success = true,
            Message = $"ワークスペースアイテムの{GetAttributeDisplayName(attribute)}を更新しました。",
            WorkspaceItem = WorkspaceItemResponseHelper.BuildItemDetailResponse(item, CurrentUserId),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 属性の表示名を取得
    /// </summary>
    private static string GetAttributeDisplayName(WorkspaceItemAttribute attribute)
    {
        return attribute switch
        {
            WorkspaceItemAttribute.Assignee => "担当者",
            WorkspaceItemAttribute.Committer => "コミッター",
            WorkspaceItemAttribute.Priority => "優先度",
            WorkspaceItemAttribute.Duedate => "期限日",
            WorkspaceItemAttribute.Archive => "アーカイブ状態",
            _ => attribute.ToString()
        };
    }

    /// <summary>
    /// アイテムの子アイテム数を取得（ドキュメントモード用）
    /// </summary>
    [HttpGet("{itemId}/children/count")]
    [ProducesResponseType(typeof(ChildrenCountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<ChildrenCountResponse>> GetChildrenCount(int workspaceId, int itemId)
    {
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var count = await _workspaceItemService.GetChildrenCountAsync(workspaceId, itemId, CurrentUserId);

        return TypedResults.Ok(new ChildrenCountResponse
        {
            ItemId = itemId,
            ChildrenCount = count.DirectCount,
            TotalDescendantsCount = count.TotalCount
        });
    }

    /// <summary>
    /// アイテム作成時にワークスペース内メンバーへメール送信
    /// </summary>
    private async Task SendItemCreatedEmailAsync(int workspaceId, Libs.DB.Models.WorkspaceItem item)
    {
        // ワークスペース情報を取得
        var workspace = await _workspaceItemService.GetWorkspaceForEmailAsync(workspaceId);
        if (workspace == null)
        {
            _logger.LogWarning(
                "アイテム作成メール送信: ワークスペース情報が取得できませんでした。WorkspaceId={WorkspaceId}",
                workspaceId
            );
            return;
        }

        // 通知先ユーザー一覧を取得（ワークスペース内の有効なメンバー、作成者を除外）
        var targetUsers = await _workspaceItemService.GetWorkspaceActiveMembersAsync(
            workspaceId,
            CurrentUserId // アイテム作成者は除外
        );

        if (targetUsers.Count == 0)
        {
            _logger.LogInformation(
                "アイテム作成メール送信: 通知先ユーザーがいません。WorkspaceId={WorkspaceId}, ItemId={ItemId}",
                workspaceId,
                item.Id
            );
            return;
        }

        var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl(HttpContext);
        var itemUrl = $"{baseUrl}/workspaces/{workspace.Code}?itemCode={item.Code}";

        // 各ユーザーにメール送信ジョブを登録
        foreach (var user in targetUsers)
        {
            if (string.IsNullOrEmpty(user.Email))
            {
                continue;
            }

            var emailModel = new ItemCreatedEmailModel
            {
                UserName = user.Username,
                ItemTitle = item.Subject ?? "",
                ItemCode = item.Code,
                BodyText = item.RawBody,
                CreatedByName = CurrentUser?.Username ?? "",
                CreatedAt = item.CreatedAt,
                WorkspaceName = workspace.Name,
                WorkspaceCode = workspace.Code ?? "",
                ItemUrl = itemUrl,
            };

            _backgroundJobClient.Enqueue<EmailTasks>(x =>
                x.SendTemplatedEmailAsync(
                    user.Email,
                    "新しいアイテムが作成されました",
                    emailModel
                )
            );
        }

        _logger.LogInformation(
            "アイテム作成メールをキューに追加しました。WorkspaceId={WorkspaceId}, ItemId={ItemId}, TargetCount={Count}",
            workspaceId,
            item.Id,
            targetUsers.Count
        );
    }
}