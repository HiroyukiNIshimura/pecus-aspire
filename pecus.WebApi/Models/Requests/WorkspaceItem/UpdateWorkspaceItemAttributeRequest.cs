using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace Pecus.Models.Requests.WorkspaceItem;

/// <summary>
/// ワークスペースアイテム属性更新リクエスト
/// </summary>
public class UpdateWorkspaceItemAttributeRequest
{
    /// <summary>
    /// 更新する値（属性に応じた型を JSON 形式で送信。null で値をクリア）
    /// </summary>
    public JsonElement? Value { get; set; }

    /// <summary>
    /// 楽観的ロック用バージョン
    /// </summary>
    [Required(ErrorMessage = "RowVersionは必須です。")]
    public required uint RowVersion { get; set; }
}
