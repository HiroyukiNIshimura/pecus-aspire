using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.AI.Configuration;
using Pecus.Libs.AI.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.AI.Provider.Default;

/// <summary>
/// システムデフォルトAIクライアント
/// 設定により Anthropic / DeepSeek / Gemini / OpenAI から選択可能
/// IAiClientFactory に委譲することで、新規プロバイダー追加時の変更を不要にする
/// </summary>
public class DefaultAiClient : IDefaultAiClient
{
    private readonly IAiClient _innerClient;
    private readonly ILogger<DefaultAiClient> _logger;
    private readonly GenerativeApiVendor _provider;

    /// <summary>
    /// コンストラクタ
    /// IAiClientFactory に委譲してクライアントを生成
    /// </summary>
    public DefaultAiClient(
        IAiClientFactory aiClientFactory,
        IOptions<DefaultAiSettings> defaultAiSettings,
        ILogger<DefaultAiClient> logger)
    {
        _logger = logger;

        var settings = defaultAiSettings.Value;
        _provider = settings.Provider;

        // バリデーション
        if (settings.Provider == GenerativeApiVendor.None)
        {
            throw new InvalidOperationException(
                "DefaultAi:Provider が設定されていません。appsettings.json で設定してください。");
        }
        if (string.IsNullOrEmpty(settings.ApiKey))
        {
            throw new InvalidOperationException(
                "DefaultAi:ApiKey が設定されていません。appsettings.json で設定してください。");
        }
        if (string.IsNullOrEmpty(settings.Model))
        {
            throw new InvalidOperationException(
                "DefaultAi:Model が設定されていません。appsettings.json で設定してください。");
        }

        // IAiClientFactory に委譲してクライアントを生成
        // これにより新規プロバイダー追加時に DefaultAiClient の変更が不要
        _innerClient = aiClientFactory.CreateClient(settings.Provider, settings.ApiKey, settings.Model)
            ?? throw new InvalidOperationException(
                $"サポートされていないプロバイダー: {settings.Provider}");

        _logger.LogInformation(
            "DefaultAiClient initialized with provider: {Provider}, model: {Model}",
            _provider,
            settings.Model);
    }

    /// <inheritdoc />
    public Task<string> GenerateTextAsync(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("DefaultAiClient.GenerateTextAsync using provider: {Provider}", _provider);
        return _innerClient.GenerateTextAsync(systemPrompt, userPrompt, persona, cancellationToken);
    }

    /// <inheritdoc />
    public Task<string> GenerateTextWithMessagesAsync(
        IEnumerable<(MessageRole Role, string Content)> messages,
        string? persona = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("DefaultAiClient.GenerateTextWithMessagesAsync using provider: {Provider}", _provider);
        return _innerClient.GenerateTextWithMessagesAsync(messages, persona, cancellationToken);
    }

    /// <inheritdoc />
    public Task<T> GenerateJsonAsync<T>(
        string systemPrompt,
        string userPrompt,
        string? persona = null,
        CancellationToken cancellationToken = default) where T : class
    {
        _logger.LogDebug("DefaultAiClient.GenerateJsonAsync<{Type}> using provider: {Provider}", typeof(T).Name, _provider);
        return _innerClient.GenerateJsonAsync<T>(systemPrompt, userPrompt, persona, cancellationToken);
    }

    /// <inheritdoc />
    public Task<string> GenerateMarkdownFromTitleAsync(
        string title,
        string? additionalContext = null,
        string? persona = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("DefaultAiClient.GenerateMarkdownFromTitleAsync using provider: {Provider}", _provider);
        return _innerClient.GenerateMarkdownFromTitleAsync(title, additionalContext, persona, cancellationToken);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AvailableModel>> GetAvailableModelsAsync(
        string apiKey,
        CancellationToken cancellationToken = default)
    {
        // DefaultAiClientではシステム設定のAPIキーを使用するため、
        // 引数のapiKeyは無視して内部クライアントの設定を使用
        _logger.LogDebug("DefaultAiClient.GetAvailableModelsAsync using provider: {Provider}", _provider);
        return _innerClient.GetAvailableModelsAsync(apiKey, cancellationToken);
    }
}
