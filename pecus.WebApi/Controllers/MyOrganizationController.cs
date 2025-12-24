using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// ログインユーザーの所属組織情報コントローラー
/// </summary>
[Route("api/my/organization")]
[Produces("application/json")]
[Tags("My")]
public class MyOrganizationController : BaseSecureController
{
    private readonly OrganizationService _organizationService;
    private readonly ILogger<MyOrganizationController> _logger;

    public MyOrganizationController(
        OrganizationService organizationService,
        ProfileService profileService,
        ILogger<MyOrganizationController> logger
    ) : base(profileService, logger)
    {
        _organizationService = organizationService;
        _logger = logger;
    }

    /// <summary>
    /// ログインユーザーの所属組織情報を取得
    /// </summary>
    /// <remarks>
    /// 組織の基本情報を返します。
    /// 組織設定は GET /api/profile/app-settings で取得してください。
    /// </remarks>
    /// <response code="200">組織情報を返します</response>
    /// <response code="404">組織に所属していない、または組織が見つかりません</response>
    [HttpGet]
    [ProducesResponseType(typeof(OrganizationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<OrganizationResponse>> GetMyOrganization()
    {
        var organization = await _organizationService.GetOrganizationByIdAsync(
            CurrentOrganizationId
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
            // Setting は含めない（AppSettingsProviderで取得）
        };

        return TypedResults.Ok(response);
    }
}