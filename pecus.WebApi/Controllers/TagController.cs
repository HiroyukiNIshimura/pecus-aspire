using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Requests.Tag;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Tag;
using Pecus.Services;

namespace Pecus.Controllers;

[Route("api/tags")]
[Produces("application/json")]
public class TagController : BaseSecureController
{
    private readonly TagService _tagService;
    private readonly ILogger<TagController> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public TagController(
        TagService tagService,
        ProfileService profileService,
        ILogger<TagController> logger
    ) : base(profileService, logger)
    {
        _tagService = tagService;
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
    public async Task<Ok<TagResponse>> CreateTag([FromBody] CreateTagRequest request)
    {
        // CurrentUser は基底クラスで有効性チェック済み
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織に所属していません。");
        }

        var tag = await _tagService.CreateTagAsync(request, CurrentUser.OrganizationId.Value, CurrentUserId);

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
                IsActive = tag.IsActive,
                ItemCount = tag.WorkspaceItemTags?.Count ?? 0,
                RowVersion = tag.RowVersion!,
            },
        };

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 組織のタグ一覧取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<TagDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<TagDetailResponse>>> GetTags()
    {
        // CurrentUser は基底クラスで有効性チェック済み
        if (CurrentUser?.OrganizationId == null)
        {
            throw new NotFoundException("組織に所属していません。");
        }

        var tags = await _tagService.GetTagsByOrganizationAsync(CurrentUser.OrganizationId.Value);

        var response = tags
            .Select(tag => new TagDetailResponse
            {
                Id = tag.Id,
                OrganizationId = tag.OrganizationId,
                Name = tag.Name,
                CreatedAt = tag.CreatedAt,
                CreatedByUserId = tag.CreatedByUserId,
                IsActive = tag.IsActive,
                ItemCount = tag.WorkspaceItemTags?.Count ?? 0,
                RowVersion = tag.RowVersion!,
            })
            .ToList();

        return TypedResults.Ok(response);
    }
}
