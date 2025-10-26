using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Permission;
using Pecus.Models.Responses.Role;
using Pecus.Models.Responses.User;
using Pecus.Services;

namespace Pecus.Controllers;

[ApiController]
[Route("api/users")]
[Produces("application/json")]
public class UserController : ControllerBase
{
    private readonly UserService _userService;
    private readonly ILogger<UserController> _logger;
    private readonly PecusConfig _config;

    public UserController(
        UserService userService,
        ILogger<UserController> logger,
        PecusConfig config
    )
    {
        _userService = userService;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// ユーザー登録
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<UserResponse>, BadRequest<ErrorResponse>, StatusCodeHttpResult>
    > Register([FromBody] CreateUserRequest request)
    {
        try
        {
            var user = await _userService.CreateUserAsync(request);
            var response = new UserResponse
            {
                Id = user.Id,
                LoginId = user.LoginId,
                Username = user.Username,
                Email = user.Email,
                CreatedAt = user.CreatedAt,
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
            _logger.LogError(
                ex,
                "ユーザー登録中にエラーが発生しました。Username: {Username}",
                request.Username
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ログイン
    /// </summary>
    /// <remarks>
    /// EmailまたはLoginIdとパスワードでログインします
    /// </remarks>
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<LoginResponse>, UnauthorizedHttpResult, StatusCodeHttpResult>
    > Login([FromBody] LoginRequest request)
    {
        try
        {
            var user = await _userService.AuthenticateAsync(request);
            if (user == null)
            {
                return TypedResults.Unauthorized();
            }

            // JWTトークンを生成
            var token = JwtBearerUtil.GenerateToken(user);
            var expiresAt = JwtBearerUtil.GetTokenExpiration();
            var expiresIn = JwtBearerUtil.GetExpiresMinutes() * 60; // 秒に変換

            var response = new LoginResponse
            {
                AccessToken = token,
                TokenType = "Bearer",
                ExpiresAt = expiresAt,
                ExpiresIn = expiresIn,
                UserId = user.Id,
                LoginId = user.LoginId,
                Username = user.Username,
                Email = user.Email,
                AvatarType = user.AvatarType,
                IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                    user.AvatarType,
                    user.Id,
                    user.Username,
                    user.Email,
                    user.AvatarUrl
                ),
                Roles = user
                    .Roles.Select(r => new RoleInfoResponse { Id = r.Id, Name = r.Name })
                    .ToList(),
            };
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ログイン中にエラーが発生しました。LoginIdentifier: {LoginIdentifier}",
                request.LoginIdentifier
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ログアウト
    /// </summary>
    /// <remarks>
    /// 現在のユーザーをログアウトします。
    /// JWTトークンをブラックリストに追加して即座に無効化します。
    /// </remarks>
    [HttpPost("logout")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, UnauthorizedHttpResult, StatusCodeHttpResult>
    > Logout()
    {
        try
        {
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            var jti = JwtBearerUtil.GetJtiFromPrincipal(User);

            if (!string.IsNullOrEmpty(jti))
            {
                // トークンをブラックリストに追加
                var tokenExpiration = JwtBearerUtil.GetTokenExpirationFromPrincipal(User);
                var blacklistService =
                    HttpContext.RequestServices.GetRequiredService<TokenBlacklistService>();
                await blacklistService.BlacklistTokenAsync(jti, tokenExpiration);
            }

            _logger.LogInformation(
                "ユーザーがログアウトしました。UserId: {UserId}, JTI: {Jti}",
                userId,
                jti
            );

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "ログアウトしました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ログアウト中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ユーザー情報取得
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(UserDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<UserDetailResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > GetUser(int id)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ユーザーが見つかりません。",
                    }
                );
            }

            var response = new UserDetailResponse
            {
                Id = user.Id,
                LoginId = user.LoginId,
                Username = user.Username,
                Email = user.Email,
                AvatarType = user.AvatarType,
                IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                    user.AvatarType,
                    user.Id,
                    user.Username,
                    user.Email,
                    user.AvatarUrl
                ),
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Roles = user
                    .Roles.Select(r => new RoleInfoResponse { Id = r.Id, Name = r.Name })
                    .ToList(),
                Permissions = user
                    .Roles.SelectMany(r => r.Permissions)
                    .Distinct()
                    .Select(p => new PermissionInfoResponse { Id = p.Id, Name = p.Name })
                    .ToList(),
            };
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ユーザー情報取得中にエラーが発生しました。UserId: {UserId}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ユーザー一覧取得（ページネーション対応）
    /// </summary>
    /// <param name="page">ページ番号（1から始まる）</param>
    /// <param name="activeOnly">アクティブなユーザーのみ取得する場合はtrue</param>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<UserListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<PagedResponse<UserListItemResponse>>, StatusCodeHttpResult>
    > GetUsers([FromQuery] int? page, [FromQuery] bool? activeOnly)
    {
        try
        {
            var validatedPage = PaginationHelper.ValidatePageNumber(page);
            var pageSize = _config.Pagination.DefaultPageSize;

            var (users, totalCount) = await _userService.GetUsersPagedAsync(
                validatedPage,
                pageSize,
                activeOnly
            );

            var userResponses = users
                .Select(u => new UserListItemResponse
                {
                    Id = u.Id,
                    LoginId = u.LoginId,
                    Username = u.Username,
                    Email = u.Email,
                    AvatarType = u.AvatarType,
                    IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                        u.AvatarType,
                        u.Id,
                        u.Username,
                        u.Email,
                        u.AvatarUrl
                    ),
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    LastLoginAt = u.LastLoginAt,
                    RoleCount = u.Roles.Count,
                })
                .ToList();

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
            _logger.LogError(ex, "ユーザー一覧取得中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ユーザー削除
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > DeleteUser(int id)
    {
        try
        {
            var result = await _userService.DeleteUserAsync(id);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ユーザーが見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "ユーザーを削除しました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ユーザー削除中にエラーが発生しました。UserId: {UserId}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ユーザー更新（プロフィール情報のみ）
    /// </summary>
    /// <remarks>
    /// このエンドポイントではアバタータイプのみ更新可能です。
    /// メールアドレスやパスワードの変更機能は現在提供されていません。
    /// </remarks>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<UserResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var user = await _userService.UpdateUserAsync(id, request, userId);

            var response = new UserResponse
            {
                Id = user.Id,
                LoginId = user.LoginId,
                Username = user.Username,
                Email = user.Email,
                CreatedAt = user.CreatedAt,
            };
            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
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
        catch (InvalidOperationException ex)
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
            _logger.LogError(ex, "ユーザー更新中にエラーが発生しました。UserId: {UserId}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ユーザーにロールを割り当て
    /// </summary>
    [HttpPut("{userId}/roles/{roleId}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > AssignRole(int userId, int roleId)
    {
        try
        {
            var result = await _userService.AssignRoleToUserAsync(userId, roleId);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ユーザーまたはロールが見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "ロールを割り当てました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ロール割り当て中にエラーが発生しました。UserId: {UserId}, RoleId: {RoleId}",
                userId,
                roleId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ユーザーからロールを削除
    /// </summary>
    [HttpDelete("{userId}/roles/{roleId}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > RemoveRoleFromUser(int userId, int roleId)
    {
        try
        {
            var result = await _userService.RemoveRoleFromUserAsync(userId, roleId);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ユーザーまたはロールが見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "ロールを削除しました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ロール削除中にエラーが発生しました。UserId: {UserId}, RoleId: {RoleId}",
                userId,
                roleId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ユーザーの権限確認
    /// </summary>
    [HttpGet("{userId}/permissions/{permissionName}")]
    [ProducesResponseType(typeof(PermissionCheckResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<PermissionCheckResponse>, StatusCodeHttpResult>
    > CheckUserPermission(int userId, string permissionName)
    {
        try
        {
            var hasPermission = await _userService.UserHasPermissionAsync(userId, permissionName);
            var response = new PermissionCheckResponse
            {
                UserId = userId,
                PermissionName = permissionName,
                HasPermission = hasPermission,
            };
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "権限確認中にエラーが発生しました。UserId: {UserId}, PermissionName: {PermissionName}",
                userId,
                permissionName
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ユーザーの全権限取得
    /// </summary>
    [HttpGet("{userId}/permissions")]
    [ProducesResponseType(
        typeof(IEnumerable<PermissionDetailInfoResponse>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<IEnumerable<PermissionDetailInfoResponse>>, StatusCodeHttpResult>
    > GetUserPermissions(int userId)
    {
        try
        {
            var permissions = await _userService.GetUserPermissionsAsync(userId);
            var response = permissions.Select(p => new PermissionDetailInfoResponse
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Category = p.Category,
            });
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "ユーザー権限取得中にエラーが発生しました。UserId: {UserId}",
                userId
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ログイン中のユーザーの組織情報取得
    /// </summary>
    [HttpGet("me/organization")]
    [ProducesResponseType(
        typeof(Pecus.Models.Responses.Organization.OrganizationDetailResponse),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<Pecus.Models.Responses.Organization.OrganizationDetailResponse>,
            NotFound<ErrorResponse>,
            UnauthorizedHttpResult,
            StatusCodeHttpResult
        >
    > GetMyOrganization()
    {
        try
        {
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            var user = await _userService.GetUserByIdAsync(userId);

            if (user == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ユーザーが見つかりません。",
                    }
                );
            }

            if (user.OrganizationId == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "組織に所属していません。",
                    }
                );
            }

            var organizationService =
                HttpContext.RequestServices.GetRequiredService<OrganizationService>();
            var organization = await organizationService.GetOrganizationByIdAsync(
                user.OrganizationId.Value
            );

            if (organization == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "組織が見つかりません。",
                    }
                );
            }

            var response = new Pecus.Models.Responses.Organization.OrganizationDetailResponse
            {
                Id = organization.Id,
                Name = organization.Name,
                Code = organization.Code,
                Description = organization.Description,
                RepresentativeName = organization.RepresentativeName,
                PhoneNumber = organization.PhoneNumber,
                Email = organization.Email,
                CreatedAt = organization.CreatedAt,
                UpdatedAt = organization.UpdatedAt,
                IsActive = organization.IsActive,
                UserCount = organization.Users.Count,
            };

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ログイン中のユーザーの組織情報取得中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ログイン中のユーザーの組織内ユーザー一覧取得（ページネーション対応）
    /// </summary>
    /// <param name="page">ページ番号（1から始まる）</param>
    /// <param name="activeOnly">アクティブなユーザーのみ取得する場合はtrue</param>
    [HttpGet("me/organization/users")]
    [ProducesResponseType(typeof(PagedResponse<UserListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<PagedResponse<UserListItemResponse>>,
            NotFound<ErrorResponse>,
            UnauthorizedHttpResult,
            StatusCodeHttpResult
        >
    > GetMyOrganizationUsers([FromQuery] int? page, [FromQuery] bool? activeOnly = true)
    {
        try
        {
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            var user = await _userService.GetUserByIdAsync(userId);

            if (user == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ユーザーが見つかりません。",
                    }
                );
            }

            if (user.OrganizationId == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "組織に所属していません。",
                    }
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

            var userResponses = users
                .Select(u => new UserListItemResponse
                {
                    Id = u.Id,
                    LoginId = u.LoginId,
                    Username = u.Username,
                    Email = u.Email,
                    AvatarType = u.AvatarType,
                    IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                        u.AvatarType,
                        u.Id,
                        u.Username,
                        u.Email,
                        u.AvatarUrl
                    ),
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                    LastLoginAt = u.LastLoginAt,
                    RoleCount = u.Roles.Count,
                })
                .ToList();

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
            _logger.LogError(
                ex,
                "ログイン中のユーザーの組織内ユーザー一覧取得中にエラーが発生しました。"
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
