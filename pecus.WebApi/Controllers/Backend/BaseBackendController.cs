using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using Pecus.Services;

namespace Pecus.Controllers.Backend;

/// <summary>
/// バックエンド専用コントローラー基盤クラス
/// Backend ロール（内部サービス用）での認可を提供します。
/// </summary>
[Authorize(Roles = "Backend")]
public abstract class BaseBackendController : Pecus.Controllers.BaseSecureController, IAsyncActionFilter
{
    protected BaseBackendController(
        ProfileService profileService,
        ILogger<BaseBackendController> logger
    ) : base(profileService, logger)
    {
    }
}
