using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs.AI;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Services;

namespace Pecus.Controllers.Admin;

/// <summary>
/// 組織管理コントローラー（組織管理者用）
/// </summary>
[Route("api/admin/organization")]
[Produces("application/json")]
[Tags("Admin - Organization")]
public class AdminOrganizationController : BaseAdminController
{
    private readonly OrganizationService _organizationService;
    private readonly UserService _userService;
    private readonly IAiClientFactory _aiClientFactory;
    private readonly ILogger<AdminOrganizationController> _logger;

    public AdminOrganizationController(
        OrganizationService organizationService,
        UserService userService,
        ProfileService profileService,
        IAiClientFactory aiClientFactory,
        ILogger<AdminOrganizationController> logger
    ) : base(profileService, logger)
    {
        _organizationService = organizationService;
        _userService = userService;
        _aiClientFactory = aiClientFactory;
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
            Setting = new OrganizationSettingResponse
            {
                TaskOverdueThreshold = organization.Setting?.TaskOverdueThreshold ?? 0,
                WeeklyReportDeliveryDay = organization.Setting?.WeeklyReportDeliveryDay ?? 0,
                MailFromAddress = organization.Setting?.MailFromAddress,
                MailFromName = organization.Setting?.MailFromName,
                GenerativeApiVendor = organization.Setting?.GenerativeApiVendor ?? GenerativeApiVendor.None,
                GenerativeApiKey = organization.Setting?.GenerativeApiKey,
                Plan = organization.Setting?.Plan ?? OrganizationPlan.Free,
                HelpNotificationTarget = organization.Setting?.HelpNotificationTarget,
                RequireEstimateOnTaskCreation = organization.Setting?.RequireEstimateOnTaskCreation ?? false,
                EnforcePredecessorCompletion = organization.Setting?.EnforcePredecessorCompletion ?? false,
                DashboardHelpCommentMaxCount = organization.Setting?.DashboardHelpCommentMaxCount ?? 6,
                GroupChatScope = organization.Setting?.GroupChatScope,
                RowVersion = organization.Setting?.RowVersion ?? 0,
            },
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
            Setting = new OrganizationSettingResponse
            {
                TaskOverdueThreshold = organization.Setting?.TaskOverdueThreshold ?? 0,
                WeeklyReportDeliveryDay = organization.Setting?.WeeklyReportDeliveryDay ?? 0,
                MailFromAddress = organization.Setting?.MailFromAddress,
                MailFromName = organization.Setting?.MailFromName,
                GenerativeApiVendor = organization.Setting?.GenerativeApiVendor ?? GenerativeApiVendor.None,
                GenerativeApiKey = organization.Setting?.GenerativeApiKey,
                Plan = organization.Setting?.Plan ?? OrganizationPlan.Free,
                HelpNotificationTarget = organization.Setting?.HelpNotificationTarget,
                RequireEstimateOnTaskCreation = organization.Setting?.RequireEstimateOnTaskCreation ?? false,
                EnforcePredecessorCompletion = organization.Setting?.EnforcePredecessorCompletion ?? false,
                DashboardHelpCommentMaxCount = organization.Setting?.DashboardHelpCommentMaxCount ?? 6,
                GroupChatScope = organization.Setting?.GroupChatScope,
                RowVersion = organization.Setting?.RowVersion ?? 0,
            },
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 自組織の設定を更新
    /// </summary>
    /// <remarks>
    /// タスク期限や配信設定などの組織設定を更新します。
    /// </remarks>
    [HttpPut("setting")]
    [ProducesResponseType(typeof(OrganizationSettingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<OrganizationSettingResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<OrganizationSettingResponse>> UpdateMyOrganizationSetting(
        [FromBody] AdminUpdateOrganizationSettingRequest request
    )
    {
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("ユーザーが組織に所属していません。");
        }

        var setting = await _organizationService.AdminUpdateOrganizationSettingAsync(
            organizationId: CurrentUser.OrganizationId.Value,
            request: request,
            updatedByUserId: CurrentUserId
        );

        return TypedResults.Ok(setting);
    }

    /// <summary>
    /// 指定したAPIキーとベンダーで利用可能なAIモデル一覧を取得
    /// </summary>
    /// <remarks>
    /// APIキーとベンダーを指定して、そのベンダーで利用可能なモデル一覧を取得します。
    /// モデル選択UIで使用します。
    /// </remarks>
    [HttpPost("available-models")]
    [ProducesResponseType(typeof(IReadOnlyList<AvailableModelResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<IReadOnlyList<AvailableModelResponse>>> GetAvailableModels(
        [FromBody] GetAvailableModelsRequest request,
        CancellationToken cancellationToken
    )
    {
        if (request.Vendor == GenerativeApiVendor.None)
        {
            throw new BadRequestException("ベンダーを指定してください。");
        }

        var client = _aiClientFactory.CreateClient(request.Vendor, request.ApiKey);
        if (client == null)
        {
            throw new BadRequestException("指定されたベンダーのクライアントを作成できませんでした。");
        }

        var models = await client.GetAvailableModelsAsync(request.ApiKey, cancellationToken);

        var response = models.Select(m => new AvailableModelResponse
        {
            Id = m.Id,
            Name = m.Name,
            Description = m.Description
        }).ToList();

        return TypedResults.Ok<IReadOnlyList<AvailableModelResponse>>(response);
    }
}