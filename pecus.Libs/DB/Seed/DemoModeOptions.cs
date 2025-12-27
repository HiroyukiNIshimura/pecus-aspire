namespace Pecus.Libs.DB.Seed;

/// <summary>
/// デモモードの設定オプション
/// </summary>
public class DemoModeOptions
{
    /// <summary>
    /// デモモードが有効かどうか
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// デモ用組織情報
    /// </summary>
    public DemoOrganization Organization { get; set; } = new();

    /// <summary>
    /// デモ用ユーザーリスト
    /// </summary>
    public List<DemoUser> Users { get; set; } = new();
}

/// <summary>
/// デモ用組織情報
/// </summary>
public class DemoOrganization
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
/// デモ用ユーザー情報
/// </summary>
public class DemoUser
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

    /// <summary>
    /// ロール (Admin/User)
    /// </summary>
    public string Role { get; set; } = string.Empty;
}
