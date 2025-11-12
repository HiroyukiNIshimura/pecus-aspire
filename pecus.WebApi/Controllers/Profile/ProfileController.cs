using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Requests;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.User;
using Pecus.Models.Validation;
using Pecus.Services;

namespace Pecus.Controllers.Profile;

/// <summary>
/// プロフィール管理コントローラー
/// </summary>
/// <remarks>
/// 自ユーザーのプロフィール、スキル、メールアドレス変更など自己管理機能を提供します。
/// すべての操作は ProfileService 経由で実行されます。
/// </remarks>
[Route("api/profile")]
[Tags("Profile")]
public class ProfileController : BaseSecureController
{
    private readonly ProfileService _profileService;
    private readonly ILogger<ProfileController> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public ProfileController(
        ILogger<ProfileController> logger,
        ProfileService profileService
    ) : base(profileService, logger)
    {
        _logger = logger;
        _profileService = profileService;
    }

    /// <summary>
    /// 自分のプロフィール情報を取得
    /// </summary>
    /// <remarks>
    /// ユーザーの基本情報（ユーザー名、アバター、スキル、ロール等）を取得します。
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<UserResponse>> GetProfile()
    {
        // CurrentUser は基底クラスで有効性チェック済み
        var response = await _profileService.GetOwnProfileAsync(CurrentUserId);
        if (response == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 自分のプロフィール情報を更新
    /// </summary>
    /// <remarks>
    /// ユーザーが自身のプロフィール（ユーザー名、アバタータイプ、アバターURL）を更新します。
    /// スキル変更は別エンドポイント（PUT /api/profile/skills）で実施してください。
    /// </remarks>
    /// <param name="request">更新情報</param>
    /// <returns>更新結果</returns>
    [HttpPut]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<UserResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<UserResponse>> UpdateProfile(UpdateProfileRequest request)
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // プロフィール情報を更新（ProfileService 経由）
        var result = await _profileService.UpdateOwnProfileAsync(CurrentUserId, request);
        if (!result)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // 更新後のプロフィール情報を取得して返す
        var response = await _profileService.GetOwnProfileAsync(CurrentUserId);
        if (response == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 自分のスキルを設定
    /// </summary>
    /// <remarks>
    /// ユーザーが自身のスキルを設定します（洗い替え）。
    /// 指定されたスキル以外のスキルは削除されます。
    /// </remarks>
    /// <param name="request">スキルIDのリスト</param>
    /// <response code="200">スキルを設定しました</response>
    /// <response code="400">リクエストが無効です</response>
    /// <response code="404">ユーザーが見つかりません</response>
    /// <response code="409">競合: スキル情報が別のユーザーにより更新されています</response>
    [HttpPut("skills")]
    [ProducesResponseType(typeof(SuccessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<UserResponse>), StatusCodes.Status409Conflict)]
    public async Task<Ok<SuccessResponse>> SetOwnSkills(
        [FromBody] SetOwnSkillsRequest request
    )
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // スキルを設定（ProfileService 経由）
        var result = await _profileService.SetOwnSkillsAsync(
            userId: CurrentUserId,
            skillIds: request.SkillIds,
            userRowVersion: request.UserRowVersion
        );

        if (!result)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        return TypedResults.Ok(new SuccessResponse { Message = "スキルを設定しました。" });
    }

    /// <summary>
    /// パスワードを変更
    /// </summary>
    /// <remarks>
    /// ユーザーが自身のパスワードを変更します。重要なセキュリティ変更です。
    /// 現在のパスワードの確認（古いパスワード）が必須です。
    /// </remarks>
    /// <param name="request">変更情報</param>
    /// <returns>結果</returns>
    [HttpPatch("password")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<MessageResponse>> UpdatePassword(UpdatePasswordRequest request)
    {
        // CurrentUser は基底クラスで有効性チェック済み
        // パスワードを変更（ProfileService 経由）
        var result = await _profileService.UpdatePasswordAsync(
            userId: CurrentUserId,
            currentPassword: request.CurrentPassword,
            newPassword: request.NewPassword
        );

        if (!result)
        {
            throw new InvalidOperationException("現在のパスワードが正しくありません。");
        }

        return TypedResults.Ok(new MessageResponse { Message = "パスワードを変更しました。" });
    }
}

/// <summary>
/// 自ユーザースキル設定リクエスト
/// </summary>
public class SetOwnSkillsRequest
{
    /// <summary>
    /// スキルIDのリスト。既存のすべてのスキルを置き換えます。
    /// 空のリストまたはnullの場合はすべてのスキルを削除します。
    /// </summary>
    [IntListRange(1, 50)]
    public List<int>? SkillIds { get; set; }

    /// <summary>
    /// ユーザーの楽観的ロック用RowVersion。
    /// 競合検出に使用されます。設定されている場合、ユーザーのRowVersionをチェックします。
    /// </summary>
    public uint? UserRowVersion { get; set; }
}