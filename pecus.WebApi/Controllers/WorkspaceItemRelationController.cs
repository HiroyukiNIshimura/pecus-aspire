using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Requests.WorkspaceItemRelation;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.WorkspaceItemRelation;
using Pecus.Services;

namespace Pecus.Controllers;

[ApiController]
[Route("api/workspaces/{workspaceId}/items/{itemId}/relations")]
[Produces("application/json")]
public class WorkspaceItemRelationController : ControllerBase
{
    private readonly WorkspaceItemRelationService _relationService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly ILogger<WorkspaceItemRelationController> _logger;

    public WorkspaceItemRelationController(
        WorkspaceItemRelationService relationService,
        OrganizationAccessHelper accessHelper,
        ILogger<WorkspaceItemRelationController> logger
    )
    {
        _relationService = relationService;
        _accessHelper = accessHelper;
        _logger = logger;
    }

    /// <summary>
    /// ワークスペースアイテムに関連を追加
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AddWorkspaceItemRelationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<AddWorkspaceItemRelationResponse>> AddRelation(
        int workspaceId,
        int itemId,
        [FromBody] AddWorkspaceItemRelationRequest request
    )
    {
        // ログイン中のユーザーIDを取得
        var currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);

        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(currentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        var relation = await _relationService.AddRelationAsync(
            workspaceId,
            itemId,
            request,
            currentUserId
        );

        var response = new AddWorkspaceItemRelationResponse
        {
            Success = true,
            Message = "アイテムの関連を追加しました。",
            Relation = new WorkspaceItemRelationResponse
            {
                Id = relation.Id,
                FromItemId = relation.FromItemId,
                FromItemCode = relation.FromItem?.Code ?? string.Empty,
                FromItemSubject = relation.FromItem?.Subject ?? string.Empty,
                ToItemId = relation.ToItemId,
                ToItemCode = relation.ToItem?.Code ?? string.Empty,
                ToItemSubject = relation.ToItem?.Subject ?? string.Empty,
                RelationType = relation.RelationType,
                CreatedAt = relation.CreatedAt,
                CreatedByUserId = relation.CreatedByUserId,
                CreatedByUsername = relation.CreatedByUser?.Username ?? string.Empty,
            },
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテムの関連一覧を取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(WorkspaceItemRelationsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<WorkspaceItemRelationsResponse>> GetRelations(int workspaceId, int itemId)
    {
        // ログイン中のユーザーIDを取得
        var currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);

        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(currentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースアイテムが見つかりません。");
        }

        var (relationsFrom, relationsTo) = await _relationService.GetRelationsAsync(
            workspaceId,
            itemId
        );

        var response = new WorkspaceItemRelationsResponse
        {
            RelationsFrom = relationsFrom
                .Select(r => new WorkspaceItemRelationResponse
                {
                    Id = r.Id,
                    FromItemId = r.FromItemId,
                    FromItemCode = r.FromItem?.Code ?? string.Empty,
                    FromItemSubject = r.FromItem?.Subject ?? string.Empty,
                    ToItemId = r.ToItemId,
                    ToItemCode = r.ToItem?.Code ?? string.Empty,
                    ToItemSubject = r.ToItem?.Subject ?? string.Empty,
                    RelationType = r.RelationType,
                    CreatedAt = r.CreatedAt,
                    CreatedByUserId = r.CreatedByUserId,
                    CreatedByUsername = r.CreatedByUser?.Username ?? string.Empty,
                })
                .ToList(),
            RelationsTo = relationsTo
                .Select(r => new WorkspaceItemRelationResponse
                {
                    Id = r.Id,
                    FromItemId = r.FromItemId,
                    FromItemCode = r.FromItem?.Code ?? string.Empty,
                    FromItemSubject = r.FromItem?.Subject ?? string.Empty,
                    ToItemId = r.ToItemId,
                    ToItemCode = r.ToItem?.Code ?? string.Empty,
                    ToItemSubject = r.ToItem?.Subject ?? string.Empty,
                    RelationType = r.RelationType,
                    CreatedAt = r.CreatedAt,
                    CreatedByUserId = r.CreatedByUserId,
                    CreatedByUsername = r.CreatedByUser?.Username ?? string.Empty,
                })
                .ToList(),
            TotalCount = relationsFrom.Count + relationsTo.Count,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ワークスペースアイテムの関連を削除
    /// </summary>
    [HttpDelete("{relationId}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> DeleteRelation(
        int workspaceId,
        int itemId,
        int relationId
    )
    {
        // ログイン中のユーザーIDを取得
        var currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);

        // ワークスペースへのアクセス権限をチェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(currentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new NotFoundException("ワークスペースが見つかりません。");
        }

        await _relationService.DeleteRelationAsync(
            workspaceId,
            itemId,
            relationId,
            currentUserId
        );

        var response = new SuccessResponse
        {
            StatusCode = StatusCodes.Status200OK,
            Message = "アイテムの関連を削除しました。",
        };

        return TypedResults.Ok(response);
    }
}
