using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.DB.Models;
using System.Security.Cryptography;
using System.Text;

namespace Pecus.Libs.DB.Services;

/// <summary>
/// 外部公開API用のAPIキー管理サービス
/// キーの発行（平文は発行時のみ返却）、検証、失効、一覧取得を担当する。
/// </summary>
public class ExternalApiKeyService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ExternalApiKeyService> _logger;

    /// <summary>
    /// APIキーのランダムバイト長（32バイト = 256ビット）
    /// </summary>
    private const int KeyLengthBytes = 32;

    /// <summary>
    /// デフォルト有効期限（日数）
    /// </summary>
    private const int DefaultExpirationDays = 365;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    public ExternalApiKeyService(
        ApplicationDbContext context,
        ILogger<ExternalApiKeyService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// APIキーを新規発行する。
    /// 戻り値のタプルにのみ平文キーが含まれ、以降は取得不可。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="createdByUserId">作成者ユーザーID</param>
    /// <param name="name">キー名（用途識別用）</param>
    /// <param name="expirationDays">有効期限（日数）。省略時は365日</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>作成されたエンティティと平文キーのタプル</returns>
    public async Task<(ExternalApiKey Entity, string RawKey)> CreateAsync(
        int organizationId,
        int createdByUserId,
        string name,
        int? expirationDays = null,
        CancellationToken cancellationToken = default)
    {
        var rawKey = GenerateRawKey();
        var keyHash = ComputeHash(rawKey);
        var keyPrefix = rawKey[..8];

        var entity = new ExternalApiKey
        {
            OrganizationId = organizationId,
            Name = name,
            KeyPrefix = keyPrefix,
            KeyHash = keyHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(expirationDays ?? DefaultExpirationDays),
            IsRevoked = false,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _context.ExternalApiKeys.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "External API key created: KeyId={KeyId}, Organization={OrgId}, Prefix={Prefix}",
            entity.Id, organizationId, keyPrefix);

        return (entity, rawKey);
    }

    /// <summary>
    /// APIキーを検証し、有効なエンティティを返す。
    /// 無効（不一致・失効済み・期限切れ）の場合は null を返す。
    /// </summary>
    /// <param name="rawKey">クライアントから送信された平文キー</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>有効なAPIキーエンティティ、または null</returns>
    public async Task<ExternalApiKey?> ValidateAsync(
        string rawKey,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(rawKey))
            return null;

        var keyHash = ComputeHash(rawKey);

        var entity = await _context.ExternalApiKeys
            .Include(e => e.Organization)
            .FirstOrDefaultAsync(
                e => e.KeyHash == keyHash && !e.IsRevoked,
                cancellationToken);

        if (entity is null)
            return null;

        if (entity.ExpiresAt < DateTimeOffset.UtcNow)
        {
            _logger.LogWarning("Expired API key used: KeyId={KeyId}", entity.Id);
            return null;
        }

        return entity;
    }

    /// <summary>
    /// APIキーを失効させる。
    /// </summary>
    /// <param name="keyId">APIキーID</param>
    /// <param name="organizationId">組織ID（所属確認用）</param>
    /// <param name="revokedByUserId">失効操作者のユーザーID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    public async Task RevokeAsync(
        int keyId,
        int organizationId,
        int revokedByUserId,
        CancellationToken cancellationToken = default)
    {
        var entity = await _context.ExternalApiKeys
            .FirstOrDefaultAsync(
                e => e.Id == keyId && e.OrganizationId == organizationId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"API key not found: {keyId}");

        entity.IsRevoked = true;
        entity.RevokedByUserId = revokedByUserId;
        entity.RevokedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("External API key revoked: KeyId={KeyId}, RevokedBy={UserId}", keyId, revokedByUserId);
    }

    /// <summary>
    /// 組織のAPIキー一覧を取得する（作成日降順）。
    /// </summary>
    /// <param name="organizationId">組織ID</param>
    /// <param name="cancellationToken">キャンセルトークン</param>
    /// <returns>APIキー一覧</returns>
    public async Task<List<ExternalApiKey>> ListAsync(
        int organizationId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ExternalApiKeys
            .Include(e => e.CreatedByUser)
            .Include(e => e.RevokedByUser)
            .Where(e => e.OrganizationId == organizationId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// URL-safe なランダムAPIキーを生成する。
    /// プレフィックス "pcs_" を付与して識別性を高める。
    /// </summary>
    private static string GenerateRawKey()
    {
        var bytes = RandomNumberGenerator.GetBytes(KeyLengthBytes);
        var base64 = Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
        return $"pcs_{base64}";
    }

    /// <summary>
    /// 平文キーのSHA-256ハッシュを計算してBase64文字列で返す。
    /// </summary>
    private static string ComputeHash(string rawKey)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey));
        return Convert.ToBase64String(bytes);
    }
}