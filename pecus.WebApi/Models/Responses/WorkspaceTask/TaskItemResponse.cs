using Pecus.Libs.DB.Models.Enums;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.WorkspaceTask;

public class TaskItemResponse
{
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
    public WorkspaceMode? Mode { get; set; }

    /// <summary>
    /// コード
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// 件名
    /// </summary>
    public string Subject { get; set; } = string.Empty;

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


}