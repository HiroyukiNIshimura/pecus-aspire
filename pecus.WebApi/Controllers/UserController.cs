using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Models.Responses.User;
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
    private readonly AchievementService _achievementService;
    private readonly ILogger<UserController> _logger;

    public UserController(
        UserService userService,
        AchievementService achievementService,
        ProfileService profileService,
        ILogger<UserController> logger
    ) : base(profileService, logger)
    {
        _userService = userService;
        _achievementService = achievementService;
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
                organizationId: CurrentOrganizationId,
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
            Skills = u.UserSkills
                .Where(us => us.Skill != null && us.Skill.IsActive)
                .Select(us => new UserSearchSkillResponse
                {
                    Id = us.Skill!.Id,
                    Name = us.Skill.Name,
                })
                .OrderBy(s => s.Name)
                .ToList(),
        }).ToList();

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 指定ユーザーの取得済み実績を取得
    /// </summary>
    /// <remarks>
    /// 対象ユーザーの公開範囲設定に基づきフィルタリングされます。
    /// 公開範囲外の場合は空のリストが返却されます。
    /// </remarks>
    /// <param name="userId">対象ユーザーID</param>
    /// <returns>取得済み実績のリスト（公開範囲外の場合は空リスト）</returns>
    [HttpGet("{userId:int}/achievements")]
    [ProducesResponseType(typeof(List<UserAchievementResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<UserAchievementResponse>>> GetUserAchievements(int userId)
    {
        var response = await _achievementService.GetUserAchievementsAsync(
            userId,
            CurrentUserId,
            CurrentOrganizationId
        );
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 指定ユーザーのスキル一覧を取得
    /// </summary>
    /// <remarks>
    /// 対象ユーザーが持つアクティブなスキルの一覧を取得します。
    /// スキル名、説明、追加日時を含みます。
    /// </remarks>
    /// <param name="userId">対象ユーザーID</param>
    /// <returns>スキル一覧</returns>
    [HttpGet("{userId:int}/skills")]
    [ProducesResponseType(typeof(List<UserSkillDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<UserSkillDetailResponse>>> GetUserSkills(int userId)
    {
        var response = await _userService.GetUserSkillsAsync(userId);
        return TypedResults.Ok(response);
    }
}