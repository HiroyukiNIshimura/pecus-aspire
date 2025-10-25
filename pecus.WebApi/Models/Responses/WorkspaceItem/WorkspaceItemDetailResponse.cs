namespace Pecus.Models.Responses.WorkspaceItem;

/// <summary>
/// ワークスペースアイテム詳細レスポンス
/// </summary>
public class WorkspaceItemDetailResponse
{
    /// <summary>
    /// アイテムID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int WorkspaceId { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public string? WorkspaceName { get; set; }

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
    public string Body { get; set; } = string.Empty;

    /// <summary>
    /// オーナーユーザーID
    /// </summary>
    public int OwnerId { get; set; }

    /// <summary>
    /// オーナーユーザー名
    /// </summary>
    public string? OwnerUsername { get; set; }

    /// <summary>
    /// オーナーアバターURL
    /// </summary>
    public string? OwnerAvatarUrl { get; set; }

    /// <summary>
    /// 作業中のユーザーID
    /// </summary>
    public int? AssigneeId { get; set; }

    /// <summary>
    /// 作業中のユーザー名
    /// </summary>
    public string? AssigneeUsername { get; set; }

    /// <summary>
    /// 作業中のユーザーアバターURL
    /// </summary>
    public string? AssigneeAvatarUrl { get; set; }

    /// <summary>
    /// 重要度（1: 低、2: 普通、3: 高）
    /// </summary>
    public int Priority { get; set; }

    /// <summary>
    /// 期限日
    /// </summary>
    public DateTime DueDate { get; set; }

    /// <summary>
    /// アーカイブフラグ
    /// </summary>
    public bool IsArchived { get; set; }

    /// <summary>
    /// 下書き中フラグ
    /// </summary>
    public bool IsDraft { get; set; }

    /// <summary>
    /// コミッターユーザーID
    /// </summary>
    public int? CommitterId { get; set; }

    /// <summary>
    /// コミッターユーザー名
    /// </summary>
    public string? CommitterUsername { get; set; }

    /// <summary>
    /// コミッターアバターURL
    /// </summary>
    public string? CommitterAvatarUrl { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// タグのリスト
    /// </summary>
    public List<TagInfoResponse> Tags { get; set; } = new List<TagInfoResponse>();
}
