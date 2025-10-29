namespace Pecus.Models.Responses.Common;

/// <summary>
/// 継続ジョブレスポンス
/// </summary>
public class ContinuationResponse : MessageResponse
{
    /// <summary>
    /// 親ジョブID
    /// </summary>
    public required string ParentJobId { get; set; }

    /// <summary>
    /// 子ジョブID
    /// </summary>
    public required string ChildJobId { get; set; }
}