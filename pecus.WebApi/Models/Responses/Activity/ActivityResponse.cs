using Pecus.Libs.DB.Models.Enums;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Activity;

/// <summary>
/// アクティビティレスポンス
/// </summary>
public class ActivityResponse
{
    /// <summary>
    /// アクティビティID
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public string WorkspaceCode { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public string WorkspaceName { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペースのジャンルアイコン
    /// </summary>
    public string? WorkspaceGenreIcon { get; set; }

    /// <summary>
    /// アイテムID
    /// </summary>
    public int ItemId { get; set; }

    /// <summary>
    /// アイテムコード
    /// </summary>
    public string ItemCode { get; set; } = string.Empty;

    /// <summary>
    /// アイテム件名
    /// </summary>
    public string ItemSubject { get; set; } = string.Empty;

    /// <summary>
    /// ユーザーID（NULL = システム操作）
    /// </summary>
    public int? UserId { get; set; }

    /// <summary>
    /// ユーザー名
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// ユーザーのアイデンティティアイコンURL
    /// </summary>
    public string? IdentityIconUrl { get; set; }

    /// <summary>
    /// 操作タイプ
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<ActivityActionType>))]
    public ActivityActionType ActionType { get; set; }

    /// <summary>
    /// 操作の詳細データ（JSON文字列）
    /// </summary>
    public string? Details { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }
}