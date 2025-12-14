using System.Text.Json.Serialization;

namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// フォーカス推奨スコアリングの優先要素
/// ユーザーが3つの要素（優先度・期限・後続影響）のうち、どれを重視するかを選択
/// 選択した要素の重みは5、その他の要素は3として計算される
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<FocusScorePriority>))]
public enum FocusScorePriority
{
    /// <summary>
    /// 優先度を重視（Priority: 5, Deadline: 3, SuccessorImpact: 3）
    /// </summary>
    Priority = 1,

    /// <summary>
    /// 期限を重視（Priority: 3, Deadline: 5, SuccessorImpact: 3）
    /// </summary>
    Deadline = 2,

    /// <summary>
    /// 後続タスク影響を重視（Priority: 3, Deadline: 3, SuccessorImpact: 5）
    /// </summary>
    SuccessorImpact = 3
}
