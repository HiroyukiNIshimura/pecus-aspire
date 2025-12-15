using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Models.Responses.Focus;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// フォーカス推奨コントローラー
/// タスクのフォーカス推奨機能を提供します
/// </summary>
[Route("api/focus")]
[Produces("application/json")]
[Tags("Focus")]
public class FocusController : BaseSecureController
{
    private readonly FocusRecommendationService _focusService;
    private readonly ILogger<FocusController> _logger;

    public FocusController(
        FocusRecommendationService focusService,
        ProfileService profileService,
        ILogger<FocusController> logger
    ) : base(profileService, logger)
    {
        _focusService = focusService;
        _logger = logger;
    }

    /// <summary>
    /// 自分のフォーカス推奨タスクを取得
    /// </summary>
    /// <returns>フォーカス推奨タスクリスト</returns>
    [HttpGet("me")]
    [ProducesResponseType(typeof(FocusRecommendationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<FocusRecommendationResponse>> GetMyFocusRecommendation()
    {
        _logger.LogInformation(
            "フォーカス推奨タスク取得リクエスト: UserId={UserId}",
            CurrentUserId
        );

        var response = await _focusService.GetFocusRecommendationAsync(CurrentUserId);

        _logger.LogInformation(
            "フォーカス推奨タスク取得完了: UserId={UserId}, FocusTasks={FocusCount}, WaitingTasks={WaitingCount}",
            CurrentUserId,
            response.FocusTasks.Count,
            response.WaitingTasks.Count
        );

        return TypedResults.Ok(response);
    }
}