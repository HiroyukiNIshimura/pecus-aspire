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
using Pecus.Models.Requests.BackOffice;
using Pecus.Models.Responses.BackOffice;
using Pecus.Models.Responses.Common;
using Pecus.Services;

namespace Pecus.Controllers.Entrance;

/// <summary>
/// バックオフィス用コントローラー（組織管理）
/// </summary>
[ApiController]
[Route("api/backoffice/organizations")]
[Produces("application/json")]
[Tags("BackOffice - Organizations")]
public class BackOfficeController : BaseBackendController
{
    private readonly OrganizationService _organizationService;
    private readonly BackOfficeOrganizationService _backOfficeOrganizationService;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILogger<BackOfficeController> _logger;
    private readonly FrontendUrlResolver _frontendUrlResolver;

    public BackOfficeController(
        ProfileService profileService,
        OrganizationService organizationService,
        BackOfficeOrganizationService backOfficeOrganizationService,
        IBackgroundJobClient backgroundJobClient,
        ILogger<BackOfficeController> logger,
        FrontendUrlResolver frontendUrlResolver
    ) : base(
        profileService: profileService,
        logger: logger
    )
    {
        _organizationService = organizationService;
        _backOfficeOrganizationService = backOfficeOrganizationService;
        _backgroundJobClient = backgroundJobClient;
        _logger = logger;
        _frontendUrlResolver = frontendUrlResolver;
    }

    /// <summary>
    /// 組織一覧を取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<BackOfficeOrganizationListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Ok<PagedResponse<BackOfficeOrganizationListItemResponse>>> GetOrganizations(
        [FromQuery] BackOfficeGetOrganizationsRequest request)
    {
        var response = await _backOfficeOrganizationService.GetOrganizationsAsync(request);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 組織詳細を取得
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(BackOfficeOrganizationDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Ok<BackOfficeOrganizationDetailResponse>> GetOrganization(int id)
    {
        var response = await _backOfficeOrganizationService.GetOrganizationAsync(id);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 組織を更新
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(BackOfficeOrganizationDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<Ok<BackOfficeOrganizationDetailResponse>> UpdateOrganization(
        int id,
        [FromBody] BackOfficeUpdateOrganizationRequest request)
    {
        var response = await _backOfficeOrganizationService.UpdateOrganizationAsync(
            id,
            request,
            CurrentUserId);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 組織を削除（物理削除）
    /// </summary>
    /// <remarks>
    /// 組織とすべての関連データを物理削除します。
    /// 誤操作防止のため、確認用に組織名の入力が必要です。
    /// </remarks>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<NoContent> DeleteOrganization(
        int id,
        [FromBody] BackOfficeDeleteOrganizationRequest request)
    {
        await _backOfficeOrganizationService.DeleteOrganizationAsync(id, request);
        return TypedResults.NoContent();
    }

    /// <summary>
    /// 組織登録（管理者ユーザーも同時作成）
    /// </summary>
    /// <remarks>
    /// 新規組織を登録し、管理者ユーザーを同時に作成します。
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