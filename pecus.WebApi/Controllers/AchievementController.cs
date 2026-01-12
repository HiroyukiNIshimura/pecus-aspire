using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// 実績（Achievement）管理コントローラー
/// </summary>
/// <remarks>
/// ユーザーの実績コレクション、取得済み実績の参照、通知済みマークなどを提供します。
/// </remarks>
[Route("api/achievements")]
[Tags("Achievement")]
public class AchievementController : BaseSecureController
{
    private readonly AchievementService _achievementService;
    private readonly ILogger<AchievementController> _logger;

    public AchievementController(
        ILogger<AchievementController> logger,
        ProfileService profileService,
        AchievementService achievementService
    ) : base(profileService, logger)
    {
        _logger = logger;
        _achievementService = achievementService;
    }

    /// <summary>
    /// 全実績マスタをユーザーの取得状況付きで取得（コレクションページ用）
    /// </summary>
    /// <remarks>
    /// 未取得の実績は名前・説明・アイコンが隠蔽されます（シークレットバッジ対応）。
    /// </remarks>
    /// <returns>実績コレクションのリスト</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<AchievementCollectionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<AchievementCollectionResponse>>> GetAchievementCollection()
    {
        var response = await _achievementService.GetAchievementCollectionAsync(CurrentUserId);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 自分の取得済み実績を取得
    /// </summary>
    /// <returns>取得済み実績のリスト</returns>
    [HttpGet("me")]
    [ProducesResponseType(typeof(List<UserAchievementResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<UserAchievementResponse>>> GetOwnAchievements()
    {
        var response = await _achievementService.GetOwnAchievementsAsync(CurrentUserId);
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
    [HttpGet("users/{userId:int}")]
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
    /// 未通知の実績を取得
    /// </summary>
    /// <remarks>
    /// まだユーザーに通知していない新規取得実績を取得します。
    /// バッジ取得演出の表示判定に使用します。
    /// </remarks>
    /// <returns>未通知実績のリスト</returns>
    [HttpGet("me/unnotified")]
    [ProducesResponseType(typeof(List<NewAchievementResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<NewAchievementResponse>>> GetUnnotifiedAchievements()
    {
        var response = await _achievementService.GetUnnotifiedAchievementsAsync(CurrentUserId);
        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 実績を通知済みにマーク
    /// </summary>
    /// <remarks>
    /// バッジ取得演出を表示した後に呼び出し、重複表示を防ぎます。
    /// </remarks>
    /// <param name="achievementId">実績マスタID</param>
    /// <returns>成功時は 204 No Content</returns>
    [HttpPost("me/{achievementId:int}/notify")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<NoContent> MarkAsNotified(int achievementId)
    {
        var success = await _achievementService.MarkAsNotifiedAsync(CurrentUserId, achievementId);
        if (!success)
        {
            throw new NotFoundException("実績が見つかりません。");
        }
        return TypedResults.NoContent();
    }

    /// <summary>
    /// 全ての未通知実績を通知済みにマーク
    /// </summary>
    /// <remarks>
    /// 一括で全ての未通知実績を通知済みにします。
    /// コレクションページを開いた際などに使用します。
    /// </remarks>
    /// <returns>成功時は 204 No Content</returns>
    [HttpPost("me/notify-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<NoContent> MarkAllAsNotified()
    {
        await _achievementService.MarkAllAsNotifiedAsync(CurrentUserId);
        return TypedResults.NoContent();
    }
}
