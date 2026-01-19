using Pecus.Models.Responses.User;

namespace Pecus.Models.Responses.Agenda;

/// <summary>
/// アジェンダ例外レスポンス（特定回の中止・変更）
/// </summary>
public class AgendaExceptionResponse
{
    /// <summary>
    /// 例外ID
    /// </summary>
    public required long Id { get; set; }

    /// <summary>
    /// 親アジェンダID
    /// </summary>
    public required long AgendaId { get; set; }

    /// <summary>
    /// 対象の元の開始日時（どの回かを特定）
    /// </summary>
    public required DateTimeOffset OriginalStartAt { get; set; }

    /// <summary>
    /// この回は中止か
    /// </summary>
    public bool IsCancelled { get; set; }

    /// <summary>
    /// 中止理由
    /// </summary>
    public string? CancellationReason { get; set; }

    /// <summary>
    /// 変更後の開始日時
    /// </summary>
    public DateTimeOffset? ModifiedStartAt { get; set; }

    /// <summary>
    /// 変更後の終了日時
    /// </summary>
    public DateTimeOffset? ModifiedEndAt { get; set; }

    /// <summary>
    /// 変更後のタイトル
    /// </summary>
    public string? ModifiedTitle { get; set; }

    /// <summary>
    /// 変更後の場所
    /// </summary>
    public string? ModifiedLocation { get; set; }

    /// <summary>
    /// 変更後のURL
    /// </summary>
    public string? ModifiedUrl { get; set; }

    /// <summary>
    /// 変更後の詳細
    /// </summary>
    public string? ModifiedDescription { get; set; }

    /// <summary>
    /// 作成日時
    /// </summary>
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>
    /// 作成ユーザー
    /// </summary>
    public UserItem? CreatedByUser { get; set; }
}
