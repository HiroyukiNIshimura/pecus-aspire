namespace Pecus.Libs.Security;

/// <summary>
/// パスワードハッシュ化ユーティリティ
/// </summary>
public static class PasswordHasher
{
    private const int WorkFactor = 12;

    /// <summary>
    /// パスワードをハッシュ化
    /// </summary>
    public static string HashPassword(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        return BCrypt.Net.BCrypt.EnhancedHashPassword(password, WorkFactor);
    }

    /// <summary>
    /// パスワードを検証
    /// </summary>
    public static bool VerifyPassword(string password, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(passwordHash))
        {
            return false;
        }

        return BCrypt.Net.BCrypt.EnhancedVerify(password, passwordHash);
    }
}