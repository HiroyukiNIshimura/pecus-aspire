namespace Pecus.Models.Responses.DocumentTree;

/// <summary>
/// ドキュメントツリーのアイテム情報
/// </summary>
public class DocumentTreeItemResponse
{
    /// <summary>
    /// アイテムID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// アイテムコード
    /// </summary>
    public required string Code { get; set; }

    /// <summary>
    /// 件名
    /// </summary>
    public required string Subject { get; set; }

    /// <summary>
    /// 親アイテムID（nullの場合はルートアイテム）
    /// </summary>
    public int? ParentId { get; set; }

    /// <summary>
    /// 下書きかどうか
    /// </summary>
    public bool IsDraft { get; set; }

    /// <summary>
    /// 表示順序（同一親内での並び順）
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// 行バージョン（楽観的ロック用）
    /// </summary>
    public uint RowVersion { get; set; }
}

/// <summary>
/// ドキュメントツリーレスポンス
/// </summary>
public class DocumentTreeResponse
{
    /// <summary>
    /// ツリーアイテム一覧
    /// </summary>
    public List<DocumentTreeItemResponse> Items { get; set; } = [];

    /// <summary>
    /// 総アイテム数
    /// </summary>
    public int TotalCount { get; set; }
}