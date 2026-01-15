using Pecus.Libs.DB.Models.Enums;
using Pecus.Models.Config;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Common;

/// <summary>
/// アプリケーション公開設定レスポンス
/// フロントエンドで利用可能な組織設定とユーザー設定を統合したDTO
/// ※ APIキー、パスワード等のセンシティブ情報は含まない
/// </summary>
public class AppPublicSettingsResponse
{
    /// <summary>
    /// 現在ログイン中のユーザー情報（最小限）
    /// </summary>
    [Required]
    public required CurrentUserInfo CurrentUser { get; init; }

    /// <summary>
    /// 組織の公開設定
    /// </summary>
    [Required]
    public required OrganizationPublicSettings Organization { get; init; }

    /// <summary>
    /// ユーザーの公開設定
    /// </summary>
    [Required]
    public required UserPublicSettings User { get; init; }

    /// <summary>
    /// 制限設定
    /// </summary>
    [Required]
    public required LimitsSettings Limits { get; init; }
}

/// <summary>
/// 現在ログイン中のユーザーの最小限情報
/// </summary>
public class CurrentUserInfo
{
    /// <summary>
    /// ユーザーID
    /// </summary>
    [Required]
    public required int Id { get; init; }

    /// <summary>
    /// 組織ID
    /// </summary>
    [Required]
    public required int OrganizationId { get; init; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    [Required]
    public required string Username { get; init; }

    /// <summary>
    /// メールアドレス
    /// </summary>
    [Required]
    public required string Email { get; init; }

    /// <summary>
    /// アイデンティティアイコンURL（表示用）
    /// </summary>
    public string? IdentityIconUrl { get; init; }

    /// <summary>
    /// 管理者権限を持つかどうか
    /// </summary>
    [Required]
    public required bool IsAdmin { get; init; }

    /// <summary>
    /// バックオフィス権限を持つかどうか
    /// </summary>
    [Required]
    public required bool IsBackOffice { get; init; }
}

/// <summary>
/// 組織の公開設定（センシティブ情報を除外）
/// </summary>
public class OrganizationPublicSettings
{
    /// <summary>
    /// 生成AIプロバイダーの種類
    /// ※ APIキー自体は含まない
    /// </summary>
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter<GenerativeApiVendor>))]
    public GenerativeApiVendor AiProvider { get; init; }

    /// <summary>
    /// AIプロバイダーが設定済みか（APIキーが登録されているか）
    /// </summary>
    [Required]
    public bool IsAiConfigured { get; init; }

    /// <summary>
    /// 利用プラン
    /// </summary>
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter<OrganizationPlan>))]
    public OrganizationPlan Plan { get; init; }

    /// <summary>
    /// タスク作成時に見積もりを必須とするか
    /// </summary>
    [Required]
    public bool RequireEstimateOnTaskCreation { get; init; }

    /// <summary>
    /// 先行タスクが完了しないと次のタスクを操作できないようにするか
    /// </summary>
    [Required]
    public bool EnforcePredecessorCompletion { get; init; }

    /// <summary>
    /// グループチャットのスコープ設定
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<GroupChatScope>))]
    public GroupChatScope? GroupChatScope { get; init; }

    /// <summary>
    /// ワークスペース作成時のデフォルトモード
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<WorkspaceMode>))]
    public WorkspaceMode? DefaultWorkspaceMode { get; init; }

    /// <summary>
    /// ゲーミフィケーション機能の有効/無効
    /// </summary>
    [Required]
    public bool GamificationEnabled { get; init; }

    /// <summary>
    /// デフォルトのバッジ公開範囲
    /// </summary>
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter<BadgeVisibility>))]
    public BadgeVisibility GamificationBadgeVisibility { get; init; }

    /// <summary>
    /// ユーザーによるバッジ公開範囲のオーバーライドを許可するか
    /// </summary>
    [Required]
    public bool GamificationAllowUserOverride { get; init; }

    /// <summary>
    /// Botがグループチャットにメッセージを送信するか
    /// </summary>
    [Required]
    public bool BotGroupChatMessagesEnabled { get; init; }
}

/// <summary>
/// ユーザーの公開設定
/// </summary>
public class UserPublicSettings
{
    /// <summary>
    /// タイムゾーン（IANA zone name）
    /// </summary>
    [Required]
    public required string TimeZone { get; init; }

    /// <summary>
    /// 言語設定
    /// </summary>
    [Required]
    public required string Language { get; init; }

    /// <summary>
    /// メール受信の可否
    /// </summary>
    [Required]
    public bool CanReceiveEmail { get; init; }

    /// <summary>
    /// リアルタイム通知の可否
    /// </summary>
    [Required]
    public bool CanReceiveRealtimeNotification { get; init; }

    /// <summary>
    /// ログイン後のランディングページ
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<LandingPage>))]
    public LandingPage? LandingPage { get; init; }

    /// <summary>
    /// フォーカス推奨のスコアリング優先要素
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<FocusScorePriority>))]
    public FocusScorePriority? FocusScorePriority { get; init; }

    /// <summary>
    /// フォーカス推奨タスクの表示件数
    /// </summary>
    [Required]
    public int FocusTasksLimit { get; init; }

    /// <summary>
    /// 待機中タスクの表示件数
    /// </summary>
    [Required]
    public int WaitingTasksLimit { get; init; }

    /// <summary>
    /// バッジの公開範囲
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<BadgeVisibility>))]
    public BadgeVisibility? BadgeVisibility { get; init; }
}