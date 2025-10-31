using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Master;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// マスターデータ取得コントローラー
/// </summary>
[ApiController]
[Route("api/master")]
[Produces("application/json")]
[Authorize]
public class MasterDataController : ControllerBase
{
    private readonly MasterDataService _masterDataService;
    private readonly WorkspaceAccessHelper _accessHelper;
    private readonly ILogger<MasterDataController> _logger;

    public MasterDataController(
        MasterDataService masterDataService,
        WorkspaceAccessHelper accessHelper,
        ILogger<MasterDataController> logger
    )
    {
        _masterDataService = masterDataService;
        _accessHelper = accessHelper;
        _logger = logger;
    }

    /// <summary>
    /// アクティブなジャンル一覧を取得
    /// </summary>
    [HttpGet("genres")]
    [ProducesResponseType(typeof(List<MasterGenreResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Results<Ok<List<MasterGenreResponse>>, StatusCodeHttpResult>> GetGenres()
    {
        try
        {
            var genres = await _masterDataService.GetActiveGenresAsync();

            var response = genres
          .Select(g => new MasterGenreResponse
          {
              Id = g.Id,
              Name = g.Name,
              Description = g.Description,
              Icon = g.Icon,
              DisplayOrder = g.DisplayOrder,
          })
            .ToList();

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ジャンル一覧取得中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ログインユーザーの属する組織のアクティブなスキル一覧を取得
    /// </summary>
    [HttpGet("skills")]
    [ProducesResponseType(typeof(List<MasterSkillResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Results<Ok<List<MasterSkillResponse>>, BadRequest<ErrorResponse>, StatusCodeHttpResult>> GetSkills()
    {
        try
        {
            // ログイン中のユーザーIDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            // ユーザーの所属組織を取得
            var organizationId = await _accessHelper.GetUserOrganizationIdAsync(me);
            if (!organizationId.HasValue)
            {
                return TypedResults.BadRequest(
                  new ErrorResponse
                  {
                      StatusCode = StatusCodes.Status400BadRequest,
                      Message = "ユーザーが組織に所属していません。",
                  }
                   );
            }

            var skills = await _masterDataService.GetActiveSkillsByOrganizationAsync(organizationId.Value);

            var response = skills
                .Select(s => new MasterSkillResponse
                {
                    Id = s.Id,
                    Name = s.Name,
                    Description = s.Description,
                })
        .ToList();

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "スキル一覧取得中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
