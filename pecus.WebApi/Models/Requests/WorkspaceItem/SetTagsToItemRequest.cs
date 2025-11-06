using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItem;

/// <summary>
/// Request DTO for setting all tags on a workspace item
/// </summary>
public class SetTagsToItemRequest
{
    /// <summary>
    /// タグ情報のリスト。既存のすべてのタグを置き換えます。
    /// 既存タグの場合はId、RowVersion、Nameを指定。
    /// 新規タグの場合はId=null、RowVersion=null、Nameを指定。
    /// 空のリストまたはnullの場合はすべてのタグを削除します。
    /// </summary>
    [MaxLength(20, ErrorMessage = "タグの数は最大20件までです。")]
    public List<TagItemRequest>? Tags { get; set; }

    /// <summary>
    /// アイテムの楽観的ロック用RowVersion。
    /// 競合検出に使用されます。設定されている場合、アイテムのRowVersionをチェックします。
    /// </summary>
    public byte[]? RowVersion { get; set; }
}
