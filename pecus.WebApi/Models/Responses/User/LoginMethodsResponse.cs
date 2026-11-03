using System.ComponentModel.DataAnnotations;

namespace Pecus.Models.Responses.User;

/// <summary>
/// ログイン方式の判定結果
/// </summary>
public class LoginMethodsResponse
{
    /// <summary>
    /// パスワードログインが利用できるか（組織設定に依存）
    /// </summary>
    public bool PasswordEnabled { get; set; }

    /// <summary>
    /// パスキーログインが利用できるか（組織設定に依存）
    /// </summary>
    public bool PasskeyEnabled { get; set; }

    /// <summary>
    /// 対象ユーザーがパスキーを登録済みか
    /// </summary>
    public bool HasPasskey { get; set; }
}
