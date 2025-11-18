namespace Pecus.Libs.Image;

/// <summary>
/// サムネイル関連のヘルパークラス
/// </summary>
public static class ThumbnailHelper
{
    /// <summary>
    /// サムネイルのファイルパスを生成
    /// </summary>
    /// <param name="sourceFilePath">元ファイルのパス</param>
    /// <param name="size">サイズ識別子（medium, small等）</param>
    /// <returns>サムネイルのファイルパス</returns>
    public static string GenerateThumbnailPath(string sourceFilePath, string size)
    {
        var directory = Path.GetDirectoryName(sourceFilePath);
        var fileNameWithoutExt = Path.GetFileNameWithoutExtension(sourceFilePath);
        var extension = Path.GetExtension(sourceFilePath);

        var thumbnailFileName = $"{fileNameWithoutExt}_{size}{extension}";

        if (string.IsNullOrEmpty(directory))
        {
            return thumbnailFileName;
        }

        return Path.Combine(directory, thumbnailFileName);
    }

    /// <summary>
    /// 画像ファイルかどうかを判定
    /// </summary>
    /// <param name="mimeType">MIMEタイプ</param>
    /// <returns>画像ファイルの場合true</returns>
    public static bool IsImageFile(string mimeType)
    {
        var imageMimeTypes = new[]
        {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/bmp",
        };
        return imageMimeTypes.Contains(mimeType, StringComparer.OrdinalIgnoreCase);
    }
}