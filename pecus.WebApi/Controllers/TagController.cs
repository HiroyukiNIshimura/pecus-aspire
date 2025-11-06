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

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="tagService"></param>
    /// <param name="userService"></param>
    /// <param name="logger"></param>
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
    public async Task<Ok<TagResponse>> CreateTag([FromBody] CreateTagRequest request)
    {
        // ログイン中のユーザーIDと組織IDを取得
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
        var user = await _userService.GetUserByIdAsync(me);

        if (user?.OrganizationId == null)
        {
            throw new NotFoundException("組織に所属していません。");
        }

        var tag = await _tagService.CreateTagAsync(request, user.OrganizationId.Value, me);

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
        // ログイン中のユーザーの組織IDを取得
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
        var user = await _userService.GetUserByIdAsync(me);

        if (user?.OrganizationId == null)
        {
            throw new NotFoundException("組織に所属していません。");
        }

        var tags = await _tagService.GetTagsByOrganizationAsync(user.OrganizationId.Value);

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
            })
            .ToList();

        return TypedResults.Ok(response);
    }
}
