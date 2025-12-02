using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests.User;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.Master;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// ユーザー関連コントローラー
/// </summary>
[Route("api/users")]
[Produces("application/json")]
[Tags("User")]
public class UserController : BaseSecureController
{
    private readonly UserService _userService;
    private readonly ILogger<UserController> _logger;

    public UserController(
        UserService userService,
        ProfileService profileService,
        ILogger<UserController> logger
    ) : base(profileService, logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// ユーザーをあいまい検索
    /// </summary>
    /// <remarks>
    /// ユーザー名またはメールアドレスであいまい検索を行います。
    /// pgroonga を使用しているため、日本語の漢字のゆらぎやタイポにも対応します。
    /// ワークスペースへのメンバー追加時などに使用します。
    /// </remarks>
    /// <param name="request">検索リクエスト</param>
    /// <response code="200">検索結果を返します</response>
    /// <response code="400">検索クエリが短すぎます</response>
    [HttpGet("search")]
    [ProducesResponseType(typeof(List<UserSearchResultResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<Ok<List<UserSearchResultResponse>>> SearchUsers(
        [FromQuery] SearchUsersRequest request
    )
    {
        List<User> users = await _userService.SearchUsersWithPgroongaAsync(
                organizationId: CurrentUser!.OrganizationId!.Value,
                searchQuery: request.Q,
                limit: request.Limit
            );

        var response = users.Select(u => new UserSearchResultResponse
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            AvatarType = u.AvatarType,
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                iconType: u.AvatarType,
                userId: u.Id,
                username: u.Username,
                email: u.Email,
                avatarPath: u.UserAvatarPath
            ),
        }).ToList();

        return TypedResults.Ok(response);
    }
}
