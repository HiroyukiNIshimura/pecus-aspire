using SkiaSharp;

namespace Pecus.Libs.Image;

/// <summary>
/// SkiaSharp を使用した画像の読み込み、サイズ変更、エンコード処理
/// </summary>
public static class ImageProcessingHelper
{
    private static readonly SKSamplingOptions ResizeSampling = new(SKFilterMode.Linear);

    /// <summary>
    /// 画像の幅と高さを取得
    /// </summary>
    public static async Task<(int Width, int Height)> GetDimensionsAsync(string filePath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(filePath);

        var encodedImage = await File.ReadAllBytesAsync(filePath);
        var imageInfo = SKBitmap.DecodeBounds(encodedImage);
        if (imageInfo.IsEmpty)
        {
            throw new InvalidDataException($"画像を読み込めません: {filePath}");
        }

        return (imageInfo.Width, imageInfo.Height);
    }

    /// <summary>
    /// 画像をリサイズして、出力ファイルの拡張子に対応する形式で保存
    /// </summary>
    /// <param name="sourceFilePath">入力画像パス</param>
    /// <param name="destinationFilePath">出力画像パス</param>
    /// <param name="maxWidth">出力幅</param>
    /// <param name="maxHeight">出力高さ</param>
    /// <param name="cropToFit">true の場合は中央クロップして指定サイズに合わせる</param>
    /// <param name="allowUpscale">true の場合は出力サイズに合わせて拡大する</param>
    /// <param name="quality">非可逆形式の品質（0～100）</param>
    public static async Task ResizeAsync(
        string sourceFilePath,
        string destinationFilePath,
        int maxWidth,
        int maxHeight,
        bool cropToFit = false,
        bool allowUpscale = false,
        int quality = 85
    )
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceFilePath);
        ArgumentException.ThrowIfNullOrWhiteSpace(destinationFilePath);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maxWidth);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maxHeight);
        ArgumentOutOfRangeException.ThrowIfLessThan(quality, 0);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(quality, 100);

        var encodedImage = await File.ReadAllBytesAsync(sourceFilePath);
        using var source = SKBitmap.Decode(encodedImage)
            ?? throw new InvalidDataException($"画像を読み込めません: {sourceFilePath}");

        var outputSize = GetOutputSize(source.Width, source.Height, maxWidth, maxHeight, cropToFit, allowUpscale);
        var sourceRect = cropToFit
            ? GetCenteredCrop(source.Width, source.Height, outputSize.Width, outputSize.Height)
            : SKRect.Create(source.Width, source.Height);

        using var resized = new SKBitmap(
            new SKImageInfo(outputSize.Width, outputSize.Height, SKColorType.Rgba8888, SKAlphaType.Premul)
        );
        using (var canvas = new SKCanvas(resized))
        {
            canvas.Clear(SKColors.Transparent);
            canvas.DrawBitmap(
                source,
                sourceRect,
                SKRect.Create(outputSize.Width, outputSize.Height),
                ResizeSampling
            );
        }

        var (format, outputQuality) = GetEncoding(Path.GetExtension(destinationFilePath), quality);
        using var encoded = resized.Encode(format, outputQuality)
            ?? throw new InvalidOperationException($"画像をエンコードできません: {destinationFilePath}");

        await File.WriteAllBytesAsync(destinationFilePath, encoded.ToArray());
    }

    private static SKSizeI GetOutputSize(
        int sourceWidth,
        int sourceHeight,
        int maxWidth,
        int maxHeight,
        bool cropToFit,
        bool allowUpscale
    )
    {
        if (cropToFit)
        {
            return new SKSizeI(maxWidth, maxHeight);
        }

        var scale = Math.Min((double)maxWidth / sourceWidth, (double)maxHeight / sourceHeight);
        if (!allowUpscale)
        {
            scale = Math.Min(scale, 1d);
        }

        return new SKSizeI(
            Math.Max(1, (int)Math.Round(sourceWidth * scale)),
            Math.Max(1, (int)Math.Round(sourceHeight * scale))
        );
    }

    private static SKRect GetCenteredCrop(int sourceWidth, int sourceHeight, int targetWidth, int targetHeight)
    {
        var targetAspectRatio = (double)targetWidth / targetHeight;
        var sourceAspectRatio = (double)sourceWidth / sourceHeight;

        if (sourceAspectRatio > targetAspectRatio)
        {
            var cropWidth = (float)(sourceHeight * targetAspectRatio);
            var left = (sourceWidth - cropWidth) / 2f;
            return new SKRect(left, 0, left + cropWidth, sourceHeight);
        }

        var cropHeight = (float)(sourceWidth / targetAspectRatio);
        var top = (sourceHeight - cropHeight) / 2f;
        return new SKRect(0, top, sourceWidth, top + cropHeight);
    }

    private static (SKEncodedImageFormat Format, int Quality) GetEncoding(string extension, int quality)
    {
        return extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => (SKEncodedImageFormat.Jpeg, quality),
            ".png" => (SKEncodedImageFormat.Png, 100),
            ".webp" => (SKEncodedImageFormat.Webp, quality),
            ".bmp" => (SKEncodedImageFormat.Bmp, 100),
            _ => throw new NotSupportedException($"出力画像形式をサポートしていません: {extension}"),
        };
    }
}
