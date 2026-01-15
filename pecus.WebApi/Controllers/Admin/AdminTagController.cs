using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers.Admin;

/// <summary>
/// タグ管理コントローラー（組織管理者用）
/// </summary>
[Route("api/admin/tags")]
[Produces("application/json")]
[Tags("Admin - Tag")]
public class AdminTagController : BaseAdminController
{
    private readonly TagService _tagService;
    private readonly ILogger<AdminTagController> _logger;
    private readonly PecusConfig _config;

    public AdminTagController(
        TagService tagService,
        ILogger<AdminTagController> logger,
        PecusConfig config,
        ProfileService profileService
    ) : base(profileService, logger)
    {
        _tagService = tagService;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// タグ登録
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(TagResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Created<TagResponse>> CreateTag([FromBody] CreateTagRequest request)
    {
        // 組織内のタグ数をチェック
        await _tagService.CheckTagCountByOrganizationAsync(CurrentOrganizationId);

        var tag = await _tagService.CreateTagAsync(request, CurrentOrganizationId, CurrentUserId);

        var response = new TagResponse
        {
            Success = true,
            Message = "タグが正常に作成されました。",
            Tag = new TagDetailResponse
            {
                Id = tag.Id,
                Name = tag.Name,
                OrganizationId = tag.OrganizationId,
                CreatedAt = tag.CreatedAt,
                CreatedByUserId = tag.CreatedByUserId,
                IsActive = tag.IsActive,
                ItemCount = tag.WorkspaceItemTags?.Count ?? 0,
                RowVersion = tag.RowVersion!,
            },
        };
        return TypedResults.Created($"/api/admin/tags/{tag.Id}", response);
    }

    /// <summary>
    /// タグ情報取得
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(TagDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<TagDetailResponse>> GetTag(int id)
    {
        var tag = await _tagService.GetTagByIdAsync(id, CurrentOrganizationId);
        if (tag == null)
        {
            throw new NotFoundException("タグが見つかりません。");
        }

        var response = new TagDetailResponse
        {
            Id = tag.Id,
            Name = tag.Name,
            OrganizationId = tag.OrganizationId,
            CreatedAt = tag.CreatedAt,
            CreatedByUserId = tag.CreatedByUserId,
            UpdatedAt = tag.UpdatedAt,
            UpdatedByUserId = tag.UpdatedByUserId,
            IsActive = tag.IsActive,
            ItemCount = tag.WorkspaceItemTags?.Count ?? 0,
            RowVersion = tag.RowVersion!,
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// タグ一覧取得（ページネーション）
    /// </summary>
    /// <remarks>
    /// タグの一覧をページネーションで取得します。
    /// 統計情報として、タグのトータル件数、アクティブ/非アクティブ件数、
    /// 利用されているトップ５タグ、利用されていないタグのリストを含みます。
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(
        typeof(PagedResponse<TagListItemResponse, TagStatistics>),
        StatusCodes.Status200OK
    )]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<PagedResponse<TagListItemResponse, TagStatistics>>> GetTags(
        [FromQuery] GetTagsRequest request
    )
    {
        var validatedPage = PaginationHelper.ValidatePageNumber(request.Page);
        var pageSize = _config.Pagination.DefaultPageSize;

        (List<Tag> tags, int totalCount) = await _tagService.GetTagsByOrganizationPagedAsync(
            CurrentOrganizationId,
            validatedPage,
            pageSize,
            request.IsActive,
            request.UnusedOnly,
            request.Name
        );

        var items = tags
            .Select(t => new TagListItemResponse
            {
                Id = t.Id,
                Name = t.Name,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                IsActive = t.IsActive,
                ItemCount = t.WorkspaceItemTags?.Count ?? 0,
            })
            .ToList();

        // 統計情報を取得
        var statistics = await _tagService.GetTagStatisticsByOrganizationAsync(CurrentOrganizationId);

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
    /// タグ更新
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(TagResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<TagDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<TagResponse>> UpdateTag(int id, [FromBody] UpdateTagRequest request)
    {
        var updatedTag = await _tagService.UpdateTagAsync(id, CurrentOrganizationId, request, CurrentUserId);

        var response = new TagResponse
        {
            Success = true,
            Message = "タグが正常に更新されました。",
            Tag = new TagDetailResponse
            {
                Id = updatedTag.Id,
                Name = updatedTag.Name,
                OrganizationId = updatedTag.OrganizationId,
                CreatedAt = updatedTag.CreatedAt,
                CreatedByUserId = updatedTag.CreatedByUserId,
                UpdatedAt = updatedTag.UpdatedAt,
                UpdatedByUserId = updatedTag.UpdatedByUserId,
                IsActive = updatedTag.IsActive,
                ItemCount = updatedTag.WorkspaceItemTags?.Count ?? 0,
                RowVersion = updatedTag.RowVersion!,
            },
        };
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// タグ削除
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> DeleteTag(int id)
    {
        var tag = await _tagService.GetTagByIdAsync(id, CurrentOrganizationId);
        if (tag == null)
        {
            throw new NotFoundException("タグが見つかりません。");
        }

        var result = await _tagService.DeleteTagAsync(id, CurrentOrganizationId);
        if (!result)
        {
            throw new NotFoundException("タグが見つかりません。");
        }

        return TypedResults.Ok(
            new SuccessResponse { Message = "タグが正常に削除されました。" }
        );
    }

    /// <summary>
    /// タグ無効化
    /// </summary>
    [HttpPatch("{id}/deactivate")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<TagDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> DeactivateTag(int id)
    {
        var tag = await _tagService.GetTagByIdAsync(id, CurrentOrganizationId);
        if (tag == null)
        {
            throw new NotFoundException("タグが見つかりません。");
        }

        var result = await _tagService.DeactivateTagAsync(id, CurrentUserId);
        if (!result)
        {
            throw new NotFoundException("タグが見つかりません。");
        }

        return TypedResults.Ok(
            new SuccessResponse { Message = "タグが正常に無効化されました。" }
        );
    }

    /// <summary>
    /// タグ有効化
    /// </summary>
    [HttpPatch("{id}/activate")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<TagDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<SuccessResponse>> ActivateTag(int id)
    {
        var tag = await _tagService.GetTagByIdAsync(id, CurrentOrganizationId);
        if (tag == null)
        {
            throw new NotFoundException("タグが見つかりません。");
        }

        var result = await _tagService.ActivateTagAsync(id, CurrentUserId);
        if (!result)
        {
            throw new NotFoundException("タグが見つかりません。");
        }

        return TypedResults.Ok(
            new SuccessResponse { Message = "タグが正常に有効化されました。" }
        );
    }
}