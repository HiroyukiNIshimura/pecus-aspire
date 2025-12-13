using Pecus.Libs.DB.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペース詳細情報（一般ユーザー用）
/// </summary>
public class WorkspaceFullDetailResponse : IConflictModel
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    [Required]
    public required int Id { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    [Required]
    public required string Name { get; set; }

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// ワークスペースの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// ジャンルID
    /// </summary>
    public int? GenreId { get; set; }

    /// <summary>
    /// ジャンル名
    /// </summary>
    public string? GenreName { get; set; }

    /// <summary>
    /// ジャンルアイコン
    /// </summary>
    public string? GenreIcon { get; set; }

    /// <summary>
    /// メンバー一覧
    /// </summary>
    public List<WorkspaceDetailUserResponse> Members { get; set; } = [];

    /// <summary>
    /// オーナー情報
    /// </summary>
    /// <value></value>
    public WorkspaceDetailUserResponse? Owner { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 作成ユーザー（無効なユーザーでも含む）
    /// </summary>
    public WorkspaceDetailUserResponse CreatedBy { get; set; } = null!;

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTimeOffset? UpdatedAt { get; set; }

    /// <summary>
    /// 更新ユーザー（無効なユーザーでも含む）
    /// </summary>
    public WorkspaceDetailUserResponse UpdatedBy { get; set; } = null!;

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// ワークスペースモード
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<WorkspaceMode>))]
    public WorkspaceMode? Mode { get; set; }

    /// <summary>
    /// ログインユーザーのこのワークスペースに対するロール
    /// </summary>
    public WorkspaceRole? CurrentUserRole { get; set; }

    /// <summary>
    /// ワークスペースに設定されているスキル一覧
    /// </summary>
    public List<WorkspaceSkillResponse> Skills { get; set; } = [];

    /// <summary>
    /// 楽観的ロック用のRowVersion
    /// </summary>
    [Required]
    public required uint RowVersion { get; set; }
}