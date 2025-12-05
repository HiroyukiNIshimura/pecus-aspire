using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using SixLaborsImage = SixLabors.ImageSharp.Image;

namespace Pecus.Libs;

/// <summary>
/// 画像処理用ヘルパー
/// </summary>
public static class ImageHelper
{
    /// <summary>
    /// 画像を指定されたサイズにリサイズし、WebP形式で保存
    /// </summary>
    /// <param name="inputFilePath">入力ファイルパス</param>
    /// <param name="outputFilePath">出力ファイルパス（拡張子は自動的に.webpに変更されます）</param>
    /// <param name="width">幅（デフォルト: 48）</param>
    /// <param name="height">高さ（デフォルト: 48）</param>
    /// <param name="quality">WebP品質（デフォルト: 85）</param>
    /// <returns>実際に保存されたファイルパス（.webp拡張子）</returns>
    public static async Task<string> ResizeImageAsync(
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

        // 出力ファイルパスを .webp に変更
        var directory = Path.GetDirectoryName(outputFilePath);
        var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(outputFilePath);
        var webpFilePath = Path.Combine(directory ?? string.Empty, $"{fileNameWithoutExtension}.webp");

        // WebP形式で保存
        await image.SaveAsWebpAsync(webpFilePath, new WebpEncoder { Quality = quality });

        return webpFilePath;
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