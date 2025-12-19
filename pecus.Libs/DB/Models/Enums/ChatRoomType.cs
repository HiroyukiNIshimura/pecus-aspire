namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// チャットルームタイプ
/// </summary>
public enum ChatRoomType
{
    /// <summary>
    /// 1:1 ダイレクトメッセージ（メンバー2人固定）
    /// </summary>
    Dm = 0,

    /// <summary>
    /// グループチャット
    /// 組織ごとに1つ存在し、全メンバーが参加
    /// </summary>
    Group = 1,

    /// <summary>
    /// AI アシスタントとのチャット
    /// ChatRoomMember は人間ユーザー1人のみ
    /// AI からのメッセージは SenderUserId = null, MessageType = Ai で表現
    /// </summary>
    Ai = 2,

    /// <summary>
    /// システム通知ルーム
    /// 組織ごとに1つ存在し、全メンバーが参加
    /// 運営からのお知らせ、アラートなどを配信
    /// </summary>
    System = 3,
}
