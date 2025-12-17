using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Services;
using Pecus.WebApi.Models.Requests;
using Pecus.WebApi.Models.Responses;

namespace Pecus.Controllers;

[Route("api/workspaces/{workspaceId}/relations")]
[Produces("application/json")]
[Tags("WorkspaceItem")]
public class WorkspaceRelationsController : BaseSecureController
{
    private readonly WorkspaceItemService _itemService;
    private readonly OrganizationAccessHelper _accessHelper;

    public WorkspaceRelationsController(
        WorkspaceItemService itemService,
        OrganizationAccessHelper accessHelper,
        ILogger<WorkspaceRelationsController> logger,
        ProfileService profileService
    )
        : base(profileService, logger)
    {
        _itemService = itemService;
        _accessHelper = accessHelper;
    }

    /// <summary>
    /// ワークスペース内の全アイテムリレーションを取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(WorkspaceItemRelationsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<WorkspaceItemRelationsResponse>> GetWorkspaceRelations(int workspaceId)
    {
        var relations = await _itemService.GetWorkspaceRelationsAsync(workspaceId, CurrentUserId);

        var response = new WorkspaceItemRelationsResponse
        {
            Relations = relations.Select(r => new WorkspaceItemDocRelationResponse
            {
                Id = r.Id,
                FromItemId = r.FromItemId,
                ToItemId = r.ToItemId,
                RelationType = r.RelationType
            }).ToList()
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// アイテムの親を変更（移動）
    /// </summary>
    [HttpPut("parent")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<Ok<SuccessResponse>> UpdateItemParent(
        int workspaceId,
        [FromBody] UpdateItemParentRequest request
    )
    {
        await _itemService.UpdateItemParentAsync(workspaceId, request, CurrentUserId);

        return TypedResults.Ok(new SuccessResponse
        {
            StatusCode = StatusCodes.Status200OK,
            Message = "アイテムの親を変更しました。"
        });
    }
}
