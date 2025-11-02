using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;
using Pecus.Models.Requests.Tag;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Tag;
using Pecus.Services;

namespace Pecus.Controllers.Admin;

/// <summary>
/// タグ管理コントローラー（組織管理者用）
/// </summary>
[ApiController]
[Route("api/admin/tags")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class AdminTagController : ControllerBase
{
    private readonly TagService _tagService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly ILogger<AdminTagController> _logger;
    private readonly PecusConfig _config;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="tagService"></param>
    /// <param name="accessHelper"></param>
    /// <param name="logger"></param>
    /// <param name="config"></param>
    public AdminTagController(
        TagService tagService,
        OrganizationAccessHelper accessHelper,
        ILogger<AdminTagController> logger,
        PecusConfig config
    )
    {
        _tagService = tagService;
        _accessHelper = accessHelper;
        _logger = logger;
        _config = config;
    }

    /// <summary>
    /// タグ登録
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(TagResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<TagResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > CreateTag([FromBody] CreateTagRequest request)
    {
        try
        {
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

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

            // 組織内のタグ数をチェック
            var existingTagCount = await _tagService.GetTagCountByOrganizationAsync(organizationId.Value);
            if (existingTagCount >= _config.Limits.MaxTagsPerOrganization)
            {
                return TypedResults.BadRequest(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Message = $"組織あたりの最大タグ数({_config.Limits.MaxTagsPerOrganization})に達しています。",
                    }
                );
            }

            var tag = await _tagService.CreateTagAsync(request, organizationId.Value, me);

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
                },
            };
            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
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
        catch (InvalidOperationException ex)
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
            _logger.LogError(ex, "タグ登録中にエラーが発生しました。Name: {Name}", request.Name);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// タグ情報取得
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(TagDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<TagDetailResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > GetTag(int id)
    {
        try
        {
            var tag = await _tagService.GetTagByIdAsync(id);
            if (tag == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
            }

            if (!await CanAccessTagAsync(tag))
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
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
            };

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "タグ情報取得中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
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
    public async Task<
        Results<Ok<PagedResponse<TagListItemResponse, TagStatistics>>, StatusCodeHttpResult>
    > GetTags([FromQuery] GetTagsRequest request)
    {
        try
        {
            var organizationId = await GetUserOrganizationIdAsync();
            if (!organizationId.HasValue)
            {
                return TypedResults.Ok(
                    PaginationHelper.CreatePagedResponse<TagListItemResponse, TagStatistics>(
                        data: new List<TagListItemResponse>(),
                        totalCount: 0,
                        page: 1,
                        pageSize: _config.Pagination.DefaultPageSize,
                        summary: null
                    )
                );
            }

            var validatedPage = PaginationHelper.ValidatePageNumber(request.Page);
            var pageSize = _config.Pagination.DefaultPageSize;

            (List<Tag> tags, int totalCount) =
                await _tagService.GetTagsByOrganizationPagedAsync(
                    organizationId.Value,
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
            var statistics = await _tagService.GetTagStatisticsByOrganizationAsync(organizationId.Value);

            var response = PaginationHelper.CreatePagedResponse(
                data: items,
                totalCount: totalCount,
                page: validatedPage,
                pageSize: pageSize,
                summary: statistics
            );
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "タグ一覧取得中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// タグ更新
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(TagResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<
            Ok<TagResponse>,
            BadRequest<ErrorResponse>,
            NotFound<ErrorResponse>,
            StatusCodeHttpResult
        >
    > UpdateTag(int id, [FromBody] UpdateTagRequest request)
    {
        try
        {
            var tag = await _tagService.GetTagByIdAsync(id);
            if (tag == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
            }

            if (!await CanAccessTagAsync(tag))
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
            }

            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var updatedTag = await _tagService.UpdateTagAsync(id, request, me);

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
                },
            };
            return TypedResults.Ok(response);
        }
        catch (NotFoundException ex)
        {
            return TypedResults.NotFound(
                new ErrorResponse
                {
                    StatusCode = StatusCodes.Status404NotFound,
                    Message = ex.Message,
                }
            );
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
        catch (InvalidOperationException ex)
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
            _logger.LogError(ex, "タグ更新中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// タグ削除
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > DeleteTag(int id)
    {
        try
        {
            var tag = await _tagService.GetTagByIdAsync(id);
            if (tag == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
            }

            if (!await CanAccessTagAsync(tag))
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
            }

            var result = await _tagService.DeleteTagAsync(id);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "タグが正常に削除されました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "タグ削除中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// タグ無効化
    /// </summary>
    [HttpPatch("{id}/deactivate")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > DeactivateTag(int id)
    {
        try
        {
            var tag = await _tagService.GetTagByIdAsync(id);
            if (tag == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
            }

            if (!await CanAccessTagAsync(tag))
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
            }

            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var result = await _tagService.DeactivateTagAsync(id, me);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "タグが正常に無効化されました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "タグ無効化中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// タグ有効化
    /// </summary>
    [HttpPatch("{id}/activate")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > ActivateTag(int id)
    {
        try
        {
            var tag = await _tagService.GetTagByIdAsync(id);
            if (tag == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
            }

            if (!await CanAccessTagAsync(tag))
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
            }

            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

            var result = await _tagService.ActivateTagAsync(id, me);
            if (!result)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "タグが見つかりません。",
                    }
                );
            }

            return TypedResults.Ok(
                new SuccessResponse
                {
                    StatusCode = StatusCodes.Status200OK,
                    Message = "タグが正常に有効化されました。",
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "タグ有効化中にエラーが発生しました。ID: {Id}", id);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// ログインユーザーの組織IDを取得
    /// </summary>
    private async Task<int?> GetUserOrganizationIdAsync()
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
        return await _accessHelper.GetUserOrganizationIdAsync(me);
    }

    /// <summary>
    /// ログインユーザーが指定したタグにアクセス可能かチェック
    /// </summary>
    private async Task<bool> CanAccessTagAsync(Tag tag)
    {
        var organizationId = await GetUserOrganizationIdAsync();
        return organizationId.HasValue && organizationId.Value == tag.OrganizationId;
    }
}
