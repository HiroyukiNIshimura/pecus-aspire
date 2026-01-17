using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers.Admin;

/// <summary>
/// スキル管理コントローラー（組織管理者用）
/// </summary>
[Route("api/admin/skills")]
[Produces("application/json")]
[Tags("Admin - Skill")]
public class AdminSkillController : BaseAdminController
{
    private readonly SkillService _skillService;
    private readonly ILogger<AdminSkillController> _logger;
    private readonly PecusConfig _config;

    public AdminSkillController(
        SkillService skillService,
        ILogger<AdminSkillController> logger,
        PecusConfig config,
        ProfileService profileService
    ) : base(profileService, logger)
    {
        _skillService = skillService;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// スキル登録
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SkillResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Created<SkillResponse>> CreateSkill([FromBody] CreateSkillRequest request)
    {
        // 組織内のスキル数をチェック
        await _skillService.CheckSkillCountByOrganizationAsync(CurrentOrganizationId);

        var skill = await _skillService.CreateSkillAsync(request, CurrentOrganizationId, CurrentUserId);

        var response = new SkillResponse
        {
            Success = true,
            Message = "スキルが正常に作成されました。",
            Skill = new SkillDetailResponse
            {
                Id = skill.Id,
                Name = skill.Name,
                Description = skill.Description,
                OrganizationId = skill.OrganizationId,
                CreatedAt = skill.CreatedAt,
                CreatedByUserId = skill.CreatedByUserId,
                IsActive = skill.IsActive,
                UserCount = 0,
                RowVersion = skill.RowVersion!,
            },
        };
        return TypedResults.Created($"/api/admin/skills/{skill.Id}", response);
    }

    /// <summary>
    /// スキル情報取得
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(SkillDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SkillDetailResponse>> GetSkill(int id)
    {
        var skill = await _skillService.GetSkillByIdAsync(id, CurrentOrganizationId);
        if (skill == null)
        {
            throw new NotFoundException("スキルが見つかりません。");
        }

        var response = new SkillDetailResponse
        {
            Id = skill.Id,
            Name = skill.Name,
            Description = skill.Description,
            OrganizationId = skill.OrganizationId,
            CreatedAt = skill.CreatedAt,
            CreatedByUserId = skill.CreatedByUserId,
            UpdatedAt = skill.UpdatedAt,
            UpdatedByUserId = skill.UpdatedByUserId,
            IsActive = skill.IsActive,
            UserCount = skill.UserSkills?.Count ?? 0,
            RowVersion = skill.RowVersion!,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// スキル一覧取得（ページネーション）
    /// </summary>
    /// <remarks>
    /// スキルの一覧をページネーションで取得します。
    /// 統計情報として、スキルのトータル件数、アクティブ/非アクティブ件数、
    /// 利用されているトップ５スキル、利用されていないスキルのリストを含みます。
    /// </remarks>
    /// <param name="request">スキル一覧取得リクエスト</param>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<SkillListItemResponse, SkillStatistics>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<SkillListItemResponse, SkillStatistics>>> GetSkills(
        [FromQuery] GetSkillsRequest request
    )
    {
        var validatedPage = PaginationHelper.ValidatePageNumber(request.Page);
        var pageSize = _config.Pagination.DefaultPageSize;

        (List<Skill> skills, int totalCount) =
            await _skillService.GetSkillsByOrganizationPagedAsync(
                CurrentOrganizationId,
                validatedPage,
                pageSize,
                request.IsActive,
                request.UnusedOnly,
                request.Name
            );

        var items = skills
            .Select(
                s =>
                    new SkillListItemResponse
                    {
                        Id = s.Id,
                        Name = s.Name,
                        Description = s.Description,
                        CreatedAt = s.CreatedAt,
                        UpdatedAt = s.UpdatedAt,
                        IsActive = s.IsActive,
                        UserCount = s.UserSkills?.Count ?? 0,
                    }
            )
            .ToList();

        // 統計情報を取得
        var statistics =
            await _skillService.GetSkillStatisticsByOrganizationAsync(CurrentOrganizationId);

        var response = PaginationHelper.CreatePagedResponse(
            data: items,
            totalCount: totalCount,
            page: validatedPage,
            pageSize: pageSize,
            summary: statistics
        );
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// スキル更新
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(SkillResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<SkillDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SkillResponse>> UpdateSkill(
        int id,
        [FromBody] UpdateSkillRequest request
    )
    {
        var updatedSkill = await _skillService.UpdateSkillAsync(id, CurrentOrganizationId, request, CurrentUserId);

        var response = new SkillResponse
        {
            Success = true,
            Message = "スキルが正常に更新されました。",
            Skill = new SkillDetailResponse
            {
                Id = updatedSkill.Id,
                Name = updatedSkill.Name,
                Description = updatedSkill.Description,
                OrganizationId = updatedSkill.OrganizationId,
                CreatedAt = updatedSkill.CreatedAt,
                CreatedByUserId = updatedSkill.CreatedByUserId,
                UpdatedAt = updatedSkill.UpdatedAt,
                UpdatedByUserId = updatedSkill.UpdatedByUserId,
                IsActive = updatedSkill.IsActive,
                UserCount = updatedSkill.UserSkills?.Count ?? 0,
                RowVersion = updatedSkill.RowVersion!,
            },
        };
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// スキル削除
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> DeleteSkill(int id)
    {
        var skill = await _skillService.GetSkillByIdAsync(id, CurrentOrganizationId);
        if (skill == null)
        {
            throw new NotFoundException("スキルが見つかりません。");
        }

        var result = await _skillService.DeleteSkillAsync(id, CurrentOrganizationId);
        if (!result)
        {
            throw new NotFoundException("スキルが見つかりません。");
        }

        return TypedResults.Ok(
            new SuccessResponse { Message = "スキルが正常に削除されました。" }
        );
    }

    /// <summary>
    /// スキル無効化
    /// </summary>
    [HttpPatch("{id}/deactivate")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<SkillDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> DeactivateSkill(int id)
    {
        var skill = await _skillService.GetSkillByIdAsync(id, CurrentOrganizationId);
        if (skill == null)
        {
            throw new NotFoundException("スキルが見つかりません。");
        }

        var result = await _skillService.DeactivateSkillAsync(id, CurrentOrganizationId, CurrentUserId);
        if (!result)
        {
            throw new NotFoundException("スキルが見つかりません。");
        }

        return TypedResults.Ok(
            new SuccessResponse { Message = "スキルが正常に無効化されました。" }
        );
    }

    /// <summary>
    /// スキル有効化
    /// </summary>
    [HttpPatch("{id}/activate")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<SkillDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> ActivateSkill(int id)
    {
        var skill = await _skillService.GetSkillByIdAsync(id, CurrentOrganizationId);
        if (skill == null)
        {
            throw new NotFoundException("スキルが見つかりません。");
        }

        var result = await _skillService.ActivateSkillAsync(id, CurrentOrganizationId, CurrentUserId);
        if (!result)
        {
            throw new NotFoundException("スキルが見つかりません。");
        }

        return TypedResults.Ok(
            new SuccessResponse { Message = "スキルが正常に有効化されました。" }
        );
    }
}