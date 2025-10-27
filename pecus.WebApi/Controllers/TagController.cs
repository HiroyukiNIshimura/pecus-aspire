using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Requests.Tag;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Tag;
using Pecus.Services;

namespace Pecus.Controllers;

[ApiController]
[Route("api/tags")]
[Produces("application/json")]
public class TagController : ControllerBase
{
    private readonly TagService _tagService;
    private readonly UserService _userService;
    private readonly ILogger<TagController> _logger;

    public TagController(
        TagService tagService,
        UserService userService,
        ILogger<TagController> logger
    )
    {
        _tagService = tagService;
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// タグ作成
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
            // ログイン中のユーザーIDと組織IDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
            var user = await _userService.GetUserByIdAsync(me);

            if (user?.OrganizationId == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "組織に所属していません。",
                    }
                );
            }

            var tag = await _tagService.CreateTagAsync(user.OrganizationId.Value, request, me);

            var response = new TagResponse
            {
                Success = true,
                Message = "タグを作成しました。",
                Tag = new TagDetailResponse
                {
                    Id = tag.Id,
                    OrganizationId = tag.OrganizationId,
                    Name = tag.Name,
                    CreatedAt = tag.CreatedAt,
                    CreatedByUserId = tag.CreatedByUserId,
                    CreatedByUsername = tag.CreatedByUser?.Username,
                    UpdatedAt = tag.UpdatedAt,
                    ItemCount = 0,
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "タグ作成中にエラーが発生しました。");
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// 組織のタグ一覧取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<TagDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<List<TagDetailResponse>>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > GetTags()
    {
        try
        {
            // ログイン中のユーザーの組織IDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
            var user = await _userService.GetUserByIdAsync(me);

            if (user?.OrganizationId == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "組織に所属していません。",
                    }
                );
            }

            var tags = await _tagService.GetTagsByOrganizationAsync(user.OrganizationId.Value);

            var response = tags.Select(tag => new TagDetailResponse
            {
                Id = tag.Id,
                OrganizationId = tag.OrganizationId,
                Name = tag.Name,
                CreatedAt = tag.CreatedAt,
                CreatedByUserId = tag.CreatedByUserId,
                CreatedByUsername = tag.CreatedByUser?.Username,
                UpdatedAt = tag.UpdatedAt,
                ItemCount = tag.WorkspaceItemTags?.Count ?? 0,
            })
                .ToList();

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
    [HttpPut("{tagId}")]
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
    > UpdateTag(int tagId, [FromBody] UpdateTagRequest request)
    {
        try
        {
            // ログイン中のユーザーの組織IDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
            var user = await _userService.GetUserByIdAsync(me);

            if (user?.OrganizationId == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "組織に所属していません。",
                    }
                );
            }

            var tag = await _tagService.UpdateTagAsync(user.OrganizationId.Value, tagId, request);

            var response = new TagResponse
            {
                Success = true,
                Message = "タグを更新しました。",
                Tag = new TagDetailResponse
                {
                    Id = tag.Id,
                    OrganizationId = tag.OrganizationId,
                    Name = tag.Name,
                    CreatedAt = tag.CreatedAt,
                    CreatedByUserId = tag.CreatedByUserId,
                    CreatedByUsername = tag.CreatedByUser?.Username,
                    UpdatedAt = tag.UpdatedAt,
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "タグ更新中にエラーが発生しました。TagId: {TagId}", tagId);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// タグ削除
    /// </summary>
    [HttpDelete("{tagId}")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<
        Results<Ok<SuccessResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>
    > DeleteTag(int tagId)
    {
        try
        {
            // ログイン中のユーザーの組織IDを取得
            var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
            var user = await _userService.GetUserByIdAsync(me);

            if (user?.OrganizationId == null)
            {
                return TypedResults.NotFound(
                    new ErrorResponse
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Message = "組織に所属していません。",
                    }
                );
            }

            await _tagService.DeleteTagAsync(user.OrganizationId.Value, tagId);

            var response = new SuccessResponse
            {
                StatusCode = StatusCodes.Status200OK,
                Message = "タグを削除しました。",
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "タグ削除中にエラーが発生しました。TagId: {TagId}", tagId);
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
