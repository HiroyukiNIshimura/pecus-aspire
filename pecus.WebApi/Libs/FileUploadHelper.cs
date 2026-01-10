using System.Security.Cryptography;
using System.Text;

namespace Pecus.Libs;

/// <summary>
/// ファイルアップロード用ヘルパー
/// </summary>
public static class FileUploadHelper
{
    /// <summary>
    /// ファイル用のユニークなハッシュ文字列を生成
    /// </summary>
    public static string GenerateUniqueFileHash()
    {
        var uniqueString = $"{Guid.NewGuid()}{DateTime.UtcNow.Ticks}";
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(uniqueString));

        // Base64エンコードしてURL安全な文字列に変換（32文字）
        return Convert
            .ToBase64String(hashBytes)
            .Replace("+", "")
            .Replace("/", "")
            .Replace("=", "")
            .Substring(0, 32);
    }

    /// <summary>
    /// ファイルの保存パスを生成
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="fileType">ファイルの種類（avatar, genre など）</param>
    /// <param name="resourceId">リソースID</param>
    /// <param name="fileExtension">ファイル拡張子（ドット含む）</param>
    /// <param name="storagePath">ストレージのルートパス</param>
    /// <returns>ファイルの保存パス</returns>
    public static string GenerateFilePath(
        int organizationId,
        string fileType,
        int resourceId,
        string fileExtension,
        string storagePath
    )
    {
        var fileHash = GenerateUniqueFileHash();
        var fileName = $"{fileHash}{fileExtension}";

        // /organizations/[組織ID]/[ファイルの種類]/[リソースのID]/[ファイル名]
        return Path.Combine(
            storagePath,
            "organizations",
            organizationId.ToString(),
            fileType,
            resourceId.ToString(),
            fileName
        );
    }

    /// <summary>
    /// ファイル拡張子を取得
    /// </summary>
    public static string GetFileExtension(string fileName) =>
        Path.GetExtension(fileName).ToLowerInvariant();

    /// <summary>
    /// ファイル拡張子が許可されているかチェック
    /// </summary>
    public static bool IsAllowedExtension(string extension, string[] allowedExtensions) =>
        allowedExtensions.Contains(extension.ToLowerInvariant());

    /// <summary>
    /// MIMEタイプが許可されているかチェック
    /// </summary>
    public static bool IsAllowedMimeType(string mimeType, string[] allowedMimeTypes) =>
        allowedMimeTypes.Contains(mimeType.ToLowerInvariant());

    /// <summary>
    /// ファイルサイズが許可されているかチェック
    /// </summary>
    public static bool IsAllowedFileSize(long fileSize, long maxFileSize) =>
        fileSize <= maxFileSize;

    /// <summary>
    /// ディレクトリが存在しない場合は作成
    /// </summary>
    public static void EnsureDirectoryExists(string filePath)
    {
        var directory = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }
    }

}