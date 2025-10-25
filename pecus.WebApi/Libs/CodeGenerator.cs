using System.Security.Cryptography;
using System.Text;

namespace Pecus.Libs;

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
        // ランダムなGUIDとタイムスタンプを組み合わせてハッシュ化
        var uniqueString = $"{Guid.NewGuid()}{DateTime.UtcNow.Ticks}";
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(uniqueString));

        // Base64エンコードして、URL安全な文字列に変換（先頭16文字を使用）
        return Convert
            .ToBase64String(hashBytes)
            .Replace("+", "")
            .Replace("/", "")
            .Replace("=", "")
            .Substring(0, 16);
    }

    /// <summary>
    /// ワークスペースコードを生成（8文字の英数字）
    /// </summary>
    public static string GenerateWorkspaceCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();

        // 8文字のランダムコードを生成
        return new string(
            Enumerable.Repeat(chars, 8).Select(s => s[random.Next(s.Length)]).ToArray()
        );
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
