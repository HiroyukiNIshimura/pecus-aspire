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
[Route("api/admin/organization")]
[Produces("application/json")]
public class AdminOrganizationController : BaseAdminController
{
    private readonly OrganizationService _organizationService;
    private readonly UserService _userService;
    private readonly ILogger<AdminOrganizationController> _logger;

    public AdminOrganizationController(
        OrganizationService organizationService,
        UserService userService,
        ProfileService profileService,
        ILogger<AdminOrganizationController> logger
    ) : base(profileService, logger)
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
    [ProducesResponseType(typeof(OrganizationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<OrganizationResponse>> GetMyOrganization()
    {
        // CurrentUser は基底クラスで有効性チェック済み
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("ユーザーが組織に所属していません。");
        }

        var organization = await _organizationService.GetOrganizationByIdAsync(
            CurrentUser.OrganizationId.Value
        );
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
    /// 自組織の情報を更新
    /// </summary>
    /// <remarks>
    /// ログイン中のユーザーが属する組織の情報を更新します。
    /// </remarks>
    [HttpPut]
    [ProducesResponseType(typeof(OrganizationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<OrganizationResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<OrganizationResponse>> UpdateMyOrganization(
        [FromBody] AdminUpdateOrganizationRequest request
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("ユーザーが組織に所属していません。");
        }

        var organization = await _organizationService.AdminUpdateOrganizationAsync(
            CurrentUser.OrganizationId.Value,
            request,
            CurrentUserId
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
            UpdatedAt = organization.UpdatedAt,
            IsActive = organization.IsActive,
            UserCount = organization.Users.Count,
            RowVersion = organization.RowVersion!,
        };

        return TypedResults.Ok(response);
    }
}
