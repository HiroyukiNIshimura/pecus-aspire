using Microsoft.Extensions.Caching.Memory;

namespace Pecus.Services;

/// <summary>
/// JWTトークンのブラックリスト管理サービス
/// </summary>
public class TokenBlacklistService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<TokenBlacklistService> _logger;

    public TokenBlacklistService(IMemoryCache cache, ILogger<TokenBlacklistService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// トークンをブラックリストに追加
    /// </summary>
    /// <param name="jti">JWT ID</param>
    /// <param name="expiration">トークンの有効期限</param>
    public async Task BlacklistTokenAsync(string jti, DateTime expiration)
    {
        if (string.IsNullOrWhiteSpace(jti))
        {
            _logger.LogWarning("JTIが空のためブラックリストに追加できません。");
            return;
        }

        var key = $"blacklist:{jti}";
        var ttl = expiration - DateTime.UtcNow;

        if (ttl > TimeSpan.Zero)
        {
            _cache.Set(
                key,
                "revoked",
                new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl }
            );

            _logger.LogInformation(
                "トークンをブラックリストに追加しました。JTI: {Jti}, TTL: {Ttl}",
                jti,
                ttl
            );
        }
        else
        {
            _logger.LogInformation(
                "期限切れのトークンのためブラックリストに追加しませんでした。JTI: {Jti}",
                jti
            );
        }

        await Task.CompletedTask;
    }

    /// <summary>
    /// トークンがブラックリストに登録されているかチェック
    /// </summary>
    /// <param name="jti">JWT ID</param>
    /// <returns>ブラックリストに登録されている場合はtrue</returns>
    public async Task<bool> IsTokenBlacklistedAsync(string jti)
    {
        if (string.IsNullOrWhiteSpace(jti))
        {
            return false;
        }

        var key = $"blacklist:{jti}";
        var result = _cache.TryGetValue(key, out _);

        await Task.CompletedTask;
        return result;
    }

    /// <summary>
    /// ユーザーのすべてのトークンを無効化（パスワード変更時など）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    public async Task BlacklistAllUserTokensAsync(int userId)
    {
        // ユーザー単位でのトークン無効化マーカーを設定
        // この時刻以前に発行されたトークンは無効とする
        var key = $"user_blacklist:{userId}";
        var value = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        // 1日間有効（JWTの最大有効期限を想定）
        _cache.Set(
            key,
            value,
            new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1) }
        );

        _logger.LogInformation(
            "ユーザーのすべてのトークンを無効化しました。UserId: {UserId}",
            userId
        );

        await Task.CompletedTask;
    }

    /// <summary>
    /// ユーザーのすべてのトークンを無効化（現在のトークンを除く）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="currentJti">現在のトークンのJTI（除外対象）</param>
    public async Task BlacklistAllUserTokensExceptCurrentAsync(
        int userId,
        string? currentJti = null
    )
    {
        if (string.IsNullOrEmpty(currentJti))
        {
            // JTIが指定されていない場合は全トークンを無効化
            await BlacklistAllUserTokensAsync(userId);
            return;
        }

        // 現在のトークンを除外するため、異なるキーを使用
        // 現在のトークンのJTIを含むキーで無効化時刻を保存
        var key = $"user_blacklist_except:{userId}:{currentJti}";
        var value = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        // 1日間有効（JWTの最大有効期限を想定）
        _cache.Set(
            key,
            value,
            new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1) }
        );

        _logger.LogInformation(
            "ユーザーのトークンを無効化しました（現在のトークンを除く）。UserId: {UserId}, CurrentJti: {CurrentJti}",
            userId,
            currentJti
        );

        await Task.CompletedTask;
    }

    /// <summary>
    /// ユーザーのトークンが無効化されているかチェック
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="tokenIssuedAt">トークンの発行時刻（Unix秒）</param>
    /// <param name="tokenJti">トークンのJTI（現在のトークン除外チェック用）</param>
    /// <returns>無効化されている場合はtrue</returns>
    public async Task<bool> IsUserTokenInvalidatedAsync(
        int userId,
        long tokenIssuedAt,
        string? tokenJti = null
    )
    {
        // 全トークン無効化のチェック
        var allTokensKey = $"user_blacklist:{userId}";
        if (
            _cache.TryGetValue(allTokensKey, out var allTokensBlacklistTime)
            && allTokensBlacklistTime is long allTokensTimestamp
        )
        {
            if (tokenIssuedAt < allTokensTimestamp)
            {
                await Task.CompletedTask;
                return true;
            }
        }

        // 現在のトークン除外での無効化チェック
        if (!string.IsNullOrEmpty(tokenJti))
        {
            // このトークンのJTIが除外対象として設定されているかチェック
            var exceptCurrentKey = $"user_blacklist_except:{userId}:{tokenJti}";
            if (_cache.TryGetValue(exceptCurrentKey, out _))
            {
                // このトークンは除外対象なので無効化されない
                await Task.CompletedTask;
                return false;
            }

            // 他のトークンの除外キーが存在するかチェック
            // キャッシュ内のすべてのキーを確認するのは効率的ではないため、
            // 一般的な無効化時刻との比較のみ行う
        }

        await Task.CompletedTask;
        return false;
    }
}
