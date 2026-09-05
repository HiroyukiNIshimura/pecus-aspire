using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Mail.Services;

/// <summary>
/// メール通知の配信判定を行うサービス実装
/// </summary>
public class EmailNotificationFilterService : IEmailNotificationFilterService
{
    /// <inheritdoc />
    public bool ShouldSendEmail(UserSetting? setting, EmailNotificationEventType eventType, int? workspaceId = null)
    {
        // 設定が存在しない場合はデフォルトの挙動（Standard）とする
        if (setting == null)
        {
            return EvaluateStandardMode(eventType);
        }

        // マスターフラグがOFFの場合は全業務メールを停止
        if (!setting.CanReceiveEmail)
        {
            return false;
        }

        var mode = setting.EmailNotificationMode ?? EmailNotificationMode.Standard;
        if (mode == EmailNotificationMode.Off)
        {
            return false;
        }

        // ワークスペースフィルタの判定（workspaceIdが指定されており、かつ設定されたリストに含まれていない場合はスキップ）
        if (workspaceId.HasValue && setting.EmailWorkspaceIds != null && !setting.EmailWorkspaceIds.Contains(workspaceId.Value))
        {
            return false;
        }

        return mode switch
        {
            EmailNotificationMode.ImportantOnly => EvaluateImportantOnlyMode(eventType),
            EmailNotificationMode.Standard => EvaluateStandardMode(eventType),
            EmailNotificationMode.Custom => EvaluateCustomMode(setting.CustomEmailSettings, eventType),
            _ => false,
        };
    }

    /// <summary>
    /// 重要通知のみモードの判定
    /// </summary>
    private static bool EvaluateImportantOnlyMode(EmailNotificationEventType eventType)
    {
        return eventType switch
        {
            // 自分宛て
            EmailNotificationEventType.DirectMention => true,
            EmailNotificationEventType.DirectNeedReply => true,
            EmailNotificationEventType.DirectUrge => true,
            EmailNotificationEventType.DirectHelpWanted => true,
            // 期限超過タスク
            EmailNotificationEventType.TaskOverdue => true,
            // アジェンダ中止・リマインダー
            EmailNotificationEventType.AgendaCancellationOrReminder => true,
            // それ以外はOFF
            _ => false,
        };
    }

    /// <summary>
    /// 標準（推奨）モードの判定
    /// </summary>
    private static bool EvaluateStandardMode(EmailNotificationEventType eventType)
    {
        return eventType switch
        {
            // 重要通知はすべてON
            EmailNotificationEventType.DirectMention => true,
            EmailNotificationEventType.DirectNeedReply => true,
            EmailNotificationEventType.DirectUrge => true,
            EmailNotificationEventType.DirectHelpWanted => true,
            EmailNotificationEventType.TaskOverdue => true,
            EmailNotificationEventType.AgendaCancellationOrReminder => true,

            // 標準モードで追加される通知
            EmailNotificationEventType.TaskAssignedCreated => true,
            EmailNotificationEventType.TaskRelatedCompleted => true,
            EmailNotificationEventType.PinnedItemActivity => true,
            EmailNotificationEventType.AgendaInvitationOrUpdate => true,

            // それ以外（本文更新、一般コメント、WS活動等）はOFF
            _ => false,
        };
    }

    /// <summary>
    /// カスタムモードの判定
    /// </summary>
    private static bool EvaluateCustomMode(EmailNotificationCustomSettings? custom, EmailNotificationEventType eventType)
    {
        if (custom == null)
        {
            return EvaluateStandardMode(eventType);
        }

        return eventType switch
        {
            EmailNotificationEventType.DirectMention => custom.DirectMention,
            EmailNotificationEventType.DirectNeedReply => custom.DirectNeedReply,
            EmailNotificationEventType.DirectUrge => custom.DirectUrge,
            EmailNotificationEventType.DirectHelpWanted => custom.DirectHelpWanted,

            EmailNotificationEventType.TaskAssignedCreated => custom.TaskAssignedCreated,
            EmailNotificationEventType.TaskRelatedCompleted => custom.TaskRelatedCompleted,
            EmailNotificationEventType.TaskOverdue => custom.TaskOverdue,

            EmailNotificationEventType.PinnedItemActivity => custom.PinnedItemActivity,
            EmailNotificationEventType.AssignedItemUpdated => custom.AssignedItemUpdated,
            EmailNotificationEventType.ItemBodyUpdated => custom.ItemBodyUpdated,

            EmailNotificationEventType.GeneralComment => custom.GeneralComment,

            EmailNotificationEventType.AgendaInvitationOrUpdate => custom.AgendaInvitationOrUpdate,
            EmailNotificationEventType.AgendaCancellationOrReminder => custom.AgendaCancellationOrReminder,

            EmailNotificationEventType.WorkspaceActivity => custom.WorkspaceActivity,

            _ => false,
        };
    }
}