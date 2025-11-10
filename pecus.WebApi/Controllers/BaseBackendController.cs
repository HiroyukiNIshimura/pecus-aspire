using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Pecus.Controllers;

/// <summary>
/// バックエンド専用コントローラー基盤クラス
/// Backend ロール（内部サービス用）での認可を提供し、
/// IAsyncActionFilter を実装してアクション実行前にロール確認を行います。
/// </summary>
[ApiController]
[Authorize(Roles = "Backend")]
public abstract class BaseBackendController : ControllerBase, IAsyncActionFilter
{
    protected readonly ILogger _logger;

    protected BaseBackendController(ILogger logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// アクション実行前にロール確認を行うフィルター
    /// </summary>
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Backend ロール確認
        if (!User.IsInRole("Backend"))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // アクション実行
        await next();
    }
}
