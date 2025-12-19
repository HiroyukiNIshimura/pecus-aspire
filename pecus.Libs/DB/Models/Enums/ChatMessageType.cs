namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// チャットメッセージタイプ
/// </summary>
public enum ChatMessageType
{
    /// <summary>
    /// テキストメッセージ
    /// </summary>
    Text = 0,

    /// <summary>
    /// システムメッセージ（システム通知ルームで使用）
    /// </summary>
    System = 1,

    /// <summary>
    /// AI アシスタントからのメッセージ
    /// </summary>
    Ai = 2,

    /// <summary>
    /// ファイル添付メッセージ
    /// </summary>
    File = 3,
}
