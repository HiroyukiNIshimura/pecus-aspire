namespace Pecus.Models.Responses.WorkspaceItem;

/// <summary>
///  ドキュメント提案レスポンス
/// </summary>
public class DocumentSuggestionResponse
{
    /// <summary>
    /// 提案されたドキュメント内容(Markdown)
    /// </summary>
    public string SuggestedContent { get; set; } = string.Empty;
}