using System.Security.Cryptography;
using System.Text;

namespace Pecus.Libs.Utils;

/// <summary>
/// コード生成ヘルパー
/// </summary>
public static class CodeGenerator
{
    /// <summary>
    /// ユニークなLoginIdを生成（16文字のURL安全なハッシュ文字列）
    /// </summary>
    public static string GenerateLoginId()
    {
        // 暗号学的に安全な16バイト（128ビット）のランダム値を生成
        var randomBytes = RandomNumberGenerator.GetBytes(16);

        // Base64エンコードして、URL安全な文字列に変換（先頭16文字を使用）
        return Convert
            .ToBase64String(randomBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "")
            .Substring(0, 16);
    }

    /// <summary>
    /// ワークスペースコードを生成（16文字のURL安全なハッシュ文字列）
    /// </summary>
    public static string GenerateWorkspaceCode()
    {
        // 暗号学的に安全な16バイト（128ビット）のランダム値を生成
        var randomBytes = RandomNumberGenerator.GetBytes(16);

        // Base64エンコードして、URL安全な文字列に変換（先頭16文字を使用）
        return Convert
            .ToBase64String(randomBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "")
            .Substring(0, 16);
    }

    /// <summary>
    /// ワークスペースアイテムコードを生成（32文字のURL安全なハッシュ文字列）
    /// </summary>
    public static string GenerateWorkspaceItemCode()
    {
        // ランダムなGUIDとタイムスタンプを組み合わせてハッシュ化
        var uniqueString = $"{Guid.NewGuid()}{DateTime.UtcNow.Ticks}";
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(uniqueString));

        // Base64エンコードして、URL安全な文字列に変換（先頭32文字を使用）
        return Convert
            .ToBase64String(hashBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "")
            .Substring(0, 32);
    }
}