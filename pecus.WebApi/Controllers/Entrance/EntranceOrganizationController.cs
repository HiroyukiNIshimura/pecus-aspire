using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Organization;
using Pecus.Models.Responses.User;
using Pecus.Services;

namespace Pecus.Controllers.Entrance;

/// <summary>
/// 組織登録コントローラー（公開エンドポイント）
/// </summary>
[ApiController]
[Route("api/entrance/organizations")]
[Produces("application/json")]
[AllowAnonymous]
public class EntranceOrganizationController : ControllerBase
{
    private readonly OrganizationService _organizationService;
    private readonly ILogger<EntranceOrganizationController> _logger;

    public EntranceOrganizationController(
        OrganizationService organizationService,
        ILogger<EntranceOrganizationController> logger
    )
    {
        _organizationService = organizationService;
        _logger = logger;
    }

    /// <summary>
    /// 組織登録（管理者ユーザーも同時作成）
    /// </summary>
    /// <remarks>
    /// 新規組織を登録し、管理者ユーザーを同時に作成します。
    /// このエンドポイントは未認証でアクセス可能です（新規サインアップ用）。
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(typeof(OrganizationWithAdminResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<OrganizationWithAdminResponse>, BadRequest<ErrorResponse>, StatusCodeHttpResult>
    > CreateOrganization([FromBody] CreateOrganizationRequest request)
    {
        try
        {
            var (organization, adminUser) =
                await _organizationService.CreateOrganizationWithUserAsync(request);

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
                },
                AdminUser = new UserResponse
                {
                    Id = adminUser.Id,
                    LoginId = adminUser.LoginId,
                    Username = adminUser.Username,
                    Email = adminUser.Email,
                    CreatedAt = adminUser.CreatedAt,
                },
            };
            return TypedResults.Ok(response);
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
            _logger.LogError(ex, "組織登録中にエラーが発生しました。Name: {Name}", request.Name);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
