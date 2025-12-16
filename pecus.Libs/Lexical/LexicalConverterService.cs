using Grpc.Net.Client;
using Microsoft.Extensions.Logging;
using Pecus.Lexical.Grpc;

namespace Pecus.Libs.Lexical;

/// <summary>
/// gRPC 経由で Lexical JSON を各形式に変換するサービス
/// </summary>
public class LexicalConverterService : ILexicalConverterService, IDisposable
{
    private readonly GrpcChannel _channel;
    private readonly LexicalConverter.LexicalConverterClient _client;
    private readonly ILogger<LexicalConverterService> _logger;
    private bool _disposed;

    /// <summary>
    /// LexicalConverterService のコンストラクタ
    /// </summary>
    /// <param name="grpcEndpoint">gRPC サービスのエンドポイント URL</param>
    /// <param name="logger">ロガー</param>
    public LexicalConverterService(string grpcEndpoint, ILogger<LexicalConverterService> logger)
    {
        _logger = logger;
        _channel = GrpcChannel.ForAddress(grpcEndpoint);
        _client = new LexicalConverter.LexicalConverterClient(_channel);

        _logger.LogInformation("LexicalConverterService initialized with endpoint: {Endpoint}", grpcEndpoint);
    }

    /// <inheritdoc />
    public async Task<LexicalConvertResult> ToHtmlAsync(string lexicalJson, CancellationToken cancellationToken = default)
    {
        return await ConvertAsync(lexicalJson, ConvertType.Html, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<LexicalConvertResult> ToMarkdownAsync(string lexicalJson, CancellationToken cancellationToken = default)
    {
        return await ConvertAsync(lexicalJson, ConvertType.Markdown, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<LexicalConvertResult> ToPlainTextAsync(string lexicalJson, CancellationToken cancellationToken = default)
    {
        return await ConvertAsync(lexicalJson, ConvertType.PlainText, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<LexicalConvertResult> FromMarkdownAsync(string markdown, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(markdown))
        {
            // 空の Markdown は空の EditorState を返す
            return new LexicalConvertResult
            {
                Success = true,
                Result = "{\"root\":{\"children\":[{\"children\":[],\"direction\":null,\"format\":\"\",\"indent\":0,\"type\":\"paragraph\",\"version\":1}],\"direction\":null,\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}",
                ProcessingTimeMs = 0
            };
        }

        try
        {
            var request = new MarkdownToLexicalRequest { Markdown = markdown };
            var response = await _client.FromMarkdownAsync(request, cancellationToken: cancellationToken);

            return new LexicalConvertResult
            {
                Success = response.Success,
                Result = response.Result,
                ErrorMessage = response.HasErrorMessage ? response.ErrorMessage : null,
                ProcessingTimeMs = response.ProcessingTimeMs,
                UnknownNodes = [.. response.UnknownNodes]
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to convert Markdown to Lexical JSON");

            return new LexicalConvertResult
            {
                Success = false,
                Result = string.Empty,
                ErrorMessage = ex.Message,
                ProcessingTimeMs = 0
            };
        }
    }

    private enum ConvertType
    {
        Html,
        Markdown,
        PlainText
    }

    private async Task<LexicalConvertResult> ConvertAsync(string lexicalJson, ConvertType type, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(lexicalJson))
        {
            return new LexicalConvertResult
            {
                Success = true,
                Result = string.Empty,
                ProcessingTimeMs = 0
            };
        }

        try
        {
            var request = new ConvertRequest { LexicalJson = lexicalJson };

            ConvertResponse response = type switch
            {
                ConvertType.Html => await _client.ToHtmlAsync(request, cancellationToken: cancellationToken),
                ConvertType.Markdown => await _client.ToMarkdownAsync(request, cancellationToken: cancellationToken),
                ConvertType.PlainText => await _client.ToPlainTextAsync(request, cancellationToken: cancellationToken),
                _ => throw new ArgumentOutOfRangeException(nameof(type), type, null)
            };

            if (response.UnknownNodes.Count > 0)
            {
                _logger.LogWarning(
                    "Unknown nodes detected during {Type} conversion: {UnknownNodes}",
                    type,
                    string.Join(", ", response.UnknownNodes)
                );
            }

            return new LexicalConvertResult
            {
                Success = response.Success,
                Result = response.Result,
                ErrorMessage = response.HasErrorMessage ? response.ErrorMessage : null,
                ProcessingTimeMs = response.ProcessingTimeMs,
                UnknownNodes = [.. response.UnknownNodes]
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to convert Lexical JSON to {Type}", type);

            return new LexicalConvertResult
            {
                Success = false,
                Result = string.Empty,
                ErrorMessage = ex.Message,
                ProcessingTimeMs = 0
            };
        }
    }

    /// <summary>
    /// リソースを解放する
    /// </summary>
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// リソースを解放する
    /// </summary>
    /// <param name="disposing">マネージドリソースも解放するか</param>
    protected virtual void Dispose(bool disposing)
    {
        if (_disposed)
        {
            return;
        }

        if (disposing)
        {
            _channel.Dispose();
        }

        _disposed = true;
    }
}