using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers.Backend;

/// <summary>
/// 組織管理コントローラー（バックエンド管理用）
/// </summary>
[Route("api/backend/organizations")]
[Produces("application/json")]
[Tags("Backend - Organization")]
public class BackendOrganizationController : BaseBackendController
{
    private readonly OrganizationService _organizationService;
    private readonly PecusConfig _config;
    private readonly ILogger<BackendOrganizationController> _logger;

    public BackendOrganizationController(
        OrganizationService organizationService,
        ILogger<BackendOrganizationController> logger,
        ProfileService profileService,
        PecusConfig config
    )
        : base(profileService, logger)
    {
        _organizationService = organizationService;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// 組織情報取得
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(OrganizationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<OrganizationResponse>> GetOrganization(int id)
    {
        var organization = await _organizationService.GetOrganizationByIdAsync(id);
        if (organization == null)
        {
            throw new NotFoundException("組織が見つかりません。");
        }

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
            UpdatedAt = organization.UpdatedAt,
            IsActive = organization.IsActive,
            UserCount = organization.Users.Count,
            RowVersion = organization.RowVersion!,
        };
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 組織一覧取得（ページネーション対応）
    /// </summary>
    /// <param name="request">組織一覧取得リクエスト</param>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<OrganizationListItemResponse>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<OrganizationListItemResponse>>> GetOrganizations([FromQuery] GetOrganizationsRequest request)
    {
        var validatedPage = PaginationHelper.ValidatePageNumber(request.Page);
        var pageSize = _config.Pagination.DefaultPageSize;

        (List<Organization> organizations, int totalCount) = await _organizationService.GetOrganizationsPagedAsync(
            validatedPage,
            pageSize,
            request.ActiveOnly
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
            data: organizationResponses,
            totalCount: totalCount,
            page: validatedPage,
            pageSize: pageSize
        );

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 組織の所属ユーザー取得
    /// </summary>
    [HttpGet("{id}/users")]
    [ProducesResponseType(typeof(IEnumerable<UserItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<IEnumerable<UserItem>>> GetOrganizationUsers(int id)
    {
        var users = await _organizationService.GetOrganizationUsersAsync(id);
        var response = users.Select(u => new UserItem
        {
            Id = u.Id,
            LoginId = u.LoginId,
            Username = u.Username,
            Email = u.Email,
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                iconType: u.AvatarType,
                userId: u.Id,
                username: u.Username,
                email: u.Email,
                avatarPath: u.UserAvatarPath
            ),
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt,
            LastLoginAt = u.LastLoginAt,
            RoleCount = u.Roles.Count,
        });

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 組織更新
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(OrganizationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<OrganizationResponse>> UpdateOrganization(int id, [FromBody] BackendUpdateOrganizationRequest request)
    {
        // ログイン中のユーザーIDを取得
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        var organization = await _organizationService.BackendUpdateOrganizationAsync(id, request, me);

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
            UpdatedAt = organization.UpdatedAt,
            IsActive = organization.IsActive,
            UserCount = organization.Users.Count,
            RowVersion = organization.RowVersion!,
        };
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 組織削除
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> DeleteOrganization(int id, [FromBody] DeleteOrganizationRequest request)
    {
        var result = await _organizationService.DeleteOrganizationAsync(id, request);
        if (!result)
        {
            throw new NotFoundException("組織が見つかりません。");
        }

        return TypedResults.Ok(
            new SuccessResponse
            {
                StatusCode = StatusCodes.Status200OK,
                Message = "組織を削除しました。",
            }
        );
    }

    /// <summary>
    /// 組織のアクティブ状態を設定
    /// </summary>
    /// <param name="id">組織ID</param>
    /// <param name="request">アクティブ状態設定リクエスト</param>
    [HttpPut("{id}/active-status")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > SetOrganizationActiveStatus(int id, [FromBody] SetOrganizationActiveStatusRequest request)
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var result = await _organizationService.SetOrganizationActiveStatusAsync(
                id,
                request,
                me
            );
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

            var message = request.IsActive ? "組織を有効化しました。" : "組織を無効化しました。";
            return TypedResults.Ok(
                new SuccessResponse { StatusCode = StatusCodes.Status200OK, Message = message }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "組織アクティブ状態設定中にエラーが発生しました。OrganizationId: {OrganizationId}",
                id
            );
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}