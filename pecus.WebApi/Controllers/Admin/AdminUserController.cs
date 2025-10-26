using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.User;
using Pecus.Services;

namespace Pecus.Controllers.Admin;

/// <summary>
/// ユーザー管理コントローラー（組織管理者用）
/// </summary>
[ApiController]
[Route("api/admin/users")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class AdminUserController : ControllerBase
{
    private readonly UserService _userService;
    private readonly ILogger<AdminUserController> _logger;
    private readonly PecusConfig _config;

    public AdminUserController(
        UserService userService,
        ILogger<AdminUserController> logger,
        PecusConfig config
    )
    {
        _userService = userService;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// 組織内のユーザー一覧を取得（ページング）
    /// </summary>
    /// <remarks>
    /// ログインユーザーの組織に所属するユーザーの一覧をページングで取得します。
    /// </remarks>
    /// <param name="page">ページ番号（1から開始）</param>
    /// <param name="activeOnly">有効なユーザーのみ取得するか（デフォルト: false）</param>
    /// <response code="200">ユーザー一覧を返します</response>
    /// <response code="404">組織が見つかりません</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<UserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<PagedResponse<UserResponse>>, NotFound<ErrorResponse>>> GetUsers(
        [FromQuery] int? page,
        [FromQuery] bool activeOnly = false
    )
    {
        try
        {
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ログインユーザーの組織IDを取得
            var user = await _userService.GetUserByIdAsync(userId);
            if (user?.OrganizationId == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "組織に所属していません。" }
                );
            }

            var validatedPage = PaginationHelper.ValidatePageNumber(page);
            var pageSize = _config.Pagination.DefaultPageSize;

            var (users, totalCount) = await _userService.GetUsersByOrganizationPagedAsync(
                user.OrganizationId.Value,
                validatedPage,
                pageSize,
                activeOnly
            );

            var userResponses = users.Select(u => new UserResponse
            {
                Id = u.Id,
                LoginId = u.LoginId,
                Username = u.Username,
                Email = u.Email,
                AvatarType = u.AvatarType,
                IdentityIconUrl = u.AvatarUrl,
                CreatedAt = u.CreatedAt,
            });

            var response = PaginationHelper.CreatePagedResponse(
                userResponses,
                totalCount,
                validatedPage,
                pageSize
            );

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "組織内ユーザー一覧取得中にエラーが発生しました");
            throw;
        }
    }

    /// <summary>
    /// ユーザーのアクティブ状態を設定
    /// </summary>
    /// <remarks>
    /// 指定したユーザーのアクティブ状態を設定します。組織内のユーザーのみ操作可能です。
    /// </remarks>
    /// <param name="id">ユーザーID</param>
    /// <param name="request">アクティブ状態設定リクエスト</param>
    /// <response code="200">ユーザーのアクティブ状態を設定しました</response>
    /// <response code="403">他組織のユーザーは操作できません</response>
    /// <response code="404">ユーザーが見つかりません</response>
    [HttpPut("{id}/active-status")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, UnauthorizedHttpResult>
    > SetUserActiveStatus(int id, [FromBody] SetUserActiveStatusRequest request)
    {
        try
        {
            var currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // 操作対象ユーザーが同じ組織に所属しているか確認
            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            var currentUser = await _userService.GetUserByIdAsync(currentUserId);
            if (currentUser?.OrganizationId != targetUser.OrganizationId)
            {
                return TypedResults.Unauthorized();
            }

            var result = await _userService.SetUserActiveStatusAsync(
                id,
                request.IsActive,
                currentUserId
            );
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            var message = request.IsActive
                ? "ユーザーを有効化しました。"
                : "ユーザーを無効化しました。";
            return TypedResults.Ok(new SuccessResponse { Message = message });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ユーザーアクティブ状態設定中にエラーが発生しました: UserId={UserId}",
                id
            );
            throw;
        }
    }

    /// <summary>
    /// ユーザーを削除
    /// </summary>
    /// <remarks>
    /// 指定したユーザーを削除します。組織内のユーザーのみ操作可能です。
    /// </remarks>
    /// /// <param name="id">ユーザーID</param>
    /// <response code="200">ユーザーを削除しました</response>
    /// <response code="403">他組織のユーザーは操作できません</response>
    /// <response code="404">ユーザーが見つかりません</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, UnauthorizedHttpResult>
    > DeleteUser(int id)
    {
        try
        {
            var currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // 操作対象ユーザーが同じ組織に所属しているか確認
            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            var currentUser = await _userService.GetUserByIdAsync(currentUserId);
            if (currentUser?.OrganizationId != targetUser.OrganizationId)
            {
                return TypedResults.Unauthorized();
            }

            var result = await _userService.DeleteUserAsync(id);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            return TypedResults.Ok(new SuccessResponse { Message = "ユーザーを削除しました。" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ユーザー削除中にエラーが発生しました: UserId={UserId}", id);
            throw;
        }
    }

    /// <summary>
    /// ユーザーのスキルを設定
    /// </summary>
    /// <remarks>
    /// 指定したユーザーのスキルを設定します（洗い替え）。組織内のユーザーのみ操作可能です。
    /// </remarks>
    /// <param name="id">ユーザーID</param>
    /// <param name="request">スキルIDのリスト</param>
    /// <response code="200">スキルを設定しました</response>
    /// <response code="403">他組織のユーザーは操作できません</response>
    /// <response code="404">ユーザーが見つかりません</response>
    [HttpPut("{id}/skills")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, UnauthorizedHttpResult>
    > SetUserSkills(int id, [FromBody] SetUserSkillsRequest request)
    {
        try
        {
            var currentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // 操作対象ユーザーが同じ組織に所属しているか確認
            var targetUser = await _userService.GetUserByIdAsync(id);
            if (targetUser == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            var currentUser = await _userService.GetUserByIdAsync(currentUserId);
            if (currentUser?.OrganizationId != targetUser.OrganizationId)
            {
                return TypedResults.Unauthorized();
            }

            var result = await _userService.SetUserSkillsAsync(id, request.SkillIds, currentUserId);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse { Message = "ユーザーが見つかりません。" }
                );
            }

            return TypedResults.Ok(new SuccessResponse { Message = "スキルを設定しました。" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "スキル設定中にエラーが発生しました: UserId={UserId}", id);
            throw;
        }
    }
}

/// <summary>
/// アクティブ状態設定リクエスト
/// </summary>
public class SetUserActiveStatusRequest
{
    /// <summary>
    /// アクティブ状態（true: 有効, false: 無効）
    /// </summary>
    public required bool IsActive { get; set; }
}

/// <summary>
/// スキル設定リクエスト
/// </summary>
public class SetUserSkillsRequest
{
    /// <summary>
    /// スキルIDのリスト
    /// </summary>
    public required List<int> SkillIds { get; set; }
}
