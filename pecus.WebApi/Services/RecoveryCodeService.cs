using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;

namespace Pecus.Services;

/// <summary>
/// パスキーを失った場合に使うリカバリーコードの発行・検証を担当する
/// </summary>
/// <remarks>
/// コードは平文保存せず、サーバー側の鍵（pepper）を使った HMAC-SHA256 のみを保存する。
/// 使用は 1 回限りで、使用時は全セッションを失効させる。
/// </remarks>
public class RecoveryCodeService
{
    /// <summary>
    /// 1 回の発行で生成するコード数
    /// </summary>
    public const int CodeCount = 10;

    /// <summary>
    /// 発行時に必ず表示する案内文
    /// </summary>
    public const string StorageInstruction =
        "リカバリーコードはこの画面でしか表示されません。必ず別のデバイス（スマートフォンのメモ帳など）に保存するか、印刷して保管してください。"
        + "同じデバイスだけに保存すると、デバイスの紛失時に復旧できなくなります。";

    private const string Alphabet = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
    private const int CodeLength = 10;
    private const int GroupSize = 5;

    private readonly ApplicationDbContext _context;
    private readonly byte[] _pepper;
    private readonly ILogger<RecoveryCodeService> _logger;

    public RecoveryCodeService(
        ApplicationDbContext context,
        WebAuthnSettings settings,
        ILogger<RecoveryCodeService> logger)
    {
        _context = context;
        _pepper = Encoding.UTF8.GetBytes(settings.RecoveryCodePepper);
        _logger = logger;
    }

    /// <summary>
    /// 既存の未使用コードを破棄し、新しいコードを発行する（平文はこの戻り値でのみ取得できる）
    /// </summary>
    public async Task<List<string>> IssueAsync(int userId, CancellationToken cancellationToken = default)
    {
        var existing = await _context
            .UserRecoveryCodes
            .Where(c => c.UserId == userId)
            .ToListAsync(cancellationToken);

        if (existing.Count > 0)
        {
            _context.UserRecoveryCodes.RemoveRange(existing);
        }

        var plainCodes = new List<string>(CodeCount);
        for (var i = 0; i < CodeCount; i++)
        {
            var code = GenerateCode();
            plainCodes.Add(Format(code));
            _context.UserRecoveryCodes.Add(new UserRecoveryCode
            {
                UserId = userId,
                CodeHash = Hash(code),
                CreatedAt = DateTimeOffset.UtcNow,
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "リカバリーコードを発行しました。UserId: {UserId}, Count: {Count}",
            userId,
            CodeCount);

        return plainCodes;
    }

    /// <summary>
    /// 入力されたコードを検証し、該当する未使用コードの ID を返す
    /// </summary>
    /// <returns>一致する未使用コードの ID。一致しない場合は null</returns>
    public async Task<int?> VerifyAsync(
        int userId,
        string code,
        CancellationToken cancellationToken = default)
    {
        var normalized = Normalize(code);
        if (normalized.Length == 0)
        {
            return null;
        }

        var hash = Hash(normalized);
        var entity = await _context
            .UserRecoveryCodes
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.UserId == userId && c.CodeHash == hash && c.UsedAt == null,
                cancellationToken);

        return entity?.Id;
    }

    /// <summary>
    /// コードを使用済みにする
    /// </summary>
    public async Task<bool> MarkUsedAsync(int codeId, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var affected = await _context
            .UserRecoveryCodes
            .Where(c => c.Id == codeId && c.UsedAt == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(c => c.UsedAt, now),
                cancellationToken);

        return affected > 0;
    }

    /// <summary>
    /// 未使用のコードが残っているか
    /// </summary>
    public async Task<bool> HasUnusedCodeAsync(int userId, CancellationToken cancellationToken = default) =>
        await _context.UserRecoveryCodes.AnyAsync(
            c => c.UserId == userId && c.UsedAt == null,
            cancellationToken);

    private string Hash(string normalizedCode)
    {
        using var hmac = new HMACSHA256(_pepper);
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(normalizedCode)));
    }

    private static string GenerateCode()
    {
        var chars = new char[CodeLength];
        for (var i = 0; i < CodeLength; i++)
        {
            chars[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        }

        return new string(chars);
    }

    private static string Format(string code) =>
        $"{code[..GroupSize]}-{code[GroupSize..]}";

    private static string Normalize(string code) =>
        new(code
            .Where(c => !char.IsWhiteSpace(c) && c != '-')
            .Select(char.ToUpperInvariant)
            .ToArray());
}
