using System.Text.Json.Serialization;

namespace Pecus.Models.Responses.WorkspaceTask;

/// <summary>
/// タスク生成AIの応答
/// </summary>
public class TaskGenerationResponse
{
    /// <summary>
    /// 生成されたタスク候補
    /// </summary>
    public required List<GeneratedTaskCandidate> Candidates { get; set; }

    /// <summary>
    /// プロジェクト全体の推定期間（日数）
    /// </summary>
    public int TotalEstimatedDays { get; set; }

    /// <summary>
    /// クリティカルパスの説明
    /// </summary>
    public string? CriticalPathDescription { get; set; }

    /// <summary>
    /// AIからの提案・注意事項
    /// </summary>
    public List<string> Suggestions { get; set; } = [];
}

/// <summary>
/// AIが生成するタスク候補
/// </summary>
public class GeneratedTaskCandidate
{
    /// <summary>
    /// 一時的なID（フロント管理用）
    /// </summary>
    public required string TempId { get; set; }

    /// <summary>
    /// タスク内容
    /// </summary>
    public required string Content { get; set; }

    /// <summary>
    /// タスクタイプID（AIがTaskTypeテーブルから選択）
    /// </summary>
    public int? SuggestedTaskTypeId { get; set; }

    /// <summary>
    /// タスクタイプ選択理由（AIが判断根拠を説明）
    /// </summary>
    public string? TaskTypeRationale { get; set; }

    /// <summary>
    /// 規模感（参考情報として表示のみ、タスク作成には使用しない）
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter<EstimatedSize>))]
    public EstimatedSize EstimatedSize { get; set; }

    /// <summary>
    /// 先行タスクの一時ID（依存関係）
    /// </summary>
    public List<string> PredecessorTempIds { get; set; } = [];

    /// <summary>
    /// クリティカルパス上か
    /// </summary>
    public bool IsOnCriticalPath { get; set; }

    /// <summary>
    /// 並行作業可能か
    /// </summary>
    public bool CanParallelize { get; set; }

    /// <summary>
    /// 推奨開始日（プロジェクト開始からの相対日数）
    /// </summary>
    public int SuggestedStartDayOffset { get; set; }

    /// <summary>
    /// 推奨期間（日数）
    /// </summary>
    public int SuggestedDurationDays { get; set; }

    /// <summary>
    /// AIによる補足説明
    /// </summary>
    public string? Rationale { get; set; }
}

/// <summary>
/// タスクの規模感
/// </summary>
public enum EstimatedSize
{
    /// <summary>
    /// 半日以内（〜4時間）
    /// </summary>
    S,

    /// <summary>
    /// 1日程度（〜8時間）
    /// </summary>
    M,

    /// <summary>
    /// 2-3日（〜24時間）
    /// </summary>
    L,

    /// <summary>
    /// 1週間程度（〜40時間）
    /// </summary>
    XL
}
