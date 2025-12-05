using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;

namespace Pecus.Services;

/// <summary>
/// メールアドレス変更サービス
/// </summary>
/// <remarks>
/// メールアドレス変更のトークンベース検証フローを管理します。
/// セキュリティのため、変更前のメールアドレスに確認メールを送信します。
/// </remarks>
public class EmailChangeService
{
    private readonly ApplicationDbContext _context;

    public EmailChangeService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// メールアドレス変更リクエストを作成
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="request">メールアドレス変更リクエスト</param>
    /// <returns>成功時はトークン情報、失敗時は null</returns>
    /// <exception cref="NotFoundException">ユーザーが見つからない場合</exception>
    /// <exception cref="DuplicateException">新しいメールアドレスが既に使用されている場合</exception>
    /// <exception cref="InvalidOperationException">パスワードが一致しない場合</exception>
    public async Task<EmailChangeRequestResponse> RequestEmailChangeAsync(
        int userId,
        RequestEmailChangeRequest request
    )
    {
        // ユーザーを取得
        var user = await _context
            .Users.Where(u => u.Id == userId && u.IsActive)
            .FirstOrDefaultAsync();

        if (user == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // 現在のパスワードを検証
        if (!UserService.VerifyPasswordPublic(request.CurrentPassword, user.PasswordHash))
        {
            throw new InvalidOperationException("現在のパスワードが正しくありません。");
        }

        // 新しいメールアドレスが現在と同じでないことを確認
        if (user.Email.Equals(request.NewEmail, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "新しいメールアドレスは現在のメールアドレスと異なる必要があります。"
            );
        }

        // 新しいメールアドレスが既に使用されていないか確認
        var emailExists = await _context.Users.AnyAsync(u =>
            u.Email == request.NewEmail && u.Id != userId
        );

        if (emailExists)
        {
            throw new DuplicateException("このメールアドレスは既に使用されています。");
        }

        // 既存の未使用トークンがあれば削除
        var existingTokens = await _context
            .EmailChangeTokens.Where(t => t.UserId == userId && !t.IsUsed)
            .ToListAsync();

        if (existingTokens.Any())
        {
            _context.EmailChangeTokens.RemoveRange(existingTokens);
        }

        // 新しいトークンを生成（24時間有効）
        var token = GenerateEmailChangeToken();
        var expiresAt = DateTime.UtcNow.AddHours(24);

        var emailChangeToken = new EmailChangeToken
        {
            UserId = userId,
            NewEmail = request.NewEmail,
            Token = token,
            ExpiresAt = expiresAt,
            IsUsed = false,
            CreatedAt = DateTime.UtcNow,
        };

        _context.EmailChangeTokens.Add(emailChangeToken);
        await _context.SaveChangesAsync();

        return new EmailChangeRequestResponse
        {
            Message = "確認メールを送信しました。メールに記載されたリンクをクリックして変更を完了してください。",
            NewEmail = request.NewEmail,
            ExpiresAt = expiresAt,
            Token = token, // メール送信用にトークンを返す
        };
    }

    /// <summary>
    /// メールアドレス変更トークンを検証して変更を実行
    /// </summary>
    /// <param name="request">検証リクエスト</param>
    /// <returns>成功時は変更情報、失敗時は null</returns>
    /// <exception cref="NotFoundException">トークンが無効または期限切れの場合</exception>
    /// <exception cref="DuplicateException">メールアドレスが既に使用されている場合</exception>
    public async Task<EmailChangeVerifyResponse> VerifyEmailChangeAsync(
        VerifyEmailChangeRequest request
    )
    {
        // トークンを検証
        var tokenRecord = await _context
            .EmailChangeTokens.Include(t => t.User)
            .FirstOrDefaultAsync(t =>
                t.Token == request.Token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow
            );

        if (tokenRecord == null)
        {
            throw new NotFoundException("無効または期限切れの確認トークンです。");
        }

        var user = tokenRecord.User;

        if (user == null || !user.IsActive)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // 新しいメールアドレスが既に使用されていないか再確認（競合回避）
        var emailExists = await _context.Users.AnyAsync(u =>
            u.Email == tokenRecord.NewEmail && u.Id != user.Id
        );

        if (emailExists)
        {
            throw new DuplicateException("このメールアドレスは既に使用されています。");
        }

        // トランザクション開始
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // メールアドレスを更新
            user.Email = tokenRecord.NewEmail;
            user.UpdatedAt = DateTime.UtcNow;

            // トークンを使用済みにする
            tokenRecord.IsUsed = true;
            tokenRecord.UsedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new EmailChangeVerifyResponse
            {
                Message = "メールアドレスの変更が完了しました。",
                NewEmail = tokenRecord.NewEmail,
                ChangedAt = DateTime.UtcNow,
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// ユーザーの未使用トークン情報を取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>未使用トークン情報、存在しない場合は null</returns>
    public async Task<EmailChangeToken?> GetPendingTokenAsync(int userId)
    {
        return await _context
            .EmailChangeTokens.Where(t => t.UserId == userId && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// メールアドレス変更トークンを生成
    /// </summary>
    private static string GenerateEmailChangeToken()
    {
        // GUIDベースのトークン生成（URLセーフ、64文字以内）
        return Guid.NewGuid().ToString("N"); // 32文字（ハイフンなし）
    }
}