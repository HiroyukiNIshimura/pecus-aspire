namespace Pecus.Libs.AI.Models;

/// <summary>
/// 会話の宛先判定結果
/// </summary>
public class ConversationTargetResult
{
    /// <summary>
    /// 判定されたターゲットのID（ボットIDなど）
    /// 宛先が判定できなかった場合はnull
    /// </summary>
    public string? TargetId { get; set; }

    /// <summary>
    /// 判定されたターゲットの名前
    /// </summary>
    public string? TargetName { get; set; }

    /// <summary>
    /// 判定の確信度 (0-100)
    /// </summary>
    public int Confidence { get; set; }

    /// <summary>
    /// 判定の根拠となった要素の説明
    /// </summary>
    public string Reasoning { get; set; } = string.Empty;
}
