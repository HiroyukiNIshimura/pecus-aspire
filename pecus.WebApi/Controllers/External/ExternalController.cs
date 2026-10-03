using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Libs.DB;
using Pecus.Models.Requests.External;
using Pecus.Models.Responses.External;
using Pecus.Services;

namespace Pecus.Controllers.External;

/// <summary>
/// 外部公開APIコントローラー（APIキー認証）
/// 外部APIに関してはまだ仕様が固まっていないため、暫定的にこのコントローラーにまとめて実装しています。
/// </summary>
/// <remarks>
/// X-API-KEY ヘッダーによるAPIキー認証が必要です。
/// 組織スコープで動作し、認証されたキーの所属組織のデータのみアクセス可能です。
/// /// </remarks>
public class ExternalController : BaseExternalApiController
{
    private readonly IExternalWorkspaceItemService _externalWorkspaceItemService;
    private readonly IExternalWorkspaceTaskService _externalWorkspaceTaskService;

    public ExternalController(
        IExternalWorkspaceItemService externalWorkspaceItemService,
        IExternalWorkspaceTaskService externalWorkspaceTaskService,
        ApplicationDbContext context,
        ILogger<ExternalController> logger)
        : base(context, logger)
    {
        _externalWorkspaceItemService = externalWorkspaceItemService;
        _externalWorkspaceTaskService = externalWorkspaceTaskService;
    }

    /// <summary>
    /// 疎通確認用エンドポイント
    /// </summary>
    /// <remarks>
    /// 受け取ったメッセージをそのまま返却します。
    /// APIキー認証の疎通確認に使用してください。
    /// </remarks>
    [HttpPost("ping")]
    [ProducesResponseType(typeof(PingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public Ok<PingResponse> Ping([FromBody] PingRequest request)
    {
        return TypedResults.Ok(new PingResponse
        {
            Message = request.Message,
            OrganizationCode = GetOrganizationCode(),
            Timestamp = DateTimeOffset.UtcNow,
        });
    }

    /// <summary>
    /// 指定ワークスペース内の全アイテムを取得する
    /// </summary>
    /// <remarks>
    /// ページネーション（1ページあたり20件固定）に対応しています。
    /// アクティブフラグ（isActive）、アーカイブフラグ（isArchived）、下書きフラグ（isDraft）でのフィルタリングが可能です。
    /// 認証された API キーの組織に属するワークスペースのみアクセス可能です。
    /// </remarks>
    /// <param name="workspaceIdOrCode">ワークスペースIDまたはコード</param>
    /// <param name="page">ページ番号（1始まり、省略時は1）</param>
    /// <param name="isActive">アクティブフラグフィルタ（nullの場合は全件）</param>
    /// <param name="isArchived">アーカイブフラグフィルタ（nullの場合は全件）</param>
    /// <param name="isDraft">下書きフラグフィルタ（nullの場合は全件）</param>
    /// <param name="cancellationToken">キャンセレーショントークン</param>
    /// <returns>アイテム一覧レスポンス</returns>
    /// <response code="200">アイテム一覧の取得に成功</response>
    /// <response code="401">認証エラー</response>
    /// <response code="404">ワークスペースが見つからない</response>
    [HttpGet("workspaces/{workspaceIdOrCode}/items")]
    [ProducesResponseType(typeof(ExternalItemListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Ok<ExternalItemListResponse>> GetWorkspaceItems(
        [FromRoute] string workspaceIdOrCode,
        [FromQuery] int page = 1,
        [FromQuery] bool? isActive = null,
        [FromQuery] bool? isArchived = null,
        [FromQuery] bool? isDraft = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _externalWorkspaceItemService.GetWorkspaceItemsAsync(
            CurrentOrganizationId,
            workspaceIdOrCode,
            page,
            isActive,
            isArchived,
            isDraft,
            cancellationToken);

        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 指定ワークスペース内の指定アイテムを取得する
    /// </summary>
    /// <remarks>
    /// ワークスペースIDまたはコードとアイテム番号（ワークスペース内連番）を指定してアイテム情報を取得します。
    /// 本文は Markdown 形式に変換されて返却されます。
    /// 認証された API キーの組織に属するワークスペース・アイテムのみアクセス可能です。
    /// </remarks>
    /// <param name="workspaceIdOrCode">ワークスペースIDまたはコード</param>
    /// <param name="itemNumber">アイテム番号（ワークスペース内連番）</param>
    /// <param name="cancellationToken">キャンセレーショントークン</param>
    /// <returns>アイテム詳細レスポンス</returns>
    /// <response code="200">アイテムの取得に成功</response>
    /// <response code="401">認証エラー</response>
    /// <response code="404">ワークスペースまたはアイテムが見つからない</response>
    [HttpGet("workspaces/{workspaceIdOrCode}/items/{itemNumber:int}")]
    [ProducesResponseType(typeof(ExternalItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Ok<ExternalItemResponse>> GetWorkspaceItem(
        [FromRoute] string workspaceIdOrCode,
        [FromRoute] int itemNumber,
        CancellationToken cancellationToken = default)
    {
        var result = await _externalWorkspaceItemService.GetWorkspaceItemAsync(
            CurrentOrganizationId,
            workspaceIdOrCode,
            itemNumber,
            cancellationToken);

        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 指定ワークスペース・アイテム内のタスク一覧を取得する
    /// </summary>
    /// <remarks>
    /// 指定されたワークスペースおよびアイテムに紐づくタスクの一覧を取得します。
    /// 完了状態（isCompleted）や破棄状態（isDiscarded）によるフィルタリングが可能です。
    /// 認証された API キーの組織に属するワークスペース・アイテムのみアクセス可能です。
    /// </remarks>
    /// <param name="workspaceIdOrCode">ワークスペースIDまたはコード</param>
    /// <param name="itemNumber">アイテム番号（ワークスペース内連番）</param>
    /// <param name="isCompleted">完了フラグフィルタ（nullの場合は全件）</param>
    /// <param name="isDiscarded">破棄フラグフィルタ（nullの場合は全件）</param>
    /// <param name="cancellationToken">キャンセレーショントークン</param>
    /// <returns>タスク一覧レスポンス</returns>
    /// <response code="200">タスク一覧の取得に成功</response>
    /// <response code="401">認証エラー</response>
    /// <response code="404">ワークスペースまたはアイテムが見つからない</response>
    [HttpGet("workspaces/{workspaceIdOrCode}/items/{itemNumber:int}/tasks")]
    [ProducesResponseType(typeof(ExternalWorkspaceTaskListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Ok<ExternalWorkspaceTaskListResponse>> GetWorkspaceTasks(
        [FromRoute] string workspaceIdOrCode,
        [FromRoute] int itemNumber,
        [FromQuery] bool? isCompleted = null,
        [FromQuery] bool? isDiscarded = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _externalWorkspaceTaskService.GetTasksAsync(
            CurrentOrganizationId,
            workspaceIdOrCode,
            itemNumber,
            isCompleted,
            isDiscarded,
            cancellationToken);

        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 指定ワークスペース・アイテム内の指定タスクを取得する
    /// </summary>
    /// <remarks>
    /// ワークスペースIDまたはコード、アイテム番号、タスクシーケンス番号を指定してタスク詳細を取得します。
    /// 認証された API キーの組織に属するワークスペース・アイテム・タスクのみアクセス可能です。
    /// </remarks>
    /// <param name="workspaceIdOrCode">ワークスペースIDまたはコード</param>
    /// <param name="itemNumber">アイテム番号（ワークスペース内連番）</param>
    /// <param name="sequence">タスクシーケンス番号（アイテム内連番）</param>
    /// <param name="cancellationToken">キャンセレーショントークン</param>
    /// <returns>タスク詳細レスポンス</returns>
    /// <response code="200">タスクの取得に成功</response>
    /// <response code="401">認証エラー</response>
    /// <response code="404">ワークスペース、アイテム、またはタスクが見つからない</response>
    [HttpGet("workspaces/{workspaceIdOrCode}/items/{itemNumber:int}/tasks/{sequence:int}")]
    [ProducesResponseType(typeof(ExternalWorkspaceTaskDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Ok<ExternalWorkspaceTaskDetailResponse>> GetWorkspaceTask(
        [FromRoute] string workspaceIdOrCode,
        [FromRoute] int itemNumber,
        [FromRoute] int sequence,
        CancellationToken cancellationToken = default)
    {
        var result = await _externalWorkspaceTaskService.GetTaskAsync(
            CurrentOrganizationId,
            workspaceIdOrCode,
            itemNumber,
            sequence,
            cancellationToken);

        return TypedResults.Ok(result);
    }

    /// <summary>
    /// 指定ワークスペース・アイテム・タスク内のコメント一覧を取得する
    /// </summary>
    /// <remarks>
    /// 指定されたタスクに紐づく全コメントを取得します（論理削除されたコメントを除く）。
    /// 認証された API キーの組織に属するワークスペース・アイテム・タスクのみアクセス可能です。
    /// </remarks>
    /// <param name="workspaceIdOrCode">ワークスペースIDまたはコード</param>
    /// <param name="itemNumber">アイテム番号（ワークスペース内連番）</param>
    /// <param name="sequence">タスクシーケンス番号（アイテム内連番）</param>
    /// <param name="cancellationToken">キャンセレーショントークン</param>
    /// <returns>タスクコメント一覧レスポンス</returns>
    /// <response code="200">タスクコメント一覧の取得に成功</response>
    /// <response code="401">認証エラー</response>
    /// <response code="404">ワークスペース、アイテム、またはタスクが見つからない</response>
    [HttpGet("workspaces/{workspaceIdOrCode}/items/{itemNumber:int}/tasks/{sequence:int}/comments")]
    [ProducesResponseType(typeof(ExternalTaskCommentListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Ok<ExternalTaskCommentListResponse>> GetWorkspaceTaskComments(
        [FromRoute] string workspaceIdOrCode,
        [FromRoute] int itemNumber,
        [FromRoute] int sequence,
        CancellationToken cancellationToken = default)
    {
        var result = await _externalWorkspaceTaskService.GetTaskCommentsAsync(
            CurrentOrganizationId,
            workspaceIdOrCode,
            itemNumber,
            sequence,
            cancellationToken);

        return TypedResults.Ok(result);
    }
}