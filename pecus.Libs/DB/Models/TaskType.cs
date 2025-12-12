namespace Pecus.Libs.DB.Models;

/// <summary>
/// タスク種類マスタエンティティ
/// </summary>
public class TaskType
{
    /// <summary>
    /// タスク種類ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// タスク種類コード（英字、APIレスポンスで使用）
    /// </summary>
    public required string Code { get; set; }

    /// <summary>
    /// タスク種類名（日本語表示名）
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// タスク種類の説明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// タスク種類アイコン（拡張子なしのファイル名）
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// 表示順
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>
    /// 作成者ユーザーID
    /// </summary>
    public int? CreatedByUserId { get; set; }

    /// <summary>
    /// 更新日時
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// 更新者ユーザーID
    /// </summary>
    public int? UpdatedByUserId { get; set; }

    /// <summary>
    /// アクティブフラグ
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// このタスク種類を持つワークスペースタスク
    /// </summary>
    public ICollection<WorkspaceTask> WorkspaceTasks { get; set; } = new List<WorkspaceTask>();

    /// <summary>
    /// 楽観的ロック用バージョン番号（PostgreSQL の xmin システムカラム）
    /// </summary>
    public uint RowVersion { get; set; }
}