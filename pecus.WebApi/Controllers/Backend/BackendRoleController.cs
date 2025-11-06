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
/// ロール管理コントローラー（バックエンド管理用）
/// </summary>
[ApiController]
[Route("api/backend/roles")]
[Produces("application/json")]
[Authorize(Roles = "Backend")]
public class BackendRoleController : ControllerBase
{
    private readonly RoleService _roleService;
    private readonly ILogger<BackendRoleController> _logger;

    public BackendRoleController(RoleService roleService, ILogger<BackendRoleController> logger)
    {
        _roleService = roleService;
        _logger = logger;
    }

    /// <summary>
    /// ロール作成
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<RoleResponse>> CreateRole([FromBody] CreateRoleRequest request)
    {
        // ログイン中のユーザーIDを取得
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        var role = await _roleService.CreateRoleAsync(request, me);
        var response = new RoleResponse
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            CreatedAt = role.CreatedAt,
        };
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ロール取得
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RoleDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<RoleDetailResponse>> GetRole(int id)
    {
        var role = await _roleService.GetRoleByIdAsync(id);
        if (role == null)
        {
            throw new NotFoundException("ロールが見つかりません。");
        }

        var response = new RoleDetailResponse
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            CreatedAt = role.CreatedAt,
            Permissions = role
                .Permissions.Select(p => new PermissionDetailInfoResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Category = p.Category,
                })
                .ToList(),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 全ロール取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<RoleListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<IEnumerable<RoleListItemResponse>>> GetAllRoles()
    {
        var roles = await _roleService.GetAllRolesAsync();
        var response = roles.Select(r => new RoleListItemResponse
        {
            Id = r.Id,
            Name = r.Name,
            Description = r.Description,
            CreatedAt = r.CreatedAt,
            PermissionCount = r.Permissions.Count,
        });

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ロールに権限を設定（既存の権限を置き換える）
    /// </summary>
    [HttpPut("{roleId}/permissions")]
    [ProducesResponseType(typeof(RoleDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<RoleDetailResponse>> SetPermissionsToRole(int roleId, [FromBody] SetPermissionsToRoleRequest request)
    {
        // ログイン中のユーザーIDを取得
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        // まずロールの存在を確認
        var existingRole = await _roleService.GetRoleByIdAsync(roleId);
        if (existingRole == null)
        {
            throw new NotFoundException("ロールが見つかりません。");
        }

        // 権限を一括設定
        var permissions = await _roleService.SetPermissionsToRoleAsync(
            roleId,
            request.PermissionIds,
            me
        );

        // レスポンスを構築（既存のロール情報と更新された権限を使用）
        var response = new RoleDetailResponse
        {
            Id = existingRole.Id,
            Name = existingRole.Name,
            Description = existingRole.Description,
            CreatedAt = existingRole.CreatedAt,
            Permissions = permissions.Select(p => new PermissionDetailInfoResponse
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Category = p.Category,
            }).ToList(),
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// ロール削除
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> DeleteRole(int id)
    {
        var result = await _roleService.DeleteRoleAsync(id);
        if (!result)
        {
            throw new NotFoundException("ロールが見つかりません。");
        }

        return TypedResults.Ok(
            new SuccessResponse
            {
                StatusCode = StatusCodes.Status200OK,
                Message = "ロールを削除しました。",
            }
        );
    }
}
