using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Permission;
using Pecus.Models.Responses.Role;
using Pecus.Services;

namespace Pecus.Controllers.Backend;

/// <summary>
/// 権限管理コントローラー（バックエンド管理用）
/// </summary>
[ApiController]
[Route("api/backend/permissions")]
[Produces("application/json")]
[Authorize(Roles = "Backend")]
public class BackendPermissionController : ControllerBase
{
    private readonly PermissionService _permissionService;
    private readonly ILogger<BackendPermissionController> _logger;

    public BackendPermissionController(
        PermissionService permissionService,
        ILogger<BackendPermissionController> logger
    )
    {
        _permissionService = permissionService;
        _logger = logger;
    }

    /// <summary>
    /// 権限作成
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(PermissionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<PermissionResponse>, BadRequest<ErrorResponse>, StatusCodeHttpResult>
    > CreatePermission([FromBody] CreatePermissionRequest request)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var permission = await _permissionService.CreatePermissionAsync(request, me);

            var response = new PermissionResponse
            {
                Id = permission.Id,
                Name = permission.Name,
                Description = permission.Description,
                Category = permission.Category,
                CreatedAt = permission.CreatedAt,
            };

            return TypedResults.Ok(response);
        }
        catch (DuplicateException ex)
        {
            return TypedResults.BadRequest(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = ex.Message,
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "権限作成中にエラーが発生しました。Name: {Name}", request.Name);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 権限取得
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PermissionDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<PermissionDetailResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > GetPermission(int id)
    {
        try
        {
            var permission = await _permissionService.GetPermissionByIdAsync(id);
            if (permission == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "権限が見つかりません。",
                    }
                );
            }

            var response = new PermissionDetailResponse
            {
                Id = permission.Id,
                Name = permission.Name,
                Description = permission.Description,
                Category = permission.Category,
                CreatedAt = permission.CreatedAt,
                Roles = permission
                    .Roles.Select(r => new RoleInfoResponse { Id = r.Id, Name = r.Name })
                    .ToList(),
            };

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "権限取得中にエラーが発生しました。PermissionId: {PermissionId}",
                id
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 全権限取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PermissionListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<IEnumerable<PermissionListItemResponse>>, StatusCodeHttpResult>
    > GetAllPermissions()
    {
        try
        {
            var permissions = await _permissionService.GetAllPermissionsAsync();
            var response = permissions.Select(p => new PermissionListItemResponse
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Category = p.Category,
                CreatedAt = p.CreatedAt,
                RoleCount = p.Roles.Count,
            });

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "全権限取得中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// カテゴリで権限取得
    /// </summary>
    [HttpGet("category/{category}")]
    [ProducesResponseType(typeof(IEnumerable<PermissionListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<IEnumerable<PermissionListItemResponse>>, StatusCodeHttpResult>
    > GetPermissionsByCategory(string category)
    {
        try
        {
            var permissions = await _permissionService.GetPermissionsByCategoryAsync(category);
            var response = permissions.Select(p => new PermissionListItemResponse
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Category = p.Category,
                CreatedAt = p.CreatedAt,
                RoleCount = p.Roles.Count,
            });

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "カテゴリ別権限取得中にエラーが発生しました。Category: {Category}",
                category
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 権限削除
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > DeletePermission(int id)
    {
        try
        {
            var result = await _permissionService.DeletePermissionAsync(id);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "権限が見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "権限を削除しました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "権限削除中にエラーが発生しました。PermissionId: {PermissionId}",
                id
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
