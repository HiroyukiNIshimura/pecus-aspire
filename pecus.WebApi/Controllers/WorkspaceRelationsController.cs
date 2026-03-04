using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Models.Requests;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/workspaces/{workspaceId}/relations")]
[Produces("application/json")]
[Tags("WorkspaceItem")]
public class WorkspaceRelationsController : BaseSecureController
{
    private readonly WorkspaceItemService _itemService;

    public WorkspaceRelationsController(
        WorkspaceItemService itemService,
        ILogger<WorkspaceRelationsController> logger,
        ProfileService profileService
    )
        : base(profileService, logger)
    {
        _itemService = itemService;
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