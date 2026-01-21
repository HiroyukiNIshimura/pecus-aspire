using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.WorkspaceItem;

/// <summary>
/// ワークスペースアイテム詳細レスポンス
/// </summary>
public class WorkspaceItemDetailResponse : IConflictModel
{
    /// <summary>
    /// アイテムID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public string? WorkspaceCode { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public string? WorkspaceName { get; set; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    public string? GenreIcon { get; set; }

    /// <summary>
    /// ジャンル名
    /// </summary>
    public string? GenreName { get; set; }

    /// <summary>
    /// ワークスペースモード（Normal/Document）
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<WorkspaceMode>))]
    public WorkspaceMode? WorkspaceMode { get; set; }

    /// <summary>
    /// コード
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// 件名
    /// </summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>
    /// 本文
    /// </summary>
    public string? Body { get; set; }

    /// <summary>
    /// オーナー情報
    /// </summary>
    public UserIdentityResponse Owner { get; set; } = new();

    /// <summary>
    /// 担当者情報
    /// </summary>
    public UserIdentityResponse? Assignee { get; set; }

    /// <summary>
    /// コミッター情報
    /// </summary>
    public UserIdentityResponse? Committer { get; set; }

    /// <summary>
    /// 重要度（NULL の場合は未設定）
    /// </summary>
    public TaskPriority? Priority { get; set; }

    /// <summary>
    /// 期限日時
    /// </summary>
    public DateTimeOffset? DueDate { get; set; }

    /// <summary>
    /// アーカイブフラグ
    /// </summary>
    public bool IsArchived { get; set; }

    /// <summary>
    /// 下書き中フラグ
    /// </summary>
    public bool IsDraft { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset UpdatedAt { get; set; }

    /// <summary>
    /// タグのリスト
    /// </summary>
    public List<TagInfoResponse> Tags { get; set; } = new List<TagInfoResponse>();

    /// <summary>
    /// ログイン中のユーザーがこのアイテムをPINしているか
    /// </summary>
    public bool IsPinned { get; set; }

    /// <summary>
    /// このアイテムのPIN総数
    /// </summary>
    public int PinCount { get; set; }

    /// <summary>
    /// 関連アイテムのリスト
    /// </summary>
    public List<RelatedItemInfo> RelatedItems { get; set; } = new List<RelatedItemInfo>();

    /// <summary>
    /// 楽観的ロック用のRowVersion
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}