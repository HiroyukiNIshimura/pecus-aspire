using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using Pecus.Services;

namespace Pecus.Controllers.Backend;

/// <summary>
/// バックオフィス専用コントローラー基盤クラス
/// BackOffice ロール（内部サービス用）での認可を提供します。
/// </summary>
[Authorize(Roles = "BackOffice")]
public abstract class BaseBackendController : BaseSecureController, IAsyncActionFilter
{
    protected BaseBackendController(
        ProfileService profileService,
        ILogger<BaseBackendController> logger
    ) : base(profileService, logger)
    {
    }
}