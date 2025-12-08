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
}