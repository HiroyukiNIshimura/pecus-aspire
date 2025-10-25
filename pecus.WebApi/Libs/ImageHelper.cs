using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;
using SixLaborsImage = SixLabors.ImageSharp.Image;

namespace Pecus.Libs;

/// <summary>
/// 画像処理用ヘルパー
/// </summary>
public static class ImageHelper
{
    /// <summary>
    /// 画像を指定されたサイズにリサイズ
    /// </summary>
    /// <param name="inputFilePath">入力ファイルパス</param>
    /// <param name="outputFilePath">出力ファイルパス</param>
    /// <param name="width">幅（デフォルト: 48）</param>
    /// <param name="height">高さ（デフォルト: 48）</param>
    /// <param name="quality">JPEG品質（デフォルト: 85）</param>
    public static async Task ResizeImageAsync(
        string inputFilePath,
        string outputFilePath,
        int width = 48,
        int height = 48,
        int quality = 85
    )
    {
        using var image = await SixLaborsImage.LoadAsync(inputFilePath);

        // アスペクト比を保持してリサイズ（中央切り抜き）
        image.Mutate(x =>
            x.Resize(
                new ResizeOptions
                {
                    Size = new Size(width, height),
                    Mode = ResizeMode.Crop,
                    Position = AnchorPositionMode.Center,
                }
            )
        );

        // 出力形式を決定
        var extension = Path.GetExtension(outputFilePath).ToLowerInvariant();

        switch (extension)
        {
            case ".jpg":
            case ".jpeg":
                await image.SaveAsJpegAsync(outputFilePath, new JpegEncoder { Quality = quality });
                break;
            case ".png":
                await image.SaveAsPngAsync(outputFilePath);
                break;
            default:
                // デフォルトはJPEG
                await image.SaveAsJpegAsync(outputFilePath, new JpegEncoder { Quality = quality });
                break;
        }
    }

    /// <summary>
    /// 画像が指定されたサイズより大きいかチェック
    /// </summary>
    /// <param name="filePath">ファイルパス</param>
    /// <param name="maxWidth">最大幅（デフォルト: 48）</param>
    /// <param name="maxHeight">最大高さ（デフォルト: 48）</param>
    /// /// <returns>リサイズが必要な場合true</returns>
    public static async Task<bool> NeedsResizeAsync(
        string filePath,
        int maxWidth = 48,
        int maxHeight = 48
    )
    {
        try
        {
            using var image = await SixLaborsImage.LoadAsync(filePath);
            return image.Width > maxWidth || image.Height > maxHeight;
        }
        catch
        {
            // 画像が読み込めない場合はリサイズ不要とする
            return false;
        }
    }

    /// <summary>
    /// 元ファイル名から_orgサフィックス付きのファイル名を生成
    /// </summary>
    /// <param name="originalFilePath">元のファイルパス</param>
    /// <returns>_orgサフィックス付きのファイルパス</returns>
    public static string GenerateOriginalFilePath(string originalFilePath)
    {
        var directory = Path.GetDirectoryName(originalFilePath);
        var fileName = Path.GetFileNameWithoutExtension(originalFilePath);
        var extension = Path.GetExtension(originalFilePath);

        var orgFileName = $"{fileName}_org{extension}";
        return Path.Combine(directory ?? string.Empty, orgFileName);
    }
}
