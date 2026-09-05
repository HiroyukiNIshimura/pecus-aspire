using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.Mail.Services;

/// <summary>
/// メール通知の配信判定を行うサービスインターフェース
/// </summary>
public interface IEmailNotificationFilterService
{
    /// <summary>
    /// ユーザー設定に基づいて、指定されたイベント・ワークスペースに対するメール送信を行うべきかを判定する
    /// </summary>
    /// <param name="setting">ユーザー設定（nullの場合はデフォルトとして判定）</param>
    /// <param name="eventType">通知イベント種別</param>
    /// <param name="workspaceId">対象ワークスペースID（組織単位・アジェンダ等の場合はnull）</param>
    /// <returns>送信すべき場合は true、スキップする場合は false</returns>
    bool ShouldSendEmail(UserSetting? setting, EmailNotificationEventType eventType, int? workspaceId = null);
}