using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Organization;
using Pecus.Models.Responses.User;
using Pecus.Services;

namespace Pecus.Controllers.Backend;

/// <summary>
/// 組織管理コントローラー（バックエンド管理用）
/// </summary>
[ApiController]
[Route("api/backend/organizations")]
[Produces("application/json")]
[Authorize(Roles = "Backend")]
public class OrganizationController : ControllerBase
{
    private readonly OrganizationService _organizationService;
    private readonly ILogger<OrganizationController> _logger;
    private readonly PecusConfig _config;

    public OrganizationController(
        OrganizationService organizationService,
        ILogger<OrganizationController> logger,
        PecusConfig config
    )
    {
        _organizationService = organizationService;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// 組織情報取得
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(OrganizationDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<OrganizationDetailResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > GetOrganization(int id)
    {
        try
        {
            var organization = await _organizationService.GetOrganizationByIdAsync(id);
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

            var response = new OrganizationDetailResponse
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
            _logger.LogError(
                ex,
                "組織情報取得中にエラーが発生しました。OrganizationId: {OrganizationId}",
                id
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 組織一覧取得（ページネーション対応）
    /// </summary>
    /// <param name="page">ページ番号（1から始まる）</param>
    /// <param name="activeOnly">アクティブな組織のみ取得する場合はtrue</param>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<OrganizationListItemResponse>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<PagedResponse<OrganizationListItemResponse>>, StatusCodeHttpResult>
    > GetOrganizations([FromQuery] int? page, [FromQuery] bool? activeOnly = true)
    {
        try
        {
            var validatedPage = PaginationHelper.ValidatePageNumber(page);
            var pageSize = _config.Pagination.DefaultPageSize;

            var (organizations, totalCount) = await _organizationService.GetOrganizationsPagedAsync(
                validatedPage,
                pageSize,
                activeOnly
            );

            var organizationResponses = organizations.Select(o => new OrganizationListItemResponse
            {
                Id = o.Id,
                Name = o.Name,
                Code = o.Code,
                RepresentativeName = o.RepresentativeName,
                PhoneNumber = o.PhoneNumber,
                Email = o.Email,
                IsActive = o.IsActive,
                CreatedAt = o.CreatedAt,
                UserCount = o.Users.Count,
            });

            var response = PaginationHelper.CreatePagedResponse(
                organizationResponses,
                totalCount,
                validatedPage,
                pageSize
            );

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "組織一覧取得中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 組織の所属ユーザー取得
    /// </summary>
    [HttpGet("{id}/users")]
    [ProducesResponseType(typeof(IEnumerable<UserListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<IEnumerable<UserListItemResponse>>, StatusCodeHttpResult>
    > GetOrganizationUsers(int id)
    {
        try
        {
            var users = await _organizationService.GetOrganizationUsersAsync(id);
            var response = users.Select(u => new UserListItemResponse
            {
                Id = u.Id,
                LoginId = u.LoginId,
                Username = u.Username,
                Email = u.Email,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                LastLoginAt = u.LastLoginAt,
                RoleCount = u.Roles.Count,
            });

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "組織の所属ユーザー取得中にエラーが発生しました。OrganizationId: {OrganizationId}",
                id
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 組織更新
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(OrganizationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<OrganizationResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > UpdateOrganization(int id, [FromBody] UpdateOrganizationRequest request)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var organization = await _organizationService.UpdateOrganizationAsync(
                id,
                request,
                userId
            );

            var response = new OrganizationResponse
            {
                Id = organization.Id,
                Name = organization.Name,
                Code = organization.Code,
                Description = organization.Description,
                RepresentativeName = organization.RepresentativeName,
                PhoneNumber = organization.PhoneNumber,
                Email = organization.Email,
                CreatedAt = organization.CreatedAt,
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
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "組織更新中にエラーが発生しました。OrganizationId: {OrganizationId}",
                id
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 組織削除
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<SuccessResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > DeleteOrganization(int id)
    {
        try
        {
            var result = await _organizationService.DeleteOrganizationAsync(id);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "組織が見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "組織を削除しました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "組織削除中にエラーが発生しました。OrganizationId: {OrganizationId}",
                id
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 組織を無効化
    /// </summary>
    [HttpPatch("{id}/deactivate")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > DeactivateOrganization(int id)
    {
        try
        {
            var result = await _organizationService.DeactivateOrganizationAsync(id);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "組織が見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "組織を無効化しました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "組織無効化中にエラーが発生しました。OrganizationId: {OrganizationId}",
                id
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 組織を有効化
    /// </summary>
    [HttpPatch("{id}/activate")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > ActivateOrganization(int id)
    {
        try
        {
            var result = await _organizationService.ActivateOrganizationAsync(id);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "組織が見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "組織を有効化しました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "組織有効化中にエラーが発生しました。OrganizationId: {OrganizationId}",
                id
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
