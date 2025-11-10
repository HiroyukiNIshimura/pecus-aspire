using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Pecus.Controllers.Admin;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// バックエンド専用コントローラー基盤クラス
/// Backend ロール（内部サービス用）での認可を提供し、
/// IAsyncActionFilter を実装してアクション実行前にロール確認を行います。
/// </summary>
[Authorize(Roles = "Backend")]
public abstract class BaseBackendController : BaseSecureController, IAsyncActionFilter
{
    protected BaseBackendController(
        ProfileService profileService,
        ILogger<BaseBackendController> logger
    ) : base(profileService, logger)
    {
    }
}
