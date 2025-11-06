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
    public async Task<Ok<OrganizationDetailResponse>> GetMyOrganization()
    {
        // ログイン中のユーザーIDを取得
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        // ユーザー情報を取得して組織IDを取得
        var user = await _userService.GetUserByIdAsync(me);
        if (user == null || user.OrganizationId == null)
        {
            throw new NotFoundException("ユーザーが組織に所属していません。");
        }

        var organization = await _organizationService.GetOrganizationByIdAsync(
            user.OrganizationId.Value
        );
        if (organization == null)
        {
            throw new NotFoundException("組織が見つかりません。");
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
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<OrganizationResponse>> UpdateMyOrganization(
        [FromBody] AdminUpdateOrganizationRequest request
    )
    {
        // ログイン中のユーザーIDを取得
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        // ユーザー情報を取得して組織IDを取得
        var user = await _userService.GetUserByIdAsync(me);
        if (user == null || user.OrganizationId == null)
        {
            throw new NotFoundException("ユーザーが組織に所属していません。");
        }

        var organization = await _organizationService.AdminUpdateOrganizationAsync(
            user.OrganizationId.Value,
            request,
            me
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
}
