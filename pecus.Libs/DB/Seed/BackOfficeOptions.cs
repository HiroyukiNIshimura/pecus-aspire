namespace Pecus.Libs.DB.Seed;

/// <summary>
/// BackOfficeの初期設定オプション
/// </summary>
public class BackOfficeOptions
{
    /// <summary>
    /// 組織情報
    /// </summary>
    public BackOfficeOrganization Organization { get; set; } = new();

    /// <summary>
    /// ユーザーリスト
    /// </summary>
    public List<BackOfficeUser> Users { get; set; } = new();
}

/// <summary>
/// BackOfficeの組織情報
/// </summary>
public class BackOfficeOrganization
{
    /// <summary>
    /// 組織名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 組織コード
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// 電話番号
    /// </summary>
    public string PhoneNumber { get; set; } = string.Empty;

    /// <summary>
    /// メールアドレス
    /// </summary>
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// BackOfficeのユーザー情報
/// </summary>
public class BackOfficeUser
{
    /// <summary>
    /// メールアドレス
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// ユーザー名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// パスワード
    /// </summary>
    public string Password { get; set; } = string.Empty;

}