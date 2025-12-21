namespace Pecus.Libs.DB.Models.Enums;

/// <summary>
/// チャットルーム内役割
/// </summary>
public enum ChatRoomRole
{
    /// <summary>
    /// 一般メンバー
    /// </summary>
    Member = 0,

    /// <summary>
    /// 管理者（メンバー追加/削除、ルーム設定変更可能）
    /// </summary>
    Admin = 1,

    /// <summary>
    /// オーナー（ルーム削除可能）
    /// </summary>
    Owner = 2,
}