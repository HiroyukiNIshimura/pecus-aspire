namespace Pecus.Models.Responses.External;

/// <summary>
/// 外部API経由でワークスペースアイテム作成のレスポンス
/// </summary>
public class CreateExternalWorkspaceItemResponse
{
    /// <summary>
    /// ワークスペースコード
    /// </summary>
    public required string WorkspaceCode { get; init; }

    /// <summary>
    /// アイテム番号（ワークスペース内連番）
    /// </summary>
    public required int ItemNumber { get; init; }

    /// <summary>
    /// アイテムの件名
    /// </summary>
    public required string Subject { get; init; }

    /// <summary>
    /// 作成日時（UTC）
    /// </summary>
    public required DateTimeOffset CreatedAt { get; init; }
}