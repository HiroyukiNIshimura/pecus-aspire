using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
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
    private readonly OrganizationService _organizationService;
    private readonly ILogger<ProfileController> _logger;

    public ProfileController(
        ILogger<ProfileController> logger,
        ProfileService profileService,
        OrganizationService organizationService
    ) : base(profileService, logger)
    {
        _logger = logger;
        _profileService = profileService;
        _organizationService = organizationService;
    }

    /// <summary>
    /// 自分のプロフィール情報を取得
    /// </summary>
    /// <remarks>
    /// ユーザーの基本情報（ユーザー名、アバター、スキル、ロール等）を取得します。
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(typeof(UserDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<UserDetailResponse>> GetProfile()
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
    [ProducesResponseType(typeof(UserDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<UserDetailResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<UserDetailResponse>> UpdateProfile(UpdateProfileRequest request)
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
    /// 自分のユーザー設定を更新
    /// </summary>
    /// <remarks>
    /// メール受信可否など、個人の設定を更新します。
    /// </remarks>
    /// <param name="request">設定更新リクエスト</param>
    /// <returns>更新後のユーザー設定</returns>
    [HttpPut("setting")]
    [ProducesResponseType(typeof(UserSettingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<UserSettingResponse>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<UserSettingResponse>> UpdateUserSetting(UpdateUserSettingRequest request)
    {
        var response = await _profileService.UpdateOwnSettingAsync(CurrentUserId, request);

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
    [ProducesResponseType(typeof(ConcurrencyErrorResponse<UserDetailResponse>), StatusCodes.Status409Conflict)]
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

    /// <summary>
    /// アプリケーション公開設定を取得
    /// </summary>
    /// <remarks>
    /// フロントエンドで利用可能な現在のユーザー情報、組織設定、ユーザー設定を統合して返します。
    /// APIキーやパスワード等のセンシティブ情報は含まれません。
    /// SSRでレイアウトレベルで取得し、Context経由で配信することを想定しています。
    /// </remarks>
    /// <response code="200">公開設定を返します</response>
    /// <response code="404">組織に所属していません</response>
    [HttpGet("app-settings")]
    [ProducesResponseType(typeof(AppPublicSettingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Ok<AppPublicSettingsResponse>> GetAppPublicSettings()
    {
        var currentUserInfo = await _profileService.GetCurrentUserInfoAsync(CurrentUserId);
        var organizationSettings = await _organizationService.GetOrganizationPublicSettingsAsync(CurrentOrganizationId);
        var userSettings = await _profileService.GetUserPublicSettingsAsync(CurrentUserId);

        var response = new AppPublicSettingsResponse
        {
            CurrentUser = currentUserInfo,
            Organization = organizationSettings,
            User = userSettings,
        };

        return TypedResults.Ok(response);
    }
}