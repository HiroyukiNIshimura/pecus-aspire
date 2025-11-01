using System.Security.Cryptography;
using System.Text;

namespace Pecus.Libs.Security;

/// <summary>
/// パスワードハッシュ化ユーティリティ（SHA256+Base64）
/// </summary>
public static class PasswordHasher
{
    /// <summary>
    /// パスワードをハッシュ化
    /// </summary>
    public static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    /// <summary>
    /// パスワードを検証
    /// </summary>
    public static bool VerifyPassword(string password, string passwordHash)
    {
        var hash = HashPassword(password);
        return hash == passwordHash;
    }
}
