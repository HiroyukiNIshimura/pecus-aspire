namespace Pecus.Models.Responses.Common;

/// <summary>
/// ジョブレスポンス
/// </summary>
public class JobResponse : MessageResponse
{
    /// <summary>
    /// ジョブID
    /// </summary>
    public required string JobId { get; set; }
}