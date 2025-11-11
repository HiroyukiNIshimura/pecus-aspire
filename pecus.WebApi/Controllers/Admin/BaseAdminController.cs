using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pecus.Services;

namespace Pecus.Controllers.Admin;

/// <summary>
/// 管理者向けの基本コントローラークラス
/// </summary>
/// <remarks>
/// 管理画面の各種操作を提供するコントローラーの基底クラスです。
/// Admin ロールを持つユーザーのみアクセスできます。
/// 認証ユーザーの有効性チェックは自動的に実行されます。
/// </remarks>
[Authorize(Roles = "Admin")]
[Tags("Admin")]
public abstract class BaseAdminController : BaseSecureController
{
    /// <summary>
    /// コンストラクタ
    /// </summary>
    protected BaseAdminController(
        ProfileService profileService,
        ILogger<BaseAdminController> logger
    ) : base(profileService, logger)
    {
    }
}
