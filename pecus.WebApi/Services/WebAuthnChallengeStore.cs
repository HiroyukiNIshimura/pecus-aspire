using System.Text.Json;
using StackExchange.Redis;

namespace Pecus.Services;

/// <summary>
/// WebAuthn チャレンジの用途
/// </summary>
public enum WebAuthnChallengePurpose
{
    /// <summary>
    /// パスキー登録
    /// </summary>
    Registration,

    /// <summary>
    /// パスキー認証（ログイン）
    /// </summary>
    Authentication,

    /// <summary>
    /// リカバリーコード検証後のパスキー再登録
    /// </summary>
    Recovery,
}

/// <summary>
/// Redis に保存する WebAuthn チャレンジ
/// </summary>
/// <param name="UserId">対象ユーザー（登録時は確定済み、認証時は識別済みのユーザー）</param>
/// <param name="Purpose">用途</param>
/// <param name="Payload">Fido2 のオプションをシリアライズした JSON</param>
/// <param name="Reference">登録手段の識別情報（セットアップトークンやリカバリーコードID など）</param>
/// <param name="ExpiresAt">有効期限</param>
public sealed record WebAuthnChallengeEntry(
    int? UserId,
    string Purpose,
    string Payload,
    string? Reference,
    DateTimeOffset ExpiresAt);

/// <summary>
/// WebAuthn チャレンジの保管庫
/// </summary>
/// <remarks>
/// チャレンジは必ずサーバー側で保持し、検証時にワンタイムで消費する（リプレイ対策）。
/// ステートレスな署名付きチャレンジは採用しない。
/// </remarks>
public class WebAuthnChallengeStore
{
    private static readonly TimeSpan DefaultChallengeTtl = TimeSpan.FromMinutes(5);
    private const string KeyPrefix = "webauthn:challenge:";

    private readonly IDatabase _db;
    private readonly ILogger<WebAuthnChallengeStore> _logger;

    public WebAuthnChallengeStore(IConnectionMultiplexer redis, ILogger<WebAuthnChallengeStore> logger)
    {
        _db = redis.GetDatabase();
        _logger = logger;
    }

    /// <summary>
    /// チャレンジを保存し、クライアントへ返す識別子を生成する
    /// </summary>
    public async Task<string> StoreAsync(
        string payload,
        WebAuthnChallengePurpose purpose,
        int? userId,
        CancellationToken cancellationToken = default,
        string? reference = null,
        TimeSpan? ttl = null)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var effectiveTtl = ttl ?? DefaultChallengeTtl;
        var challengeId = Guid.NewGuid().ToString("N");
        var entry = new WebAuthnChallengeEntry(
            userId,
            purpose.ToString(),
            payload,
            reference,
            DateTimeOffset.UtcNow.Add(effectiveTtl));

        await _db.StringSetAsync(GetKey(challengeId), JsonSerializer.Serialize(entry), effectiveTtl);
        return challengeId;
    }

    /// <summary>
    /// チャレンジを消費せずに取得する（有効性の確認用）
    /// </summary>
    /// <remarks>
    /// リカバリートークンのように「後続の処理が成功するまで失効させたくない」用途で使用する。
    /// </remarks>
    public async Task<WebAuthnChallengeEntry?> PeekAsync(
        string? challengeId,
        WebAuthnChallengePurpose purpose)
    {
        if (string.IsNullOrWhiteSpace(challengeId) || !Guid.TryParseExact(challengeId, "N", out _))
        {
            return null;
        }

        var json = await _db.StringGetAsync(GetKey(challengeId));
        if (json.IsNullOrEmpty)
        {
            return null;
        }

        return ParseEntry(json.ToString(), purpose);
    }

    /// <summary>
    /// チャレンジをワンタイムで消費する
    /// </summary>
    /// <returns>消費できた場合は保存内容、存在しない・期限切れ・用途不一致の場合は null</returns>
    public async Task<WebAuthnChallengeEntry?> ConsumeAsync(
        string? challengeId,
        WebAuthnChallengePurpose purpose)
    {
        if (string.IsNullOrWhiteSpace(challengeId) || !Guid.TryParseExact(challengeId, "N", out _))
        {
            return null;
        }

        // GETDEL で取得と削除を原子的に行い、二重利用を防ぐ
        var json = await _db.StringGetDeleteAsync(GetKey(challengeId));
        if (json.IsNullOrEmpty)
        {
            return null;
        }

        return ParseEntry(json.ToString(), purpose);
    }

    private WebAuthnChallengeEntry? ParseEntry(string? json, WebAuthnChallengePurpose purpose)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        WebAuthnChallengeEntry? entry;
        try
        {
            entry = JsonSerializer.Deserialize<WebAuthnChallengeEntry>(json);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "WebAuthn チャレンジのデシリアライズに失敗しました。");
            return null;
        }

        if (entry == null || !string.Equals(entry.Purpose, purpose.ToString(), StringComparison.Ordinal))
        {
            return null;
        }

        if (entry.ExpiresAt < DateTimeOffset.UtcNow)
        {
            return null;
        }

        return entry;
    }

    private static string GetKey(string challengeId) => $"{KeyPrefix}{challengeId}";
}
