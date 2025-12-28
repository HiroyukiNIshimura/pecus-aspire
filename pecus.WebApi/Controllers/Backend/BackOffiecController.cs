using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Controllers.Backend;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Libs.Security;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers.Entrance;

/// <summary>
/// バックオフィス用コントローラー
/// </summary>
[ApiController]
[Route("api/backoffice/organizations")]
[Produces("application/json")]
[Tags("BackOffice")]
public class BackOfficeController : BaseBackendController
{
    private readonly OrganizationService _organizationService;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<BackOfficeController> _logger;
    private readonly FrontendUrlResolver _frontendUrlResolver;

    public BackOfficeController(
        ProfileService profileService,
        OrganizationService organizationService,
        IBackgroundJobClient backgroundJobClient,
        ILogger<BackOfficeController> logger,
        FrontendUrlResolver frontendUrlResolver
    ) : base(
        profileService: profileService,
        logger: logger
    )
    {
        _organizationService = organizationService;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
        _frontendUrlResolver = frontendUrlResolver;
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

        // Aspire の Frontend:Endpoint からフロントエンドURLを取得
        var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl();
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
                organization.Id,
                organization.Email ?? string.Empty,
                "組織登録完了",
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
                // Setting は含めない（登録完了画面では不要）
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
                LastLoginAt = adminUser.LastLoginAt,
                RowVersion = adminUser.RowVersion!,
                IsAdmin = true,
                // Setting は含めない（登録完了画面では不要）
            },
        };
        return TypedResults.Ok(response);
    }
}