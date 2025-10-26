using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Organization;
using Pecus.Services;

namespace Pecus.Controllers.Admin;

/// <summary>
/// 組織管理コントローラー（組織管理者用）
/// </summary>
[ApiController]
[Route("api/admin/organization")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class AdminOrganizationController : ControllerBase
{
    private readonly OrganizationService _organizationService;
    private readonly UserService _userService;
    private readonly ILogger<AdminOrganizationController> _logger;

    public AdminOrganizationController(
        OrganizationService organizationService,
        UserService userService,
        ILogger<AdminOrganizationController> logger
    )
    {
        _organizationService = organizationService;
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// 自組織の情報を取得
    /// </summary>
    /// <remarks>
    /// ログイン中のユーザーが属する組織の詳細情報を取得します。
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(typeof(OrganizationDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<OrganizationDetailResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > GetMyOrganization()
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ユーザー情報を取得して組織IDを取得
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null || user.OrganizationId == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ユーザーが組織に所属していません。",
                    }
                );
            }

            var organization = await _organizationService.GetOrganizationByIdAsync(
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
                "組織情報取得中にエラーが発生しました。UserId: {UserId}",
                JwtBearerUtil.GetUserIdFromPrincipal(User)
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 自組織の情報を更新
    /// </summary>
    /// <remarks>
    /// ログイン中のユーザーが属する組織の情報を更新します。
    /// </remarks>
    [HttpPut]
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
    > UpdateMyOrganization([FromBody] UpdateOrganizationRequest request)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ユーザー情報を取得して組織IDを取得
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null || user.OrganizationId == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "ユーザーが組織に所属していません。",
                    }
                );
            }

            var organization = await _organizationService.UpdateOrganizationAsync(
                user.OrganizationId.Value,
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
                "組織更新中にエラーが発生しました。UserId: {UserId}",
                JwtBearerUtil.GetUserIdFromPrincipal(User)
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
