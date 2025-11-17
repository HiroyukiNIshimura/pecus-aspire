using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB.Models;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// セキュリティを備えた基底コントローラー
/// </summary>
/// <remarks>
/// 認証とユーザー有効性チェックを備えたコントローラーの基底クラスです。
/// ログインが必須なコントローラーはこれを継承します。
/// アクションメソッド実行前にユーザーの有効性（IsActive）を検証し、
/// CurrentUserId と CurrentUser をアクション内で安全に利用できます。
/// </remarks>
[ApiController]
[Authorize]
public abstract class BaseSecureController : ControllerBase, IAsyncActionFilter
{
    private readonly ProfileService _profileService;
    private readonly ILogger _logger;

    /// <summary>
    /// 現在認証されているユーザーID
    /// </summary>
    protected int CurrentUserId { get; private set; }

    /// <summary>
    /// 現在認証されているユーザー（有効性確認済み）
    /// ユーザーのロール情報も含まれています
    /// 読み取り専用でアクション内で参照可能です
    /// </summary>
    protected User? CurrentUser { get; private set; }

    protected BaseSecureController(
        ProfileService profileService,
        ILogger logger
    )
    {
        _profileService = profileService;
        _logger = logger;
    }

    /// <summary>
    /// アクション実行前に呼び出され、ユーザーの有効性を確認します
    /// </summary>
    [NonAction]
    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next
    )
    {
        try
        {
            // ユーザーID取得
            CurrentUserId = JwtBearerUtil.GetUserIdFromPrincipal(User);
            if (CurrentUserId == 0)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // ユーザーが有効か確認（ロール情報も含まれる）
            CurrentUser = await _profileService.GetUserAsync(CurrentUserId);
            if (CurrentUser == null || !CurrentUser.IsActive)
            {
                _logger.LogWarning(
                    "Unauthorized access attempt: User {UserId} is inactive or not found",
                    CurrentUserId
                );
                throw new NotFoundException("ユーザーが見つかりません。");
            }

            _logger.LogDebug(
                "User authenticated and active: UserId={UserId}, Roles={Roles}",
                CurrentUserId,
                string.Join(",", CurrentUser.Roles?.Select(r => r.Name) ?? Array.Empty<string>())
            );

            // 次のアクションを実行
            await next();
        }
        catch (NotFoundException)
        {
            throw; // GlobalExceptionFilterで処理されます
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in authentication check for user {UserId}", CurrentUserId);
            throw;
        }
    }

    /// <summary>
    /// 現在のユーザーがAdmin権限を持っているか確認します
    /// </summary>
    /// <exception cref="InvalidOperationException">Admin権限がない場合</exception>
    [NonAction]
    protected void RequireAdminRole()
    {
        if (CurrentUser?.Roles == null || !CurrentUser.Roles.Any(r => r.Name == "Admin"))
        {
            throw new InvalidOperationException("この操作を実行する権限がありません。Admin権限が必要です。");
        }
    }
}
