using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs.DB.Models.Enums;
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
    /// 組織設定（TaskOverdueThreshold など）を含んだ組織情報を返します。
    /// </remarks>
    /// <response code="200">組織情報を返します</response>
    /// <response code="404">組織に所属していない、または組織が見つかりません</response>
    [HttpGet]
    [ProducesResponseType(typeof(OrganizationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<OrganizationResponse>> GetMyOrganization()
    {
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織に所属していません。");
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
            Setting = new OrganizationSettingResponse
            {
                TaskOverdueThreshold = organization.Setting?.TaskOverdueThreshold ?? 0,
                WeeklyReportDeliveryDay = organization.Setting?.WeeklyReportDeliveryDay ?? 0,
                MailFromAddress = organization.Setting?.MailFromAddress,
                MailFromName = organization.Setting?.MailFromName,
                GenerativeApiVendor = organization.Setting?.GenerativeApiVendor ?? GenerativeApiVendor.None,
                Plan = organization.Setting?.Plan ?? OrganizationPlan.Free,
                HelpNotificationTarget = organization.Setting?.HelpNotificationTarget,
                RequireEstimateOnTaskCreation = organization.Setting?.RequireEstimateOnTaskCreation ?? false,
                EnforcePredecessorCompletion = organization.Setting?.EnforcePredecessorCompletion ?? false,
                RowVersion = organization.Setting?.RowVersion ?? 0,
            },
        };

        return TypedResults.Ok(response);
    }
}