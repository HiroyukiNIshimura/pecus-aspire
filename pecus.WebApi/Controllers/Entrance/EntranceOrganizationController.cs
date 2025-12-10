using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers.Entrance;

/// <summary>
/// 組織登録コントローラー（公開エンドポイント）
/// </summary>
[ApiController]
[Route("api/entrance/organizations")]
[Produces("application/json")]
[AllowAnonymous]
[Tags("Entrance - Organization")]
public class EntranceOrganizationController : ControllerBase
{
    private readonly OrganizationService _organizationService;
    private readonly EmailTasks _emailTasks;
    private readonly PecusConfig _config;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<EntranceOrganizationController> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public EntranceOrganizationController(
        OrganizationService organizationService,
        EmailTasks emailTasks,
        PecusConfig config,
        IBackgroundJobClient backgroundJobClient,
        ILogger<EntranceOrganizationController> logger,
        IHttpContextAccessor httpContextAccessor
    )
    {
        _organizationService = organizationService;
        _emailTasks = emailTasks;
        _config = config;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// 組織登録（管理者ユーザーも同時作成）
    /// </summary>
    /// <remarks>
    /// 新規組織を登録し、管理者ユーザーを同時に作成します。
    /// このエンドポイントは未認証でアクセス可能です（新規サインアップ用）。
    /// 管理者ユーザーへはパスワード設定メールが送信されます。
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(typeof(OrganizationWithAdminResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<OrganizationWithAdminResponse>> CreateOrganization([FromBody] CreateOrganizationRequest request)
    {
        var (organization, adminUser, passwordSetupToken, tokenExpiresAt) =
            await _organizationService.CreateOrganizationWithUserAsync(request);

        // 動的にBaseUrlを取得
        var requestContext = _httpContextAccessor.HttpContext?.Request;
        var baseUrl = requestContext != null ? $"{requestContext.Scheme}://{requestContext.Host}" : "https://localhost";

        // パスワード設定URLを構築
        var passwordSetupUrl = $"{baseUrl}/password-setup?token={passwordSetupToken}";

        // 組織登録完了メールを送信（Hangfireでバックグラウンド実行）
        var emailModel = new OrganizationCreatedEmailModel
        {
            OrganizationName = organization.Name,
            OrganizationEmail = organization.Email ?? string.Empty,
            RepresentativeName = organization.RepresentativeName ?? string.Empty,
            AdminUserName = adminUser.Username,
            AdminEmail = adminUser.Email,
            PasswordSetupUrl = passwordSetupUrl,
            TokenExpiresAt = tokenExpiresAt,
            CreatedAt = organization.CreatedAt,
        };

        // バックグラウンドでメール送信
        _backgroundJobClient.Enqueue<EmailTasks>(x =>
            x.SendTemplatedEmailAsync(
                organization.Email ?? string.Empty,
                "組織登録完了",
                "organization-created",
                emailModel
            )
        );

        _logger.LogInformation(
            "組織を登録しました。管理者登録完了メールを送信しました: {Email}",
            organization.Email
        );

        var response = new OrganizationWithAdminResponse
        {
            Organization = new OrganizationResponse
            {
                Id = organization.Id,
                Name = organization.Name,
                Code = organization.Code,
                Description = organization.Description,
                RepresentativeName = organization.RepresentativeName,
                PhoneNumber = organization.PhoneNumber,
                Email = organization.Email,
                CreatedAt = organization.CreatedAt,
                RowVersion = organization.RowVersion!,
                Setting = new OrganizationSettingResponse
                {
                    TaskOverdueThreshold = organization.Setting?.TaskOverdueThreshold ?? 0,
                    WeeklyReportDeliveryDay = organization.Setting?.WeeklyReportDeliveryDay ?? 0,
                    MailFromAddress = organization.Setting?.MailFromAddress,
                    MailFromName = organization.Setting?.MailFromName,
                    GenerativeApiVendor = organization.Setting?.GenerativeApiVendor ?? GenerativeApiVendor.None,
                    Plan = organization.Setting?.Plan ?? OrganizationPlan.Free,
                    RowVersion = organization.Setting?.RowVersion ?? 0,
                },
            },
            AdminUser = new UserDetailResponse
            {
                Id = adminUser.Id,
                OrganizationId = adminUser.OrganizationId,
                LoginId = adminUser.LoginId,
                Username = adminUser.Username,
                Email = adminUser.Email,
                AvatarType = adminUser.AvatarType,
                IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                    iconType: adminUser.AvatarType,
                    userId: adminUser.Id,
                    username: adminUser.Username,
                    email: adminUser.Email,
                    avatarPath: adminUser.UserAvatarPath
                ),
                Roles = adminUser.Roles?
                    .Select(r => new UserRoleResponse
                    {
                        Id = r.Id,
                        Name = r.Name,
                    })
                    .ToList() ?? new List<UserRoleResponse>(),
                CreatedAt = adminUser.CreatedAt,
                RowVersion = adminUser.RowVersion!,
                IsAdmin = true,
                Setting = new UserSettingResponse
                {
                    CanReceiveEmail = adminUser.Setting?.CanReceiveEmail ?? true,
                    RowVersion = adminUser.Setting?.RowVersion ?? 0,
                },
            },
        };
        return TypedResults.Ok(response);
    }
}