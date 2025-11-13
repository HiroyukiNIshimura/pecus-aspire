namespace Pecus.Models.Responses.User;

/// <summary>
/// アバターDataURLレスポンス
/// </summary>
public class AvatarDataUrlResponse
{
    /// <summary>
    /// DataURL形式の画像データ（例: data:image/jpeg;base64,/9j/4AAQ...）
    /// </summary>
    public required string DataUrl { get; set; }
}
