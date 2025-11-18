namespace Pecus.Models.Responses.Workspace;

/// <summary>
/// ワークスペース詳細情報（メンバー情報含む）レスポンス
/// </summary>
public class WorkspaceDetailFullResponse
{
    /// <summary>
    /// ワークスペースID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ワークスペース名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// ワークスペースの説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 作成者情報
    /// </summary>
    public WorkspaceDetailUserResponse CreatedBy { get; set; } = null!;

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者情報
    /// </summary>
    public WorkspaceDetailUserResponse UpdatedBy { get; set; } = null!;

    /// <summary>
    /// ジャンル情報
    /// </summary>
    public WorkspaceGenreResponse? Genre { get; set; }

    /// <summary>
    /// メンバー一覧
    /// </summary>
    public List<WorkspaceDetailUserResponse> Members { get; set; } = new();

    /// <summary>
    /// 楽観的同時実行制御用のバージョン番号
    /// </summary>
    public uint RowVersion { get; set; }
}