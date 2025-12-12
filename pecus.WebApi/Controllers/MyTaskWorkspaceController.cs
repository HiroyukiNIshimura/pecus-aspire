using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs;
using Pecus.Models.Requests.WorkspaceTask;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// マイタスクワークスペースコントローラー
/// ログインユーザーが担当のタスクを持つワークスペース一覧とタスクを取得
/// </summary>
[Route("api/my")]
[Produces("application/json")]
[Tags("My")]
public class MyTaskWorkspaceController : BaseSecureController
{
    private readonly WorkspaceTaskService _workspaceTaskService;
    private readonly OrganizationAccessHelper _accessHelper;
    private readonly ILogger<MyTaskWorkspaceController> _logger;

    public MyTaskWorkspaceController(
        WorkspaceTaskService workspaceTaskService,
        OrganizationAccessHelper accessHelper,
        ProfileService profileService,
        ILogger<MyTaskWorkspaceController> logger
    ) : base(profileService, logger)
    {
        _workspaceTaskService = workspaceTaskService;
        _accessHelper = accessHelper;
        _logger = logger;
    }

    /// <summary>
    /// マイタスクワークスペース一覧を取得
    /// ログインユーザーが担当のタスクを持つワークスペースの一覧を取得します（期限日が古い順）
    /// </summary>
    /// <returns>ワークスペース一覧（タスク統計付き）</returns>
    [HttpGet("task-workspaces")]
    [ProducesResponseType(typeof(List<MyTaskWorkspaceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<MyTaskWorkspaceResponse>>> GetMyTaskWorkspaces()
    {
        var results = await _workspaceTaskService.GetMyTaskWorkspacesAsync(CurrentUserId);
        return TypedResults.Ok(results);
    }

    /// <summary>
    /// 指定ワークスペース内のマイタスクを期限日グループで取得
    /// ログインユーザーが担当のタスクを期限日でグループ化して返します
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="filter">ダッシュボード用フィルター（省略時はActive）</param>
    /// <returns>期限日でグループ化されたタスク一覧</returns>
    [HttpGet("task-workspaces/{workspaceId:int}/tasks")]
    [ProducesResponseType(typeof(List<TasksByDueDateResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<TasksByDueDateResponse>>> GetMyTasksByWorkspace(
        int workspaceId,
        [FromQuery] DashboardTaskFilter? filter = null)
    {
        // アクセス権チェック
        var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(CurrentUserId, workspaceId);
        if (!hasAccess)
        {
            throw new Exceptions.NotFoundException("ワークスペースが見つかりません。");
        }

        var results = await _workspaceTaskService.GetMyTasksByWorkspaceAsync(CurrentUserId, workspaceId, filter);
        return TypedResults.Ok(results);
    }
}