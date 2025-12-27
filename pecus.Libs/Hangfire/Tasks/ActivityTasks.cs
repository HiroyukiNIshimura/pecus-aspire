using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Lexical;
using Pecus.Libs.Mail.Templates.Models;
using Pecus.Libs.Security;

namespace Pecus.Libs.Hangfire.Tasks;

/// <summary>
/// アクティビティ記録用Hangfireタスク
/// 責務: DBへのActivity INSERT およびメール通知
/// </summary>
/// <remarks>
/// 変更検出とJSON生成は <see cref="ActivityDetailsBuilder"/> を使用し、
/// サービス層で事前に行ってからこのタスクに渡す。
/// </remarks>
public class ActivityTasks
{
    private readonly ApplicationDbContext _context;
    private readonly IBackgroundJobClient _backgroundJobClient;
    private readonly ILexicalConverterService _lexicalConverter;
    private readonly FrontendUrlResolver _frontendUrlResolver;
    private readonly ILogger<ActivityTasks> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public ActivityTasks(
        ApplicationDbContext context,
        IBackgroundJobClient backgroundJobClient,
        ILexicalConverterService lexicalConverter,
        FrontendUrlResolver frontendUrlResolver,
        ILogger<ActivityTasks> logger
    )
    {
        _context = context;
        _backgroundJobClient = backgroundJobClient;
        _lexicalConverter = lexicalConverter;
        _frontendUrlResolver = frontendUrlResolver;
        _logger = logger;
    }

    /// <summary>
    /// アクティビティを記録する（Hangfireジョブから呼び出される）
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">アイテムID</param>
    /// <param name="userId">操作したユーザーID（NULL = システム操作）</param>
    /// <param name="actionType">操作タイプ</param>
    /// <param name="details">操作の詳細データ（JSON文字列、ActivityDetailsBuilder で生成済み）</param>
    public async Task RecordActivityAsync(
        int workspaceId,
        int itemId,
        int? userId,
        ActivityActionType actionType,
        string? details = null
    )
    {
        // Activity 記録を試みる（失敗してもメール配信は継続）
        try
        {
            var activity = new Activity
            {
                WorkspaceId = workspaceId,
                ItemId = itemId,
                UserId = userId,
                ActionType = actionType,
                Details = details,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _context.Activities.Add(activity);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to record activity: WorkspaceId={WorkspaceId}, ItemId={ItemId}, ActionType={ActionType}",
                workspaceId,
                itemId,
                actionType
            );
            // Activity 記録失敗でもメール配信は続行するためスローしない
        }

        // メール通知をキューに追加
        await EnqueueItemNotificationEmailsAsync(workspaceId, itemId, userId, actionType);
    }

    /// <summary>
    /// アイテム通知メールをワークスペースメンバー全員に配信
    /// </summary>
    private async Task EnqueueItemNotificationEmailsAsync(
        int workspaceId,
        int itemId,
        int? actorUserId,
        ActivityActionType actionType
    )
    {
        try
        {
            // アイテム情報を取得
            var item = await _context
                .WorkspaceItems.Include(wi => wi.Workspace)
                .Include(wi => wi.Owner)
                .FirstOrDefaultAsync(wi => wi.Id == itemId && wi.WorkspaceId == workspaceId);

            if (item == null)
            {
                _logger.LogWarning(
                    "Cannot send notification email: WorkspaceItem not found. WorkspaceId={WorkspaceId}, ItemId={ItemId}",
                    workspaceId,
                    itemId
                );
                return;
            }

            // ワークスペース情報を取得
            var workspace = item.Workspace;
            if (workspace == null || string.IsNullOrEmpty(workspace.Code))
            {
                _logger.LogWarning(
                    "Cannot send notification email: Workspace not found or has no code. WorkspaceId={WorkspaceId}",
                    workspaceId
                );
                return;
            }

            // 操作ユーザーの情報を取得
            User? actorUser = null;
            if (actorUserId.HasValue)
            {
                actorUser = await _context.Users.FindAsync(actorUserId.Value);
            }

            // ワークスペース内の有効なメンバー全員を取得
            var targetUsers = await _context
                .WorkspaceUsers.Include(wu => wu.User)
                .Where(wu =>
                    wu.WorkspaceId == workspaceId && wu.User != null && wu.User.IsActive
                )
                .Select(wu => wu.User!)
                .ToListAsync();

            if (targetUsers.Count == 0)
            {
                _logger.LogInformation(
                    "No active members to notify for WorkspaceId={WorkspaceId}",
                    workspaceId
                );
                return;
            }

            // 本文のプレーンテキストとHTMLを取得
            string? bodyText = null;
            string? bodyHtml = null;

            if (!string.IsNullOrEmpty(item.Body))
            {
                try
                {
                    var plainTextResult = await _lexicalConverter.ToPlainTextAsync(item.Body);
                    if (plainTextResult.Success)
                    {
                        bodyText = plainTextResult.Result;
                    }

                    var htmlResult = await _lexicalConverter.ToHtmlAsync(item.Body);
                    if (htmlResult.Success)
                    {
                        bodyHtml = htmlResult.Result;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Failed to convert item body for notification email. ItemId={ItemId}",
                        itemId
                    );
                }
            }

            // URL生成
            var baseUrl = _frontendUrlResolver.GetValidatedFrontendUrl();
            var itemUrl = $"{baseUrl}/workspaces/{workspace.Code}?itemCode={item.Code}";

            // 各ユーザーにメール送信ジョブを登録
            foreach (var user in targetUsers)
            {
                if (string.IsNullOrEmpty(user.Email))
                {
                    continue;
                }

                if (actionType == ActivityActionType.Created)
                {
                    var emailModel = new ItemCreatedEmailModel
                    {
                        UserName = user.Username,
                        ItemTitle = item.Subject,
                        ItemCode = item.Code,
                        BodyText = bodyText,
                        BodyHtml = bodyHtml,
                        CreatedByName = actorUser?.Username ?? item.Owner?.Username ?? "",
                        CreatedAt = item.CreatedAt,
                        WorkspaceName = workspace.Name,
                        WorkspaceCode = workspace.Code ?? "",
                        ItemUrl = itemUrl
                    };

                    _backgroundJobClient.Enqueue<EmailTasks>(x =>
                        x.SendTemplatedEmailAsync(
                            workspace.OrganizationId,
                            user.Email,
                            $"新しいアイテムが作成されました: {item.Subject}",
                            emailModel
                        )
                    );
                }
                else
                {
                    var effectMessage = ActivityEffectMessageHelper.GetEffectMessage(actionType);

                    var emailModel = new ItemUpdatedEmailModel
                    {
                        UserName = user.Username,
                        ItemTitle = item.Subject,
                        ItemCode = item.Code,
                        BodyText = bodyText,
                        BodyHtml = bodyHtml,
                        WorkspaceName = workspace.Name,
                        WorkspaceCode = workspace.Code ?? "",
                        ItemUrl = itemUrl,
                        Activities =
                        [
                            new ItemActivityEntry
                            {
                                EffectMessage = effectMessage,
                                UpdatedByName = actorUser?.Username ?? "",
                                UpdatedAt = DateTimeOffset.UtcNow
                            }
                        ]
                    };

                    _backgroundJobClient.Enqueue<EmailTasks>(x =>
                        x.SendTemplatedEmailAsync(
                            workspace.OrganizationId,
                            user.Email,
                            $"アイテムが更新されました: {item.Subject}",
                            emailModel
                        )
                    );
                }
            }

            _logger.LogInformation(
                "Item notification emails queued. WorkspaceId={WorkspaceId}, ItemId={ItemId}, ActionType={ActionType}, TargetCount={Count}",
                workspaceId,
                itemId,
                actionType,
                targetUsers.Count
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to enqueue item notification emails: WorkspaceId={WorkspaceId}, ItemId={ItemId}",
                workspaceId,
                itemId
            );
            // メール配信のエラーは再スローしない（Activity記録が成功していればOK）
        }
    }
}