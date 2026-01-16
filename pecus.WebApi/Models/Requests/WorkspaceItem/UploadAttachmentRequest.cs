using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Requests.WorkspaceItem;

public class UploadAttachmentRequest
{
    /// <summary>
    /// オリジナルファイル名
    /// </summary>
    [MaxLength(200, ErrorMessage = "オリジナルファイル名は200文字以内で入力してください。")]
    public string? OriginalFileName { get; set; }

    /// <summary>
    /// ワークスペースタスクID（オプション）
    /// </summary>
    public int? WorkspaceTaskId { get; set; }
}